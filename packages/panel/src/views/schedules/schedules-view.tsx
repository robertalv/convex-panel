/**
 * TODO: 
 * 3- add the menu to view the arguments and cancel the function,
 * 5- Implement a better way of finding Paused Live data
 */
import { ConvexReactClient } from 'convex/react';
import {
  Trash2,
  Search,
  Code,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import { MultiSelectComponentSelector } from '../../components/function-runner/multi-select-component-selector';
import { MultiSelectFunctionSelector } from '../../components/function-runner/multi-select-function-selector';

import { useComponents } from '../../hooks/useComponents';
import { useCronJobs } from '../../hooks/useCronJobs';
import { usePaginatedScheduledJobs } from '../../hooks/usePaginatedScheduledJobs';
// import { logsViewStyles } from '../../styles/panelStyles';
import { formatCronSchedule, formatRelativeTime } from '../../utils/cronFormatters';
import { discoverFunctions } from '../../utils/api/functionDiscovery';
import type { ModuleFunction } from '../../utils/api/functionDiscovery';
import type { CustomQuery } from '../../types/functions';
import type { MultiSelectValue } from '../../types/common';
import { copyToClipboard } from '../../utils/toast';
import { CronArgumentsSheet } from './components/cron-arguments-sheet';
import { CronExecutionsView } from './components/cron-executions-view';
import { ScheduledJobArgumentsSheet } from './components/scheduled-job-arguments-sheet';
import { EmptyScheduledJobsState } from './components/empty-scheduled-jobs-state';
import { EmptyCronJobsState } from './components/empty-cron-jobs-state';
import { CronsFileSheet } from './components/crons-file-sheet';
import type { CronJobWithRuns } from '../../lib/common-types';
import { IconButton } from '../../components/shared';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { cancelScheduledJob, cancelAllScheduledJobs } from '../../utils/api/scheduledJobs';
import { getAdminClientInfo } from '../../utils/adminClient';
import { fetchSourceCode } from '../../utils/api/functions';

export interface SchedulesViewProps {
  adminClient?: any;
  useMockData?: boolean;
}

const formatTimestamp = (timestamp: number | bigint): string => {
  try {
    // Handle BigInt (nanoseconds) by converting to milliseconds
    const ms = typeof timestamp === 'bigint'
      ? Number(timestamp) / 1000000
      : timestamp;

    const date = new Date(ms);
    return date.toLocaleString();
  } catch (e) {
    console.error('Error formatting timestamp:', e);
    return '-';
  }
};

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  adminClient,
  useMockData = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<'scheduled' | 'cron'>('scheduled');
  const [listHeight, setListHeight] = useState(600);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCancelAllDialog, setShowCancelAllDialog] = useState(false);
  const [isCancelingAll, setIsCancelingAll] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCronsFile, setShowCronsFile] = useState(false);
  const [cronsFileSourceCode, setCronsFileSourceCode] = useState<string | null>(null);
  const [isLoadingCronsFile, setIsLoadingCronsFile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const {
    componentNames: componentList,
    selectedComponentId,
    selectedComponent,
    setSelectedComponent,
  } = useComponents({
    adminClient,
    useMockData,
  });

  const uniqueComponentList = useMemo(() => {
    return Array.from(new Set(componentList));
  }, [componentList]);

  const [selectedComponents, setSelectedComponents] = useState<MultiSelectValue>('all');

  useEffect(() => {
    if (uniqueComponentList.length > 0) {
      const currentSelection = selectedComponents === 'all' ? uniqueComponentList : (selectedComponents as string[]);
      const hasAllComponents = uniqueComponentList.every(name => currentSelection.includes(name));
      if (selectedComponents === 'all' || currentSelection.length === 0 || !hasAllComponents) {
        setSelectedComponents('all');
      }
    }
  }, [uniqueComponentList]); // eslint-disable-line react-hooks/exhaustive-deps

  const [functions, setFunctions] = useState<ModuleFunction[]>([]);
  const [, setIsLoadingFunctions] = useState(false);

  useEffect(() => {
    if (!adminClient || useMockData) return;

    setIsLoadingFunctions(true);
    discoverFunctions(adminClient, useMockData)
      .then((funcs) => {
        setFunctions(funcs);
      })
      .catch((error) => {
        console.error('Error fetching functions:', error);
        setFunctions([]);
      })
      .finally(() => {
        setIsLoadingFunctions(false);
      });
  }, [adminClient, useMockData]);

  const [selectedFunctions, setSelectedFunctions] = useState<(ModuleFunction | CustomQuery)[]>([]);

  useEffect(() => {
    if (functions.length > 0 && selectedFunctions.length === 0) {
      const normalizedComponentId = selectedComponent === 'app' ? null : selectedComponent;
      
      const filteredFuncs = functions.filter((fn: ModuleFunction) => {
        if (!normalizedComponentId) {
          return fn.componentId === null || fn.componentId === undefined;
        } else {
          return (
            (!!fn.identifier && fn.identifier.startsWith(`${normalizedComponentId}:`)) ||
            fn.componentId === normalizedComponentId
          );
        }
      });
      
      if (filteredFuncs.length > 0) {
        setSelectedFunctions(filteredFuncs);
      }
    }
  }, [functions, selectedComponent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const toolbarHeight = 48;
        const tabsHeight = 49;
        const tableHeaderHeight = 40;
        const availableHeight = containerRect.height - toolbarHeight - tabsHeight - tableHeaderHeight;
        if (availableHeight > 0) {
          setListHeight(availableHeight);
        }
      }
    };

    const timeoutId = setTimeout(updateHeight, 0);
    const resizeObserver = new ResizeObserver(updateHeight);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Fetch crons.js source code when showCronsFile is true
  useEffect(() => {
    if (!showCronsFile || !adminClient || useMockData) {
      return;
    }

    const loadCronsFile = async () => {
      try {
        setIsLoadingCronsFile(true);
        const clientInfo = getAdminClientInfo(adminClient);
        const { deploymentUrl, adminKey } = clientInfo;

        if (!deploymentUrl || !adminKey) {
          console.error('Missing deployment URL or admin key');
          setCronsFileSourceCode(null);
          return;
        }

        const normalizedComponentId = selectedComponentId === 'app' ? null : selectedComponentId;
        const sourceCode = await fetchSourceCode(
          deploymentUrl,
          adminKey,
          'crons.js',
          normalizedComponentId
        );
        setCronsFileSourceCode(sourceCode);
      } catch (error) {
        console.error('Failed to fetch crons.js source code:', error);
        setCronsFileSourceCode(null);
      } finally {
        setIsLoadingCronsFile(false);
      }
    };

    loadCronsFile();
  }, [showCronsFile, adminClient, useMockData, selectedComponentId]);

  return (
    <div ref={containerRef} className="cp-schedules-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-panel-bg)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px',
        borderBottom: '1px solid var(--color-panel-border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: 'var(--color-panel-bg)',
      }}>
        {uniqueComponentList && uniqueComponentList.length > 0 && (
          <div style={{ width: '192px' }}>
            <MultiSelectComponentSelector
              selectedComponents={selectedComponents}
              onSelect={(components) => {
                setSelectedComponents(components);
                setSelectedFunctions([]); // Reset functions when component changes
                // Also update the single component selector for compatibility
                const componentsArray = components === 'all' ? uniqueComponentList : (components as string[]);
                if (componentsArray.length === 1) {
                  setSelectedComponent(componentsArray[0]);
                } else if (componentsArray.length === 0) {
                  setSelectedComponent(null);
                } else {
                  // Multiple selected - keep the first one for function selector
                  setSelectedComponent(componentsArray[0]);
                }
              }}
              components={uniqueComponentList}
            />
          </div>
        )}
        <div style={{ width: '240px' }}>
          <MultiSelectFunctionSelector
            selectedFunctions={selectedFunctions}
            onSelect={(fns) => setSelectedFunctions(fns)}
            functions={functions}
            componentId={selectedComponent}
          />
        </div>
        <div style={{ flex: 1, maxWidth: '384px' }}>
          <div className="cp-search-wrapper">
            <Search size={14} className="cp-search-icon" />
            <input
              type="text"
              placeholder={selectedTab === 'cron' ? 'Lookup by name' : 'Lookup by ID'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cp-search-input"
            />
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="cp-schedules-cancel-btn"
            onClick={() => setShowCancelAllDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'color-mix(in srgb, var(--color-background-error) 10%, transparent)',
              border: '1px solid var(--color-background-error)',
              borderRadius: '8px',
              color: 'var(--color-panel-text)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-background-error) 30%, var(--color-panel-bg-tertiary))';
              e.currentTarget.style.borderColor = 'var(--color-background-error)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-background-error) 10%, transparent)';
              e.currentTarget.style.borderColor = 'var(--color-background-error)';
            }}
          >
            <Trash2 size={12} />
            Cancel All {selectedFunctions.length === 1 && !('type' in selectedFunctions[0]) && '(for the selected function)'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        borderBottom: '1px solid var(--color-panel-border)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '-4px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedTab('scheduled')}
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'color 0.15s',
              borderBottom: selectedTab === 'scheduled' ? '2px solid var(--color-panel-accent)' : '2px solid transparent',
              color: selectedTab === 'scheduled' ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (selectedTab !== 'scheduled') {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTab !== 'scheduled') {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
              }
            }}
          >
            Scheduled Functions
          </button>
          <button
            onClick={() => setSelectedTab('cron')}
            style={{
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'color 0.15s',
              borderBottom: selectedTab === 'cron' ? '2px solid var(--color-panel-accent)' : '2px solid transparent',
              color: selectedTab === 'cron' ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (selectedTab !== 'cron') {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTab !== 'cron') {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
              }
            }}
          >
            Cron Jobs
          </button>
        </div>
        {selectedTab === 'cron' && (
          <button
            onClick={() => setShowCronsFile(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              marginRight: '12px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              color: 'var(--color-panel-text)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--color-panel-border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--color-panel-border)';
            }}
          >
            <Code size={12} />
            Show crons.js
          </button>
        )}
      </div>

      {/* Scheduled Functions View */}
      <ScheduledFunctionView
        adminClient={adminClient}
        selectedComponentId={selectedComponentId}
        selectedFunctions={selectedFunctions}
        selectedTab={selectedTab}
        listHeight={listHeight}
        functions={functions}
        searchQuery={searchQuery}
        refreshTrigger={refreshTrigger}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
      />

      {/* Crons jobs Activity */}
      <CronsJobsFunctionView
        adminClient={adminClient}
        selectedTab={selectedTab}
        selectedComponentId={selectedComponentId}
        selectedFunctions={selectedFunctions}
        listHeight={listHeight}
        functions={functions}
        searchQuery={searchQuery}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
      />
      
      {/* Cancel All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelAllDialog}
        onClose={() => setShowCancelAllDialog(false)}
        onConfirm={async () => {
          if (!adminClient) return;
          try {
            setIsCancelingAll(true);
            const udfPath = selectedFunctions.length === 1 && !('type' in selectedFunctions[0])
              ? (selectedFunctions[0] as ModuleFunction).identifier
              : undefined;
            await cancelAllScheduledJobs(adminClient, udfPath, selectedComponentId ?? undefined);
            setShowCancelAllDialog(false);
            // Trigger a refresh by incrementing the refresh trigger
            setRefreshTrigger(prev => prev + 1);
          } catch (error) {
            console.error('Failed to cancel all jobs:', error);
          } finally {
            setIsCancelingAll(false);
          }
        }}
        title="Cancel all runs"
        message={
          <>
            <div>
              You are canceling all scheduled runs for{' '}
              {selectedFunctions.length === 1 && !('type' in selectedFunctions[0]) ? (
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {(selectedFunctions[0] as ModuleFunction).identifier}
                </span>
              ) : (
                `all functions${selectedComponentId ? ' in the selected component.' : ''}`
              )}
              .
            </div>
          </>
        }
        confirmLabel={isCancelingAll ? 'Canceling...' : 'Cancel All'}
        cancelLabel="Keep Scheduled"
        variant="danger"
        container={containerRef.current}
        disableCancel={isCancelingAll}
      />
      
      {/* Crons File Sheet */}
      <CronsFileSheet
        isOpen={showCronsFile}
        onClose={() => {
          setShowCronsFile(false);
          // Clear source code when closing to force refetch on next open
          setCronsFileSourceCode(null);
        }}
        sourceCode={cronsFileSourceCode}
        isLoading={isLoadingCronsFile}
        container={containerRef.current}
      />
    </div>
  );
};

