import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { Sheet } from '../../../components/shared/sheet';
import { ReadonlyCode } from '../../../components/editor/readonly-code';
import type { CronJobWithRuns } from '../../../lib/common-types';
import { IconButton } from '../../../components/shared';

export interface CronArgumentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cronJob: CronJobWithRuns | null;
  container?: HTMLElement | null;
}

export const CronArgumentsSheet: React.FC<CronArgumentsSheetProps> = ({
  isOpen,
  onClose,
  cronJob,
  container,
}) => {
  const argsJson = useMemo(() => {
    if (!cronJob?.cronSpec?.udfArgs) {
      return '[]';
    }

    try {
      // Convert ArrayBuffer to string
      let jsonString: string;
      if (typeof Buffer !== 'undefined') {
        // Node.js environment
        const buffer = Buffer.from(cronJob.cronSpec.udfArgs);
        jsonString = buffer.toString('utf8');
      } else {
        // Browser environment - use TextDecoder
        const decoder = new TextDecoder('utf-8');
        jsonString = decoder.decode(cronJob.cronSpec.udfArgs);
      }
      
      const parsed = JSON.parse(jsonString);
      // Pretty print the JSON
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error('Error parsing cron job arguments:', error);
      return '[]';
    }
  }, [cronJob]);

  if (!cronJob) return null;

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
            Cron Job Arguments: {cronJob.name}
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
              path={`cron-args-${cronJob.name}`}
              height={{ type: 'parent' }}
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
};









