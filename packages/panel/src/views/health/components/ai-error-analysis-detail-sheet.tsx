import React from 'react';
import { Sheet } from '../../../components/shared/sheet';
import { X, AlertCircle, Copy, Sparkles } from 'lucide-react';
import type { ErrorAnalysis } from '../../../utils/api/aiAnalysis';
import { IconButton } from '../../../components/shared';
import { 
  formatDateTime, 
  formatTimestampWithRelative, 
  getSeverityColor, 
  normalizeIdentifier 
} from '../../../utils';
import { handleCopyAIPrompt } from '../../../utils/aiPrompt';

export interface AIErrorAnalysisDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ErrorAnalysis | null;
  container?: HTMLElement | null;
}

export const AIErrorAnalysisDetailSheet: React.FC<AIErrorAnalysisDetailSheetProps> = ({
  isOpen,
  onClose,
  analysis,
  container,
}) => {
  if (!isOpen || !analysis) return null;

  const severityColors = getSeverityColor(analysis.severity);
  const timestampInfo = (analysis as any)._creationTime 
    ? formatTimestampWithRelative((analysis as any)._creationTime)
    : { absolute: 'N/A', relative: '' };

  const functionPath = (analysis as any).functionPath;
  
  const handleFunctionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (functionPath && typeof window !== 'undefined') {
      const normalizedFunctionPath = normalizeIdentifier(functionPath);
      const exactFunctionIdentifier = normalizedFunctionPath;
      
      localStorage.setItem('convex-panel-functions-selected-function', exactFunctionIdentifier);
      localStorage.removeItem('convex-panel-functions-view-statistics-tab');
      window.dispatchEvent(new CustomEvent('convex-panel-navigate-to-functions-statistics', {
        detail: { functionIdentifier: exactFunctionIdentifier }
      }));
    }
  };

  const onCopyAIPrompt = async () => {
    await handleCopyAIPrompt({
      analysis,
      functionPath,
      errorMessage: analysis.errorMessage,
      errorId: analysis.errorId,
    });
  };

  const sheetContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0px 12px',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          height: '40px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: severityColors.badge,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
              {timestampInfo.absolute}
            </span>
            {timestampInfo.relative && (
              <span style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
                ({timestampInfo.relative})
              </span>
            )}
            <span
              style={{
                fontSize: '12px',
                color: severityColors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textTransform: 'capitalize',
              }}
            >
              <AlertCircle size={14} />
              {analysis.severity}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <IconButton
          icon={X}
          onClick={onClose}
          aria-label="Close sheet"
        />
      </div>

      {/* Error Message */}
      {analysis.errorMessage && (
        <div
          style={{
            margin: '16px',
            padding: '12px',
            backgroundColor: 'var(--color-background-error)',
            border: '1px solid var(--color-border-error)',
            borderRadius: '6px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-content-error)',
              }}
            >
              Error
            </div>
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-content-error)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {analysis.errorMessage}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(analysis.errorMessage || '');
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-content-error)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Copy error"
          >
            <Copy size={14} />
          </button>
        </div>
      )}

      {/* AI Analysis Results */}
      <div
        style={{
          margin: '0 16px 16px 16px',
          padding: '12px',
          backgroundColor: 'var(--color-panel-bg-tertiary)',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
            AI Analysis
          </span>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: 'var(--color-panel-text-muted)',
            }}
          >
            {Math.round(analysis.confidence * 100)}% confidence
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: severityColors.bg,
                color: severityColors.text,
                fontSize: '10px',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {analysis.severity}
            </span>
            <button
              onClick={onCopyAIPrompt}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-panel-text-muted)',
                fontSize: '11px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text)';
                e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Copy AI prompt for Cursor/VSCode"
            >
              <Sparkles size={12} />
              Copy Analysis
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Metadata */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr',
              rowGap: '6px',
              fontSize: '11px',
            }}
          >
            {functionPath && (
              <>
                <span style={{ color: 'var(--color-panel-text-muted)' }}>Function</span>
                <span
                  onClick={handleFunctionClick}
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                  }}
                  title={functionPath ? 'Click to view function code' : undefined}
                >
                  {functionPath}
                </span>
              </>
            )}
            {analysis.errorId && (
              <>
                <span style={{ color: 'var(--color-panel-text-muted)' }}>Error ID</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={analysis.errorId}
                >
                  {analysis.errorId}
                </span>
              </>
            )}
            {(analysis as any)._creationTime && (
              <>
                <span style={{ color: 'var(--color-panel-text-muted)' }}>Analyzed</span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime((analysis as any)._creationTime)}
                </span>
              </>
            )}
          </div>

          {/* Root Cause */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
              Root Cause
            </div>
            <div
              style={{
                padding: '10px',
                backgroundColor: severityColors.bg,
                border: `1px solid ${severityColors.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--color-panel-text-secondary)',
                lineHeight: '1.5',
              }}
            >
              {analysis.rootCause}
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
                Suggestions ({analysis.suggestions.length})
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
                {analysis.suggestions.map((suggestion, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Issues */}
          {analysis.relatedIssues && analysis.relatedIssues.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '4px' }}>
                Related Issues
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
                {analysis.relatedIssues.map((issue, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {/* Empty space for future content or scroll */}
      </div>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="600px"
      container={container}
    >
      {sheetContent}
    </Sheet>
  );
};