interface Props {
  selectedFunctions: (ModuleFunction | CustomQuery)[];
  adminClient: ConvexReactClient;
  selectedTab: 'scheduled' | 'cron';
  functions: ModuleFunction[];
  selectedComponentId: string | null | undefined;
  listHeight: string | number;
  searchQuery: string;
  refreshTrigger?: number;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}


const ScheduledFunctionView = ({
  selectedFunctions,
  adminClient,
  selectedTab,
  functions,
  selectedComponentId,
  listHeight,
  searchQuery,
  refreshTrigger,
  isPaused,
  setIsPaused,
}: Props) => {
  const [selectedJobForArgs, setSelectedJobForArgs] = useState<any | null>(null);
  const [jobToCancel, setJobToCancel] = useState<any | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const udfPath = useMemo(() => {
    if (selectedFunctions.length !== 1) return undefined;
    const selectedFunction = selectedFunctions[0];
    if ('type' in selectedFunction && selectedFunction.type === 'customQuery') {
      return undefined;
    }
    return (selectedFunction as ModuleFunction).identifier;
  }, [selectedFunctions]);
  
  const { jobs, refetch } = usePaginatedScheduledJobs(
    udfPath,
    adminClient,
    isPaused,
  );

  // Trigger refetch when refreshTrigger changes (from parent component)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const filteredJobs = React.useMemo(() => {
    if (!jobs?.page) return [];
    
    let filtered = jobs.page;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job: any) => {
        const jobId = job._id?.toLowerCase() || '';
        return jobId.includes(query);
      });
    }
    
    if (selectedFunctions.length > 1) {
      const normalizeIdentifier = (id: string) => id.replace(/\.js:/g, ':').replace(/\.js$/g, '');
      const selectedIdentifiers = new Set(
        selectedFunctions
          .filter((fn): fn is ModuleFunction => !('type' in fn) || fn.type !== 'customQuery')
          .map((fn) => normalizeIdentifier(fn.identifier))
      );
      
      filtered = filtered.filter((job: any) => {
        const jobUdfPath = job.udfPath || job.component;
        if (!jobUdfPath) return false;
        const normalizedJobPath = normalizeIdentifier(jobUdfPath);
        return selectedIdentifiers.has(normalizedJobPath);
      });
    }
    
    return filtered;
  }, [jobs?.page, searchQuery, selectedFunctions]);

  const ScheduleRow = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
    try {
      const job = data.jobs[index];
      if (!job) return <div style={style}></div>;

      const functionName = job.component || job.udfPath || 'Unknown Function';
      const jobId = job._id || '-';
      const status = job.state?.type || 'pending';
      const scheduledTime = job.nextTs ? formatTimestamp(job.nextTs) : '-';
      const hasArgs = !!(job.args || job.udfArgs);
      
      const normalizeIdentifier = (id: string) => id.replace(/\.js:/g, ':').replace(/\.js$/g, '');
      const jobUdfPath = job.udfPath || job.component || '';
      const normalizedJobPath = normalizeIdentifier(jobUdfPath);
      
      const matchingFunction = data.functions?.find((fn: ModuleFunction) => {
        const normalizedFnId = normalizeIdentifier(fn.identifier);
        return normalizedFnId === normalizedJobPath && normalizedJobPath.length > 0;
      });
      
      const exactFunctionIdentifier = matchingFunction?.identifier || normalizedJobPath;
      
      const handleFunctionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (exactFunctionIdentifier && typeof window !== 'undefined') {
          localStorage.setItem('convex-panel-functions-selected-function', exactFunctionIdentifier);
          localStorage.setItem('convex-panel-functions-view-code-tab', 'true');
          window.dispatchEvent(new CustomEvent('convex-panel-navigate-to-functions-code', {
            detail: { functionIdentifier: exactFunctionIdentifier }
          }));
        }
      };

      return (
        <div
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderBottom: '1px solid var(--cp-data-row-border)',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'var(--color-panel-text-secondary)',
            backgroundColor: '',
            cursor: 'default',
            transition: 'background-color 0.35s ease',
            boxSizing: 'border-box',
          }}
        >
          <div 
            onClick={async (e) => {
              e.stopPropagation();
              await copyToClipboard(jobId, 'ID copied to clipboard!');
            }}
            style={{
              width: '25%',
              color: 'var(--color-panel-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-text)';
            }}
            title="Click to copy ID"
          >
            {jobId}
          </div>
          <div style={{ 
            width: '180px', 
            color: 'var(--color-panel-text-secondary)',
            display: 'flex',
            alignItems: 'center',
          }}>
            {scheduledTime}
          </div>
          <div style={{ 
            width: '100px', 
            color: 'var(--color-panel-text-secondary)',
            display: 'flex',
            alignItems: 'center',
          }}>
            <span style={status === 'pending' ? { color: '#fbbf24' } : { color: '#d1d5db' }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div 
            onClick={handleFunctionClick}
            style={{ 
              flex: 1, 
              color: 'var(--color-panel-text-secondary)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              cursor: exactFunctionIdentifier ? 'pointer' : 'default',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (exactFunctionIdentifier) {
                e.currentTarget.style.color = 'var(--color-panel-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (exactFunctionIdentifier) {
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }
            }}
            title={exactFunctionIdentifier ? 'Click to view function code' : undefined}
          >
            {functionName}
          </div>
          <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
            {hasArgs && (
              <IconButton
                icon={Code}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onOpenArgs?.(job);
                }}
                aria-label="View arguments"
              />
            )}
            <IconButton
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                data.onCancelJob?.(job);
              }}
              aria-label="Cancel job"
            />
          </div>
        </div>
      );
    } catch (e) {
      console.error('Error rendering ScheduleRow:', e);
      return <div style={style}>Error</div>;
    }
  });

  return (<div style={{ display: selectedTab === "scheduled" ? "flex" : "none", flexDirection: "column", flex: 1, overflow: "hidden" }}>
    {/* Table */}
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        borderBottom: '1px solid var(--cp-data-row-border)',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--color-panel-text-muted)',
        backgroundColor: 'var(--color-panel-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>ID</div>
          <div style={{ width: '180px', display: 'flex', alignItems: 'center' }}>Scheduled Time</div>
          <div style={{ width: '100px', display: 'flex', alignItems: 'center' }}>Status</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>Function</div>
          <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></div>
        </div>
        <IconButton icon={isPaused ? Play : Pause} onClick={() => setIsPaused(!isPaused)} />
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-panel-bg)' }}>
        {filteredJobs && filteredJobs.length > 0 ? (
          <FixedSizeList
            height={listHeight}
            itemCount={filteredJobs.length}
            itemSize={40}
            width="100%"
            itemData={{
              jobs: filteredJobs,
              functions: functions,
              onOpenArgs: (job: any) => setSelectedJobForArgs(job),
              onCancelJob: (job: any) => setJobToCancel(job),
            }}
          >
            {ScheduleRow}
          </FixedSizeList>
        ) : (
          <EmptyScheduledJobsState searchQuery={searchQuery} />
        )}
      </div>
    </div>
    
    {/* Arguments Sheet */}
    <ScheduledJobArgumentsSheet
      isOpen={selectedJobForArgs !== null}
      onClose={() => setSelectedJobForArgs(null)}
      scheduledJob={selectedJobForArgs}
      container={containerRef.current}
    />
    
    {/* Individual Job Cancel Confirmation Dialog */}
    <ConfirmDialog
      isOpen={jobToCancel !== null}
      onClose={() => setJobToCancel(null)}
      onConfirm={async () => {
        if (!jobToCancel || !adminClient) return;
        try {
          setIsCanceling(true);
          await cancelScheduledJob(adminClient, jobToCancel._id, selectedComponentId ?? undefined);
          setJobToCancel(null);
          // Refresh jobs by triggering a re-fetch
          refetch();
        } catch (error) {
          console.error('Failed to cancel job:', error);
        } finally {
          setIsCanceling(false);
        }
      }}
      title="Cancel Scheduled Run"
      message={
        jobToCancel ? (
          <>
            <p style={{ marginBottom: '8px' }}>
              Are you sure you want to cancel this scheduled run?
            </p>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--color-panel-text-muted)',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                padding: '8px',
                borderRadius: '4px',
                wordBreak: 'break-all',
              }}
            >
              {jobToCancel._id}
            </div>
          </>
        ) : (
          ''
        )
      }
      confirmLabel={isCanceling ? 'Canceling...' : 'Cancel Job'}
      cancelLabel="Keep Scheduled"
      variant="danger"
      container={containerRef.current}
      disableCancel={isCanceling}
    />
  </div>
  )
}


