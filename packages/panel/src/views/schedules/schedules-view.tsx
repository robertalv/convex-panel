/**
 * TODO: 
 * 1- Implement copy ID button for scheduled functions 
 * 2- Implement "go to functions tab" when you click on it
 * 3- add the menu to view the arguments and cancel the function,
 * 4- figure out the chose all functions bar
 * 5- Implement a better way of finding Paused Live data
 */
import { ConvexReactClient } from 'convex/react';
import {
  Calendar,
  ExternalLink,
  Pause,
  Trash2,
} from 'lucide-react';
import React, { Activity, useEffect, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { ComponentSelector } from '../../components/function-runner/components/component-selector';
import { FunctionSelector } from '../../components/function-runner/components/function-selector';
import { CustomQuery } from '../../components/function-runner/function-runner';
import { useComponents } from '../../hooks/useComponents';
import { useCronJobs } from '../../hooks/useCronJobs';
import { useFunctions } from '../../hooks/useFunctions';
import { usePaginatedScheduledJobs } from '../../hooks/usePaginatedScheduledJobs';
// import { logsViewStyles } from '../../styles/panelStyles';
import { getDeploymentUrl } from '../../utils/adminClient';
import { formatCronSchedule, formatRelativeTime } from '../../utils/cronFormatters';
import { ModuleFunction } from '../../utils/functionDiscovery';

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
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
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

  const {
    functions: allFunctions,
    groupedFunctions,
    isLoading,
    error: functionsError,
  } = useFunctions({
    adminClient,
    useMockData,
    componentId: selectedComponent,
  });

  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | CustomQuery | null>(allFunctions?.[0]);
  const deploymentUrl = getDeploymentUrl(adminClient);

  useEffect(() => {
    setSelectedFunction(allFunctions[0]);
  }, [allFunctions, setSelectedFunction]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const headerHeight = 40; // Header
        const tabsHeight = 40; // Tabs
        const filtersHeight = 60; // Filters
        const tableHeaderHeight = 40; // Table Header
        const availableHeight = containerRect.height - headerHeight - tabsHeight - filtersHeight - tableHeaderHeight;
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

  return (
    <div ref={containerRef} className="cp-schedules-container" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="cp-schedules-header" >
        <h2 className="cp-schedules-title">Schedules</h2>
        <div style={{ width: '192px' }}>
          <ComponentSelector
            selectedComponent={selectedComponent}
            onSelect={setSelectedComponent}
            components={componentList}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="cp-schedules-tabs" style={{ display: 'flex', borderBottom: '1px solid #2D313A', padding: '0 16px' }}>
        <button
          onClick={() => setSelectedTab('scheduled')}
          className={`cp-schedules-tab ${selectedTab === 'scheduled' ? 'active' : ''}`}
          style={{
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'scheduled' ? '2px solid #34D399' : '2px solid transparent',
            color: selectedTab === 'scheduled' ? '#fff' : '#9ca3af',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Scheduled Functions
        </button>
        <button
          onClick={() => setSelectedTab('cron')}
          className={`cp-schedules-tab ${selectedTab === 'cron' ? 'active' : ''}`}
          style={{
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'cron' ? '2px solid #34D399' : '2px solid transparent',
            color: selectedTab === 'cron' ? '#fff' : '#9ca3af',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Cron Jobs
        </button>
      </div>

      {/* Scheduled Functions View */}
      <ScheduledFunctionView
        adminClient={adminClient}
        selectedComponentId={selectedComponentId}
        selectedFunction={selectedFunction}
        selectedTab={selectedTab}
        listHeight={listHeight}
        deploymentUrl={deploymentUrl}
        allFunctions={allFunctions}
        setSelectedFunction={setSelectedFunction}
        hoveredRowIndex={hoveredRowIndex}
        setHoveredRowIndex={setHoveredRowIndex}
      />

      {/* Crons jobs Activity */}
      <CronsJobsFunctionView
        adminClient={adminClient}
        selectedTab={selectedTab}
        selectedComponentId={selectedComponentId}
        hoveredRowIndex={hoveredRowIndex}
        setHoveredRowIndex={setHoveredRowIndex}

      />
    </div>
  );
};

interface Props {
  selectedFunction: ModuleFunction | CustomQuery | null;
  adminClient: ConvexReactClient;
  deploymentUrl: string | null;
  selectedTab: 'scheduled' | 'cron';
  setSelectedFunction: React.Dispatch<React.SetStateAction<ModuleFunction | CustomQuery | null>>;
  allFunctions: ModuleFunction[];
  selectedComponentId: string | null | undefined;
  listHeight: string | number;
  hoveredRowIndex: number | null;
  setHoveredRowIndex: (c: number | null) => void;
}


const ScheduledFunctionView = ({
  selectedFunction,
  setSelectedFunction,
  adminClient,
  deploymentUrl,
  selectedTab,
  allFunctions,
  selectedComponentId,
  listHeight,
  hoveredRowIndex,
  setHoveredRowIndex
}: Props) => {
  const { jobs, status } = usePaginatedScheduledJobs(
    (selectedFunction && 'identifier' in selectedFunction) ? selectedFunction.identifier : undefined,
    adminClient,
    deploymentUrl ?? "",
  );

  const ScheduleRow = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
    try {
      const job = data.jobs[index];
      if (!job) return <div style={style}></div>;

      const isHovered = hoveredRowIndex === index;

      // Extract function name (assuming job.component or job.udfPath contains it)
      const functionName = job.component || job.udfPath || 'Unknown Function';
      const shortId = job._id ? job._id.slice(0, 12) + '...' : '-';
      const status = job.state?.type || 'pending';
      const scheduledTime = job.nextTs ? formatTimestamp(job.nextTs) : '-';

      return (
        <div
          className={`cp-logs-row`}
          style={{
            ...style,
            cursor: 'default',
            backgroundColor: isHovered ? 'var(--color-panel-hover)' : undefined,
          }}
          onMouseEnter={() => setHoveredRowIndex(index)}
          onMouseLeave={() => setHoveredRowIndex(null)}
        >
          <div style={{ width: '120px' }} className='cp-logs-id'>
            <span className='cp-logs-id-badge'>
              {shortId}
            </span>
          </div>
          <div className="cp-logs-timestamp" style={{ width: '180px' }}>
            {scheduledTime}
          </div>
          <div className="cp-logs-status" style={{ width: '100px' }}>
            <span style={status === 'pending' ? { color: '#fbbf24' } : { color: '#d1d5db' }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div className="cp-logs-function" style={{ flex: 1 }}>
            <span className="cp-logs-function-path">
              {functionName}
            </span>
          </div>
          <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
            {/* Placeholder for actions like cancel */}
          </div>
        </div>
      );
    } catch (e) {
      console.error('Error rendering ScheduleRow:', e);
      return <div style={style}>Error</div>;
    }
  });

  return (<Activity mode={selectedTab === "scheduled" ? "visible" : "hidden"}>
    {/* Filters Bar */}
    <div className="cp-logs-search" style={{ padding: '12px 16px' }}>
      <div style={{ width: '240px' }}>
        <FunctionSelector
          selectedFunction={selectedFunction}
          onSelect={setSelectedFunction}
          functions={allFunctions}
          componentId={selectedComponentId}
        />
      </div>
      <button
        className="cp-schedules-cancel-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '4px',
          color: '#f87171',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        <Trash2 style={{ width: '14px', height: '14px' }} />
        Cancel All
      </button>
    </div>

    {/* Table Header */}
    <div className="cp-logs-table-header" style={{ paddingRight: '16px' }}>
      <div className="cp-logs-table-header-cell" style={{ width: '120px' }}>ID</div>
      <div className="cp-logs-table-header-cell" style={{ width: '180px' }}>Scheduled Time</div>
      <div className="cp-logs-table-header-cell" style={{ width: '100px' }}>Status</div>
      <div className="cp-logs-table-header-cell" style={{ flex: 1 }}>Function</div>
      <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#60a5fa',
            padding: '4px',
          }}
        >
          <Pause style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>

    {/* Table and EmptyList */}
    {jobs && jobs.page && jobs.page.length > 0 ? (
      <FixedSizeList
        height={listHeight}
        itemCount={jobs.page.length}
        itemSize={36}
        width="100%"
        itemData={{
          jobs: jobs.page,
        }}
      >
        {ScheduleRow}
      </FixedSizeList>
    ) : (
      <div className="cp-schedules-empty" style={{ height: listHeight }}>
        <div className="cp-schedules-empty-icon" style={{ marginBottom: '16px' }}>
          <Calendar style={{ width: '48px', height: '48px', color: '#a78bfa', opacity: 0.5 }} />
        </div>
        <h3 className="cp-schedules-empty-title" style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          Schedule functions to run later
        </h3>
        <p className="cp-schedules-empty-desc" style={{ color: '#9ca3af', fontSize: '14px', maxWidth: '400px', textAlign: 'center', marginBottom: '16px' }}>
          Scheduled functions can run after an amount of time passes, or at a specific date.
        </p>
        <a href="#" className="cp-schedules-empty-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}>
          <ExternalLink style={{ width: '14px', height: '14px' }} />
          Learn more about scheduled functions
        </a>
      </div>
    )}
  </Activity>
  )
}


interface CronsViewProps {
  adminClient: ConvexReactClient;
  selectedTab: 'scheduled' | 'cron';
  selectedComponentId: string | null | undefined;
  hoveredRowIndex: number | null;
  setHoveredRowIndex: (c: number | null) => void;
}

const CronsJobsFunctionView = ({ adminClient, selectedComponentId, selectedTab, hoveredRowIndex, setHoveredRowIndex }: CronsViewProps) => {
  const { loading: loadingCrons, cronJobs, cronJobRuns } = useCronJobs(adminClient, selectedComponentId ?? null);
  return (<Activity mode={selectedTab === "cron" ? "visible" : "hidden"}>
    {loadingCrons ? (
      <div style={{ padding: '16px', color: '#9ca3af' }}>Loading cron jobs...</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Cron Table Header */}
        {cronJobs && cronJobs.length > 0 && (
          <div className="cp-logs-table-header" style={{ paddingRight: '16px' }}>
            <div className="cp-logs-table-header-cell" style={{ width: '25%' }}>Name</div>
            <div className="cp-logs-table-header-cell" style={{ width: '25%' }}>Schedule</div>
            <div className="cp-logs-table-header-cell" style={{ width: '25%' }}>Function</div>
            <div className="cp-logs-table-header-cell" style={{ flex: 1 }}>Last/Next Run</div>
            <div style={{ width: '100px' }}></div>
          </div>
        )}

        <div style={{ padding: '0', color: '#fff', overflowY: 'auto', flex: 1 }}>
          {cronJobs && cronJobs.length > 0 ? (
            cronJobs.map((job, index) => {
              const isHovered = hoveredRowIndex === index + 1000; // Offset to avoid conflict with schedule rows
              return (
                <div
                  key={job.name}
                  className="cp-logs-row"
                  style={{
                    backgroundColor: isHovered ? 'var(--color-panel-hover)' : undefined,
                    cursor: 'default',
                    borderBottom: '1px solid #2D313A'
                  }}
                  onMouseEnter={() => setHoveredRowIndex(index + 1000)}
                  onMouseLeave={() => setHoveredRowIndex(null)}
                >
                  <div className="cp-logs-function" style={{ width: '25%', fontWeight: 600, color: '#e5e7eb' }}>
                    {job.name}
                  </div>
                  <div className="cp-logs-function" style={{ width: '25%', color: '#9ca3af' }}>
                    {formatCronSchedule(job.cronSpec?.cronSchedule)}
                  </div>
                  <div className="cp-logs-function" style={{ width: '25%', color: '#60a5fa' }}>
                    {job.cronSpec?.udfPath}
                  </div>
                  <div className="cp-logs-function" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {job.lastRun && (
                      <div style={{ fontSize: '12px', color: job.lastRun.status.type === 'success' ? '#9ca3af' : '#f87171' }}>
                        {job.lastRun.status.type === 'success' ? 'Success' : 'Failed'} {formatRelativeTime(job.lastRun.ts)}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Next run in {formatRelativeTime(job.nextRun?.nextTs)}
                    </div>
                  </div>
                  <div style={{ width: '100px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      style={{
                        background: 'transparent',
                        border: '1px solid #374151',
                        borderRadius: '4px',
                        color: '#e5e7eb',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ExternalLink style={{ width: '12px', height: '12px' }} />
                      Arguments
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="cp-schedules-empty" style={{ height: '100%' }}>
              <div className="cp-schedules-empty-icon" style={{ marginBottom: '16px' }}>
                <Calendar style={{ width: '48px', height: '48px', color: '#a78bfa', opacity: 0.5 }} />
              </div>
              <h3 className="cp-schedules-empty-title" style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                No Cron Jobs Found
              </h3>
              <p className="cp-schedules-empty-desc" style={{ color: '#9ca3af', fontSize: '14px', maxWidth: '400px', textAlign: 'center', marginBottom: '16px' }}>
                Define cron jobs in your Convex functions to see them here.
              </p>
            </div>
          )}
        </div>
      </div>
    )}
  </Activity>)
}