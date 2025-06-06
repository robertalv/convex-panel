import { motion } from 'framer-motion';
import { CopyIcon } from 'lucide-react';
import { formatJson } from '../../utils';
import { detailPanelVariants } from '../../theme';
import { LogDetailPanelProps } from '../../types';
import { XIcon } from '../../components/icons';

const LogDetailPanel = ({ 
  /**
   * The log entry to display in the detail panel.
   */
  selectedLog,
  
  /**
   * The theme to use for the detail panel.
   */
  mergedTheme, 
  
  /**
   * The function to call when the detail panel is closed.
   */
  setIsDetailPanelOpen 
}: LogDetailPanelProps) => {
  if (!selectedLog) return null;
  
  const timestamp = new Date(selectedLog.timestamp * 1000).toLocaleString();
  const executionTime = selectedLog.execution_time_ms 
    ? `${selectedLog.execution_time_ms.toFixed(2)}ms` 
    : 'N/A';
  
  return (
    <motion.div 
      {...{
        className: `convex-panel-detail-panel ${mergedTheme.container}`,
        variants: detailPanelVariants,
        initial: "hidden",
        animate: "visible",
        exit: "hidden",
        style: { width: '50%', height: '100%' }
      } as any}
    >
      <div className="convex-panel-detail-header">
        <h3 className="convex-panel-detail-title">LOG DETAILS</h3>
        <button 
          onClick={() => setIsDetailPanelOpen(false)}
          className="convex-panel-detail-close-button"
        >
          <XIcon />
        </button>
      </div>
      
      <div className="convex-panel-detail-content">
        {/* Basic Info */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">Basic Information</h4>
          <div className="convex-panel-detail-fields">
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Timestamp:</span>
              <span className="convex-panel-detail-timestamp">{timestamp}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Request ID:</span>
              <span className="convex-panel-detail-request-id">{selectedLog.function?.request_id || 'N/A'}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Status:</span>
              <span className={`convex-panel-detail-status ${selectedLog.status === 'success' ? 'convex-panel-success-text' : 'convex-panel-error-text'}`}>
                {selectedLog.status || 'N/A'}
              </span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Execution Time:</span>
              <span className="convex-panel-detail-execution-time">{executionTime}</span>
            </div>
          </div>
        </div>
        
        {/* Function Info */}
        {selectedLog.function && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-section-title">Function Information</h4>
            <div className="convex-panel-detail-fields">
              <div className="convex-panel-detail-field">
                <span className="convex-panel-detail-label">Type:</span>
                <span className="convex-panel-detail-function-type">{selectedLog.function.type || 'N/A'}</span>
              </div>
              <div className="convex-panel-detail-field">
                <span className="convex-panel-detail-label">Path:</span>
                <span className="convex-panel-detail-function-path">{selectedLog.function.path || 'N/A'}</span>
              </div>
              <div className="convex-panel-detail-field">
                <span className="convex-panel-detail-label">Cached:</span>
                <span className="convex-panel-detail-function-cached">{selectedLog.function.cached ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Log Lines */}
        {selectedLog.raw && selectedLog.raw.logLines && selectedLog.raw.logLines.length > 0 && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-section-title">Log Output</h4>
            <div className="convex-panel-detail-log-output">
              {selectedLog.raw.logLines.map((line: string, i: number) => (
                <div key={i} className="convex-panel-detail-log-line">{line}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {selectedLog.error_message && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-error-title">Error</h4>
            <div className="convex-panel-detail-error-container">
              <div className="convex-panel-detail-error-message">{selectedLog.error_message}</div>
            </div>
          </div>
        )}
        
        {/* Raw Data */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">Raw Data</h4>
          <div className="convex-panel-detail-raw-container">
            <button
              className="convex-panel-detail-copy-button"
              onClick={() => navigator.clipboard.writeText(formatJson(selectedLog.raw))}
            >
              <CopyIcon className="convex-panel-copy-icon" />
            </button>
            <pre className="convex-panel-detail-raw-json">{formatJson(selectedLog.raw)}</pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

LogDetailPanel.displayName = 'LogDetailPanel';

export default LogDetailPanel; 