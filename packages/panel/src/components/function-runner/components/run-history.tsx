import React from 'react';
import { ArrowLeft, ArrowRight, Code } from 'lucide-react';
import { RunHistoryItem } from '../../../hooks/useRunHistory';

interface RunHistoryProps {
  functionIdentifier: string;
  componentId: string | null;
  runHistory: RunHistoryItem[];
  currentIndex: number;
  onSelectItem: (item: RunHistoryItem, index: number) => void;
  onJumpToCode?: () => void;
}

export const RunHistory: React.FC<RunHistoryProps> = ({
  functionIdentifier,
  componentId,
  runHistory,
  currentIndex,
  onSelectItem,
  onJumpToCode,
}) => {
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < runHistory.length - 1;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {onJumpToCode && (
        <button
          onClick={onJumpToCode}
          style={{
            padding: '4px',
            backgroundColor: 'transparent',
            border: '1px solid #2D313A',
            borderRadius: '4px',
            color: '#9ca3af',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1C1F26';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#6b7280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
            e.currentTarget.style.borderColor = '#2D313A';
          }}
          title="Jump to Code"
        >
          <Code size={12} />
        </button>
      )}
      <button
        onClick={() => {
          if (canGoBack) {
            onSelectItem(runHistory[currentIndex - 1], currentIndex - 1);
          }
        }}
        disabled={!canGoBack}
        style={{
          padding: '4px',
          backgroundColor: 'transparent',
          border: '1px solid #2D313A',
          borderRadius: '4px',
          color: canGoBack ? '#9ca3af' : '#3d4149',
          cursor: canGoBack ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (canGoBack) {
            e.currentTarget.style.backgroundColor = '#1C1F26';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#6b7280';
          }
        }}
        onMouseLeave={(e) => {
          if (canGoBack) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
            e.currentTarget.style.borderColor = '#2D313A';
          }
        }}
        title="Previous Arguments"
      >
        <ArrowLeft size={12} />
      </button>
      <button
        onClick={() => {
          if (canGoForward) {
            onSelectItem(runHistory[currentIndex + 1], currentIndex + 1);
          }
        }}
        disabled={!canGoForward}
        style={{
          padding: '4px',
          backgroundColor: 'transparent',
          border: '1px solid #2D313A',
          borderRadius: '4px',
          color: canGoForward ? '#9ca3af' : '#3d4149',
          cursor: canGoForward ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (canGoForward) {
            e.currentTarget.style.backgroundColor = '#1C1F26';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#6b7280';
          }
        }}
        onMouseLeave={(e) => {
          if (canGoForward) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
            e.currentTarget.style.borderColor = '#2D313A';
          }
        }}
        title="Next Arguments"
      >
        <ArrowRight size={12} />
      </button>
    </div>
  );
};

