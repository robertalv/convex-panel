import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, Brain } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { TableSchema } from '../../../types/tables';

export interface NaturalLanguageQueryProps {
  tableName: string;
  tableSchema: TableSchema | undefined;
  availableFields: string[];
  adminClient: any;
  onApply: (filters: any, sortConfig: any, limit: number | null) => Promise<void> | void;
  onError?: (error: string) => void;
}

export const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({
  tableName,
  tableSchema,
  availableFields,
  adminClient,
  onApply,
  onError,
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!query.trim() || !adminClient || !tableSchema) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Import the API function dynamically
      const { convertNaturalLanguageQuery } = await import('../../../utils/api/aiAnalysis');
      
      // Convert table schema fields to the format expected by the API
      const fields = tableSchema.fields.map((field) => ({
        fieldName: field.fieldName,
        type: field.shape?.type || 'any',
        optional: field.optional,
      }));

      // Call the AI conversion
      const result = await convertNaturalLanguageQuery(adminClient, {
        query: query.trim(),
        tableName,
        fields,
      });

      // Import conversion utilities
      const { convertQueryResponse } = await import('../../../utils/naturalLanguageQuery');
      
      // Convert to FilterExpression and SortConfig
      const converted = convertQueryResponse(result, availableFields);

      // Apply the converted query and wait for it to complete
      await onApply(converted.filters, converted.sortConfig, converted.limit);

      // Clear input and collapse
      setQuery('');
      setIsExpanded(false);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to convert query. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'var(--color-panel-text)',
          fontSize: '12px',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 15%, transparent)';
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 50%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 10%, transparent)';
          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 30%, transparent)';
        }}
      >
        <Brain size={14} style={{ color: 'var(--color-panel-accent, #6366f1)' }} />
        <span>Ask AI...</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        animation: 'slideIn 0.2s ease-out',
      }}
      onBlur={(e) => {
        // Don't collapse if clicking on the form or its children
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          // Small delay to allow submit to process
          setTimeout(() => {
            if (!isLoading) {
              setIsExpanded(false);
            }
          }, 200);
        }
      }}
    >
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            padding: '10px 12px',
            backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 15%, var(--color-panel-bg))',
            border: '1.5px solid var(--color-panel-error)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--color-panel-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1000,
            maxWidth: '600px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          <AlertCircle size={14} style={{ color: 'var(--color-panel-error)', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      {isLoading && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain
                size={48}
                style={{
                  color: 'var(--color-panel-accent, #6366f1)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <Loader2
                size={32}
                style={{
                  position: 'absolute',
                  color: 'var(--color-panel-accent, #6366f1)',
                  animation: 'spin 1s linear infinite',
                  opacity: 0.6,
                }}
              />
            </div>
            <div
              style={{
                color: 'var(--color-panel-text)',
                fontSize: '16px',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              AI is thinking...
            </div>
            <div
              style={{
                color: 'var(--color-panel-text-muted)',
                fontSize: '13px',
                textAlign: 'center',
                maxWidth: '300px',
              }}
            >
              Converting your query and fetching results
            </div>
          </div>
        </div>,
        document.body
      )}
    </form>
  );
};

export default NaturalLanguageQuery;
