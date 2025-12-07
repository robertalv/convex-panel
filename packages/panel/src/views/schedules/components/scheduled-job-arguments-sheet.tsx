import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { Sheet } from '../../../components/shared/sheet';
import { ReadonlyCode } from '../../../components/editor/readonly-code';
import { IconButton } from '../../../components/shared';

export interface ScheduledJobArgumentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledJob: any | null;
  container?: HTMLElement | null;
}

export const ScheduledJobArgumentsSheet: React.FC<ScheduledJobArgumentsSheetProps> = ({
  isOpen,
  onClose,
  scheduledJob,
  container,
}) => {
  const argsJson = useMemo(() => {
    // Scheduled jobs may have args or udfArgs property
    const jobArgs = scheduledJob?.args || scheduledJob?.udfArgs;
    
    if (!jobArgs) {
      return '[]';
    }

    try {
      // Convert ArrayBuffer to string
      let jsonString: string;
      if (typeof Buffer !== 'undefined') {
        // Node.js environment
        const buffer = Buffer.from(jobArgs);
        jsonString = buffer.toString('utf8');
      } else {
        // Browser environment - use TextDecoder
        const decoder = new TextDecoder('utf-8');
        jsonString = decoder.decode(jobArgs);
      }
      
      const parsed = JSON.parse(jsonString);
      // Pretty print the JSON
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error('Error parsing scheduled job arguments:', error);
      return '[]';
    }
  }, [scheduledJob]);

  if (!scheduledJob) return null;

  const jobId = scheduledJob._id || 'Unknown';
  const functionName = scheduledJob.udfPath || scheduledJob.component || 'Unknown Function';

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="600px"
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
            Scheduled Job Arguments: {functionName}
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
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              marginBottom: '12px',
              fontSize: '12px',
              color: 'var(--color-panel-text-muted)',
            }}
          >
            Job ID: <span style={{ fontFamily: 'monospace' }}>{jobId}</span>
          </div>
          <div
            style={{
              flex: 1,
              border: '1px solid var(--color-panel-border)',
              borderRadius: '4px',
              overflow: 'hidden',
              minHeight: '200px',
            }}
          >
            <ReadonlyCode
              code={argsJson}
              language="json"
              path={`scheduled-job-args-${jobId}`}
              height={{ type: 'parent' }}
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
};