interface CronsViewProps {
  adminClient: ConvexReactClient;
  selectedTab: 'scheduled' | 'cron';
  selectedComponentId: string | null | undefined;
  selectedFunctions: (ModuleFunction | CustomQuery)[];
  listHeight: string | number;
  functions: ModuleFunction[];
  searchQuery: string;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

const CronsJobsFunctionView = ({ adminClient, selectedComponentId, selectedTab, selectedFunctions, listHeight, functions, searchQuery, isPaused, setIsPaused }: CronsViewProps) => {
  const { loading: loadingCrons, cronJobs, cronJobRuns } = useCronJobs(adminClient, selectedComponentId ?? null, isPaused);
  const [selectedCronForArgs, setSelectedCronForArgs] = useState<CronJobWithRuns | null>(null);
  const [selectedCronForExecutions, setSelectedCronForExecutions] = useState<CronJobWithRuns | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const filteredCronJobs = React.useMemo(() => {
    if (!cronJobs) return undefined;
    
    let filtered = cronJobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        const jobName = job.name?.toLowerCase() || '';
        return jobName.includes(query);
      });
    }
    
    if (selectedFunctions.length === 0) {
      return filtered;
    }
    
    const validFunctions = selectedFunctions.filter(
      (fn): fn is ModuleFunction => !('type' in fn) || fn.type !== 'customQuery'
    );
    
