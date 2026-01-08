import React, { useMemo, useEffect, useRef } from 'react';
import { X, Calendar, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Sheet } from '../../../components/shared/sheet';
import type { CronJobWithRuns, CronJobLog } from '../../../lib/common-types';
import { formatTimestamp } from '../../../utils/cronFormatters';
import { IconButton } from '../../../components/shared';

export interface CronExecutionsViewProps {
  isOpen: boolean;
  onClose: () => void;
  cronJob: CronJobWithRuns | null;
  cronJobRuns: CronJobLog[] | undefined;
  container?: HTMLElement | null;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(1)}s`;
};

function LogStatusLine({ status }: { status: CronJobLog['status'] }) {
  const { type } = status;
  
  if (type === 'success') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-panel-success)' }}>
        <CheckCircle2 size={14} />
        <span style={{ width: '60px' }}>success</span>
      </div>
    );
  } else if (type === 'failure') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-panel-error)' }}>
        <XCircle size={14} />
        <span style={{ width: '60px' }}>failure</span>
      </div>
    );
  } else if (type === 'running') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-panel-text-secondary)' }}>
        <Play size={14} />
        <span style={{ width: '60px' }}>running</span>
      </div>
    );
  } else {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-panel-warning)' }}>
        <AlertTriangle size={14} />
        <span style={{ width: '60px' }}>canceled</span>
      </div>
    );
  }
}

function CronJobLogListItem({ cronJobLog }: { cronJobLog: CronJobLog }) {
  const timestamp = formatTimestamp(cronJobLog.ts);
  const duration = cronJobLog.executionTime ? formatDuration(cronJobLog.executionTime) : '';
  
  const handleFunctionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cronJobLog.udfPath && typeof window !== 'undefined') {
      localStorage.setItem('convex-panel-functions-selected-function', cronJobLog.udfPath);
      localStorage.setItem('convex-panel-functions-view-code-tab', 'true');
      window.dispatchEvent(new CustomEvent('convex-panel-navigate-to-functions-code', {
        detail: { functionIdentifier: cronJobLog.udfPath }
      }));
    }
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '12px',
      borderBottom: '1px solid var(--color-panel-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          whiteSpace: 'nowrap', 
          color: 'var(--color-panel-text)',
          minWidth: '180px',
        }}>
          {timestamp}
        </div>
        <div style={{ 
          width: '56px', 
          textAlign: 'right', 
          whiteSpace: 'nowrap', 
          color: 'var(--color-panel-text-secondary)' 
        }}>
          {duration}
        </div>
        <LogStatusLine status={cronJobLog.status} />
        <div 
          onClick={handleFunctionClick}
          style={{ 
            color: 'var(--color-panel-accent)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: cronJobLog.udfPath ? 'pointer' : 'default',
            transition: 'color 0.15s, text-decoration 0.15s',
          }}
          onMouseEnter={(e) => {
            if (cronJobLog.udfPath) {
              e.currentTarget.style.color = 'var(--color-panel-accent)';
              e.currentTarget.style.textDecoration = 'underline';
            }
          }}
          onMouseLeave={(e) => {
            if (cronJobLog.udfPath) {
              e.currentTarget.style.color = 'var(--color-panel-accent)';
              e.currentTarget.style.textDecoration = 'none';
            }
          }}
          title={cronJobLog.udfPath ? 'Click to view function code' : undefined}
        >
          {cronJobLog.udfPath}
        </div>
      </div>
      {cronJobLog.logLines?.logLines && cronJobLog.logLines.logLines.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingTop: '8px',
          borderTop: '1px solid var(--color-panel-border)',
        }}>
          {cronJobLog.logLines.logLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                padding: '4px 8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--color-panel-text-primary)',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}
      {cronJobLog.status.type === 'failure' && cronJobLog.status.result && (
        <div style={{
          padding: '8px',
          backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
          border: '1px solid var(--color-panel-error)',
          borderRadius: '4px',
          color: 'var(--color-panel-error)',
          fontSize: '11px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {typeof cronJobLog.status.result === 'object' && 'value' in cronJobLog.status.result
            ? String(cronJobLog.status.result.value)
            : String(cronJobLog.status.result)}
        </div>
      )}
    </div>
  );
}

function TopCronJobLogListItem({ cronJob }: { cronJob: CronJobWithRuns }) {
  const { nextRun } = cronJob;
  const { nextTs, state } = nextRun;
  const timestamp = formatTimestamp(nextTs);
  const currentlyRunning = state === 'running';
  
  const estRuntimeRef = useRef<HTMLSpanElement>(null);
  
  const handleFunctionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cronJob.cronSpec.udfPath && typeof window !== 'undefined') {
      localStorage.setItem('convex-panel-functions-selected-function', cronJob.cronSpec.udfPath);
      localStorage.setItem('convex-panel-functions-view-code-tab', 'true');
      window.dispatchEvent(new CustomEvent('convex-panel-navigate-to-functions-code', {
        detail: { functionIdentifier: cronJob.cronSpec.udfPath }
      }));
    }
  };
  
  useEffect(() => {
    if (currentlyRunning) {
      let handle = 0;
      const update = () => {
        if (estRuntimeRef.current) {
          const start = new Date(Number(nextTs) / 1000000);
          const ms = Date.now() - Number(start);
          const s = formatDuration(ms / 1000);
          estRuntimeRef.current.textContent = s;
          handle = requestAnimationFrame(update);
        }
      };
      handle = requestAnimationFrame(update);
      return () => cancelAnimationFrame(handle);
    }
  }, [currentlyRunning, nextTs]);
  
  const textColor = currentlyRunning
    ? 'var(--color-panel-text)'
    : 'var(--color-panel-text-secondary)';
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '12px',
      border: currentlyRunning ? 'none' : '1px dashed var(--color-panel-border)',
      borderRadius: '8px',
      backgroundColor: currentlyRunning ? 'var(--color-panel-bg-secondary)' : 'transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          whiteSpace: 'nowrap', 
          color: textColor,
          minWidth: '180px',
        }}>
          {timestamp}
        </div>
        <div style={{ 
          width: '56px', 
          textAlign: 'right', 
          whiteSpace: 'nowrap', 
          color: textColor 
        }}>
          {currentlyRunning ? <span ref={estRuntimeRef}>0ms</span> : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: textColor }}>
          {currentlyRunning ? (
            <Play 
              size={14} 
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ) : (
            <Calendar size={14} />
          )}
          <span style={{ width: '60px' }}>
            {currentlyRunning ? 'running' : 'scheduled'}
          </span>
        </div>
        <div 
          onClick={handleFunctionClick}
          style={{ 
            color: 'var(--color-panel-accent)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: cronJob.cronSpec.udfPath ? 'pointer' : 'default',
            transition: 'color 0.15s, text-decoration 0.15s',
          }}
          onMouseEnter={(e) => {
            if (cronJob.cronSpec.udfPath) {
              e.currentTarget.style.color = 'var(--color-panel-accent)';
              e.currentTarget.style.textDecoration = 'underline';
            }
          }}
          onMouseLeave={(e) => {
            if (cronJob.cronSpec.udfPath) {
              e.currentTarget.style.color = 'var(--color-panel-accent)';
              e.currentTarget.style.textDecoration = 'none';
            }
          }}
          title={cronJob.cronSpec.udfPath ? 'Click to view function code' : undefined}
        >
          {cronJob.cronSpec.udfPath}
        </div>
      </div>
    </div>
  );
}

export const CronExecutionsView: React.FC<CronExecutionsViewProps> = ({
  isOpen,
  onClose,
  cronJob,
  cronJobRuns,
  container,
}) => {
  const filteredRuns = useMemo(() => {
    if (!cronJobRuns || !cronJob) return [];
    return cronJobRuns.filter((run) => run.name === cronJob.name);
  }, [cronJobRuns, cronJob]);
  
  if (!cronJob) return null;
  
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="800px"
      container={container}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px',
            borderBottom: '1px solid var(--color-panel-border)',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Executions: {cronJob.name}
          </h2>
          <IconButton
            icon={X}
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-panel-text)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              Executions
            </h4>
          </div>
          
          <div style={{
            padding: '0',
          }}>
            {/* Next scheduled or currently running execution */}
            <div style={{
              padding: '12px',
              borderBottom: '1px solid var(--color-panel-border)',
            }}>
              <TopCronJobLogListItem cronJob={cronJob} />
            </div>
            
            {/* Past executions */}
            {filteredRuns.map((run) => (
              <CronJobLogListItem key={`${run.ts}-${run.name}`} cronJobLog={run} />
            ))}
            
            {filteredRuns.length === 0 && (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--color-panel-text-muted)',
                fontSize: '14px',
              }}>
                No past executions found
              </div>
            )}
          </div>
        </div>
        
        {/* Animation styles */}
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    </Sheet>
  );
};
