import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Sheet } from '../../../components/shared/sheet';
import { ReadonlyCode } from '../../../components/editor/readonly-code';
import { IconButton } from '../../../components/shared';

export interface CronsFileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCode: string | null;
  isLoading: boolean;
  container?: HTMLElement | null;
}

export const CronsFileSheet: React.FC<CronsFileSheetProps> = ({
  isOpen,
  onClose,
  sourceCode,
  isLoading,
  container,
}) => {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
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
            padding: '12px',
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
            crons.js
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
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--color-panel-text-muted)',
                gap: '12px',
              }}
            >
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading source code...</span>
            </div>
          ) : sourceCode ? (
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
                code={sourceCode}
                language="javascript"
                path="crons.js"
                height={{ type: 'parent' }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--color-panel-text-muted)',
              }}
            >
              Source code not available
            </div>
          )}
        </div>
      </div>
      </Sheet>
    </>
  );
};