    if (validFunctions.length === 0) {
      return filtered;
    }
    
    const normalizeIdentifier = (id: string) => id.replace(/\.js:/g, ':').replace(/\.js$/g, '');
    
    const selectedIdentifiers = new Set(
      validFunctions
        .map((fn) => normalizeIdentifier(fn.identifier))
        .filter((id) => id.length > 0)
    );
    
    const availableFunctionsForComponent = filtered.map((job) => job.cronSpec?.udfPath).filter(Boolean);
    const allFunctionsSelected = availableFunctionsForComponent.length > 0 && 
      availableFunctionsForComponent.every((udfPath) => {
        if (!udfPath) return false;
        const normalized = normalizeIdentifier(udfPath);
        return selectedIdentifiers.has(normalized);
      });
    
    if (allFunctionsSelected) {
      return filtered;
    }
    
    return filtered.filter((job) => {
      const cronUdfPath = job.cronSpec?.udfPath;
      if (!cronUdfPath) return false;
      
      const normalizedCronUdfPath = normalizeIdentifier(cronUdfPath);
      
      return selectedIdentifiers.has(normalizedCronUdfPath);
    });
  }, [cronJobs, selectedFunctions, selectedComponentId, searchQuery]);

  const CronRow = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
    try {
      const job = data.jobs[index];
      if (!job) return <div style={style}></div>;

      const normalizeIdentifier = (id: string) => id.replace(/\.js:/g, ':').replace(/\.js$/g, '');
      const jobUdfPath = job.cronSpec?.udfPath || '';
      const normalizedJobPath = normalizeIdentifier(jobUdfPath);
      
      const matchingFunction = data.functions?.find((fn: ModuleFunction) => {
        const normalizedFnId = normalizeIdentifier(fn.identifier);
        return normalizedFnId === normalizedJobPath && normalizedJobPath.length > 0;
      });
      
      const exactFunctionIdentifier = matchingFunction?.identifier || normalizedJobPath;
      
      const handleFunctionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (exactFunctionIdentifier && typeof window !== 'undefined') {
          localStorage.setItem('convex-panel-functions-selected-function', exactFunctionIdentifier);
          localStorage.setItem('convex-panel-functions-view-code-tab', 'true');
          window.dispatchEvent(new CustomEvent('convex-panel-navigate-to-functions-code', {
            detail: { functionIdentifier: exactFunctionIdentifier }
          }));
        }
      };

      return (
        <div
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderBottom: '1px solid var(--cp-data-row-border)',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'var(--color-panel-text-secondary)',
            backgroundColor: '',
            cursor: 'default',
            transition: 'background-color 0.35s ease',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          <div style={{ 
            width: '25%', 
            fontWeight: 400, 
            color: 'var(--color-panel-text)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {job.name}
          </div>
          <div style={{ 
            width: '25%', 
            color: 'var(--color-panel-text-secondary)',
            display: 'flex',
            alignItems: 'center',
          }}>
            {formatCronSchedule(job.cronSpec?.cronSchedule)}
          </div>
          <div 
            onClick={handleFunctionClick}
            style={{ 
              width: '25%', 
              color: 'var(--color-panel-accent)',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: exactFunctionIdentifier ? 'pointer' : 'default',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (exactFunctionIdentifier) {
                e.currentTarget.style.color = 'var(--color-panel-accent)';
                e.currentTarget.style.textDecoration = 'underline';
              }
            }}
            onMouseLeave={(e) => {
              if (exactFunctionIdentifier) {
                e.currentTarget.style.color = 'var(--color-panel-accent)';
                e.currentTarget.style.textDecoration = 'none';
              }
            }}
            title={exactFunctionIdentifier ? 'Click to view function code' : undefined}
          >
            {job.cronSpec?.udfPath}
          </div>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            justifyContent: 'center',
          }}>
            {job.lastRun && (
              <div style={{ fontSize: '12px', color: job.lastRun.status.type === 'success' ? 'var(--color-panel-text-muted)' : 'var(--color-panel-error)' }}>
                {job.lastRun.status.type === 'success' ? 'Success' : 'Failed'} {formatRelativeTime(job.lastRun.ts)}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
              Next run in {formatRelativeTime(job.nextRun?.nextTs)}
            </div>
          </div>
          <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
            {job.cronSpec?.udfArgs && (
              <IconButton
                icon={Code}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onOpenArgs?.(job);
                }}
              />
            )}
            <IconButton
              icon={ChevronRight}
              onClick={(e) => {
                e.stopPropagation();
                data.onOpenExecutions?.(job);
              }}
            />
          </div>
        </div>
      );
    } catch (e) {
      console.error('Error rendering CronRow:', e);
      return <div style={style}>Error</div>;
    }
  });

  return (
    <>
      <div style={{ display: selectedTab === "cron" ? "flex" : "none", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Table */}
        <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        borderBottom: '1px solid var(--cp-data-row-border)',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--color-panel-text-muted)',
        backgroundColor: 'var(--color-panel-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>Name</div>
          <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>Schedule</div>
          <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>Function</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>Last/Next Run</div>
          <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></div>
        </div>
        <IconButton icon={isPaused ? Play : Pause} onClick={() => setIsPaused(!isPaused)} />
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-panel-bg)' }}>
        {loadingCrons ? (
          <div style={{ padding: '16px', color: 'var(--color-panel-text-muted)' }}>Loading cron jobs...</div>
        ) : filteredCronJobs && filteredCronJobs.length > 0 ? (
          <FixedSizeList
            height={listHeight}
            itemCount={filteredCronJobs.length}
            itemSize={40}
            width="100%"
            itemData={{
              jobs: filteredCronJobs,
              functions: functions,
              onOpenArgs: (job: CronJobWithRuns) => setSelectedCronForArgs(job),
              onOpenExecutions: (job: CronJobWithRuns) => setSelectedCronForExecutions(job),
            }}
          >
            {CronRow}
          </FixedSizeList>
        ) : (
          <EmptyCronJobsState searchQuery={searchQuery} />
        )}
      </div>
    </div>
      </div>
      
      {/* Arguments Sheet */}
      <CronArgumentsSheet
        isOpen={selectedCronForArgs !== null}
        onClose={() => setSelectedCronForArgs(null)}
        cronJob={selectedCronForArgs}
        container={containerRef.current}
      />
      
      {/* Executions Sheet */}
      <CronExecutionsView
        isOpen={selectedCronForExecutions !== null}
        onClose={() => setSelectedCronForExecutions(null)}
        cronJob={selectedCronForExecutions}
        cronJobRuns={cronJobRuns}
        container={containerRef.current}
      />
    </>
  );
}