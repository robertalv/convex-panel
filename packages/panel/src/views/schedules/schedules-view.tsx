/**
 * TODO: 
 * 1- Implement copy ID button for scheduled functions 
 * 2- Implement "go to functions tab" when you click on it
 * 3- add the menu to view the arguments and cancel the function,
 * 4- figure out the chose all functions bar
 * 5- Implement a better way of finding Paused Live data
 */
import {
  Calendar,
  ExternalLink,
  Pause,
  Trash2,
} from 'lucide-react';
import React, { Activity, useEffect, useState } from 'react';
import { ComponentSelector } from '../../components/function-runner/components/component-selector';
import { FunctionSelector } from '../../components/function-runner/components/function-selector';
import { CustomQuery } from '../../components/function-runner/function-runner';
import { ModuleFunction } from '../../utils/functionDiscovery';
// import { fetchComponents } from '../../utils/api';
import { useComponents } from '../../hooks/useComponents';
import { useFunctions } from '../../hooks/useFunctions';
import { usePaginatedScheduledJobs } from '../../hooks/usePaginatedScheduledJobs';
// import { getDeploymentUrl } from 'src/utils/adminClient';
import { FixedSizeList } from 'react-window';
import { logsViewStyles } from '../../styles/panelStyles';
import { getDeploymentUrl } from '../../utils/adminClient';

export interface SchedulesViewProps {
  adminClient?: any;
  accessToken?: string;
  useMockData?: boolean;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  adminClient,
  accessToken,
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

  const { jobs, status } = usePaginatedScheduledJobs(
    (selectedFunction && 'identifier' in selectedFunction) ? selectedFunction.identifier : undefined,
    adminClient,
    deploymentUrl ?? "",
  );

  useEffect(() => {
    setSelectedFunction(allFunctions[0]);
  }, [allFunctions, setSelectedFunction]);

  // Calculate list height based on container
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
          style={{
            ...style,
            ...logsViewStyles.logRow,
            ...(isHovered ? logsViewStyles.logRowHover : {}),
            cursor: 'default',
          }}
          onMouseEnter={() => setHoveredRowIndex(index)}
          onMouseLeave={() => setHoveredRowIndex(null)}
        >
          <div style={{ ...logsViewStyles.idCell, width: '120px' }}>
            <span style={logsViewStyles.idBadge}>
              {shortId}
            </span>
          </div>
          <div style={{ ...logsViewStyles.timestampCell, width: '180px', color: '#d1d5db' }}>
            {scheduledTime}
          </div>
          <div style={{ ...logsViewStyles.statusCell, width: '100px' }}>
            <span style={status === 'pending' ? { color: '#fbbf24' } : { color: '#d1d5db' }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div style={{ ...logsViewStyles.functionCell, flex: 1 }}>
            <span style={{ ...logsViewStyles.functionPath, color: '#d1d5db' }}>
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

  ScheduleRow.displayName = 'ScheduleRow';

  return (
    <div ref={containerRef} className="cp-schedules-container" style={{ ...logsViewStyles.container, overflow: 'hidden' }}>
      {/* Header */}
      <div className="cp-schedules-header" style={logsViewStyles.header}>
        <h2 className="cp-schedules-title" style={logsViewStyles.headerTitle}>Schedules</h2>
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

      <Activity mode={selectedTab === "scheduled" ? "visible" : "hidden"}>
        {/* Filters Bar */}
        <div className="cp-schedules-filters" style={{ ...logsViewStyles.searchContainer, padding: '12px 16px' }}>
          <div style={{ width: '240px' }}>
            <FunctionSelector
              selectedFunction={selectedFunction}
              onSelect={setSelectedFunction}
              functions={allFunctions}
              componentId={selectedComponent}
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
        <div className="cp-schedules-table-header" style={{ ...logsViewStyles.tableHeader, paddingRight: '16px' }}>
          <div style={{ ...logsViewStyles.tableHeaderCell, width: '120px' }}>ID</div>
          <div style={{ ...logsViewStyles.tableHeaderCell, width: '180px' }}>Scheduled Time</div>
          <div style={{ ...logsViewStyles.tableHeaderCell, width: '100px' }}>Status</div>
          <div style={{ ...logsViewStyles.tableHeaderCell, flex: 1 }}>Function</div>
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
          <div className="cp-schedules-empty" style={{ ...logsViewStyles.emptyContainer, height: listHeight }}>
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
    </div>
  );
};



export const CronJobsView = () => { }