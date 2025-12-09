import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Loader2, Brain, AlertCircle, Table, ArrowUp, Terminal, Copy, Check, Filter, Database, ArrowRight, BarChart3, Activity, Trash2, Edit2, Settings, ChevronLeft, ChevronRight, Play, Eye, XCircle, ChevronDown, ChevronUp, Columns } from 'lucide-react';
import type { TabId } from '../types/tabs';
import { navigateToDataViewWithQuery, getTablesForChatbot, navigateToLogsWithFilters } from '../utils/chatbotNavigation';
import { generateResponseStream, listAgentTools, getAIConfig, listChatStreams, type AIConfig, type AgentTool } from '../utils/api/aiAnalysis';
import type { TableDefinition } from '../types';
import { IconButton } from './shared';
import { isAIAvailable } from '../utils/api/aiAnalysis';
import { listChats, getChat, createChat, saveMessage, updateChatTitle, deleteChat, type AIChat } from '../utils/api/aiChats';
import { useThemeSafe } from '../hooks/useTheme';
import { saveActiveTable, saveTableFilters, saveTableSortConfig } from '../utils/storage';
import { useDataViewContext } from '../contexts/data-view-context';
import convexAIDark from '../icons/convex-ai-dark.svg';
import convexAILight from '../icons/convex-ai-light.svg';
import { FunctionRunner } from './function-runner/function-runner';
import { Sheet } from './shared/sheet';
import type { CustomQuery } from '../types/functions';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, Treemap, FunnelChart, Funnel,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export interface ChatbotSheetProps {
  isOpen: boolean;
  onClose: () => void;
  adminClient: any;
  accessToken: string;
  convexUrl?: string;
  onTabChange?: (tab: TabId) => void;
  container?: HTMLElement | null;
  componentId?: string | null;
  currentTable?: string | null;
  availableFields?: string[];
  isInDataView?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: boolean;
  model?: string;
  durationMs?: number;
}

interface TableSelectorArtifact {
  query: string;
  filters?: any;
  sortConfig?: any;
}

const SUGGESTIONS = [
  { text: "Show me all users created in the last week", icon: null },
  { text: "Filter by status active", icon: null },
  { text: "Sort by creation date descending", icon: null },
  { text: "Find documents where name contains 'test'", icon: null },
  { text: "Show the 10 most recent entries", icon: null },
];

// Helper function to format log timestamp for display (matching logs-view format)
const formatTimestamp = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) return 'N/A';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();
  return `${month} ${day}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const formatDuration = (ms: number): string => {
  if (!ms || ms < 0) return '';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${mins}m${rem > 0 ? ` ${rem}s` : ''}`;
};

// Helper to parse API errors from stream parts
interface ParsedAPIError {
  type: string;
  code: string;
  message: string;
  isQuotaError: boolean;
  isRateLimitError: boolean;
  isAuthError: boolean;
}

const parseAPIError = (parts: any[]): ParsedAPIError | null => {
  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    if (part?.type === 'error' && part?.errorText) {
      try {
        const errorData = JSON.parse(part.errorText);
        const error = errorData?.error || errorData;
        return {
          type: error?.type || 'unknown_error',
          code: error?.code || error?.type || 'error',
          message: error?.message || 'An unknown error occurred',
          isQuotaError: error?.type === 'insufficient_quota' || error?.code === 'insufficient_quota',
          isRateLimitError: error?.type === 'rate_limit_exceeded' || error?.code === 'rate_limit_exceeded',
          isAuthError: error?.type === 'invalid_api_key' || error?.code === 'invalid_api_key' || error?.type === 'authentication_error',
        };
      } catch {
        return {
          type: 'parse_error',
          code: 'error',
          message: part.errorText || 'An error occurred',
          isQuotaError: false,
          isRateLimitError: false,
          isAuthError: false,
        };
      }
    }
  }
  return null;
};

// Get user-friendly error message
const getErrorDisplayInfo = (error: ParsedAPIError): { title: string; description: string; action?: string; actionUrl?: string } => {
  if (error.isQuotaError) {
    return {
      title: 'API Quota Exceeded',
      description: 'You have exceeded your OpenAI API quota. Please check your plan and billing details.',
      action: 'Check Billing',
      actionUrl: 'https://platform.openai.com/account/billing',
    };
  }
  if (error.isRateLimitError) {
    return {
      title: 'Rate Limit Exceeded',
      description: 'Too many requests. Please wait a moment before trying again.',
    };
  }
  if (error.isAuthError) {
    return {
      title: 'Authentication Error',
      description: 'The API key is invalid or has been revoked. Please check your AI configuration in settings.',
      action: 'Check API Key',
    };
  }
  return {
    title: 'API Error',
    description: error.message,
  };
};

// API Error Artifact Component
const APIErrorArtifact: React.FC<{ error: ParsedAPIError }> = ({ error }) => {
  const displayInfo = getErrorDisplayInfo(error);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 15%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--color-panel-error)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--color-panel-error)',
              marginBottom: '4px',
            }}
          >
            {displayInfo.title}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-panel-text-secondary)',
              lineHeight: 1.5,
              marginBottom: displayInfo.action ? '12px' : 0,
            }}
          >
            {displayInfo.description}
          </div>
          {displayInfo.action && (
            <a
              href={displayInfo.actionUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#fff',
                backgroundColor: 'var(--color-panel-error)',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {displayInfo.action}
              <ArrowRight size={14} />
            </a>
          )}
        </div>
      </div>
      <div
        style={{
          marginTop: '12px',
          padding: '8px 10px',
          backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 5%, var(--color-panel-bg-secondary))',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: 'var(--color-panel-text-muted)',
        }}
      >
        Error code: {error.code}
      </div>
    </div>
  );
};

const CodeArtifact: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '100%',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={12} style={{ color: 'var(--color-panel-accent, #6366f1)' }} />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-panel-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {language || 'Code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '4px',
            backgroundColor: hovered ? 'var(--color-panel-bg-tertiary)' : 'transparent',
            borderRadius: '4px',
            color: copied ? '#10b981' : 'var(--color-panel-text-muted)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <div
        style={{
          padding: '12px',
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: 'var(--color-panel-bg)',
          maxWidth: '100%',
        }}
      >
        <pre
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'var(--color-panel-text)',
            lineHeight: '1.6',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
          }}
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const FilterArtifact: React.FC<{ data: any; onApply?: (data: any) => void; isApplying?: boolean }> = ({ data, onApply, isApplying }) => {
  const canApply = !!onApply && (!!data?.target || !!data?.tableName);
  const tableName = data?.tableName || data?.target || 'Unknown';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rowsRaw = Array.isArray(data.rowsPreview)
    ? data.rowsPreview
    : Array.isArray(data.rows)
      ? data.rows
      : [];
  const rows = rowsRaw;
  const hasRows = rows.length > 0;
  const totalCount = data.count ?? rows.length;

  const filters = Array.isArray(data.filters)
    ? data.filters
    : Array.isArray(data.appliedFilters)
      ? data.appliedFilters
      : data.filter
        ? [data.filter]
        : [];

  const getAllColumns = () => {
    if (!hasRows) return [];
    const allKeys = new Set<string>();
    for (const row of rows) {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(k => allKeys.add(k));
      }
    }
    const keysArray = Array.from(allKeys);
    const ordered: string[] = [];
    if (keysArray.includes('_id')) ordered.push('_id');
    keysArray
      .filter(k => k !== '_id' && k !== '_creationTime')
      .sort()
      .forEach(k => ordered.push(k));
    if (keysArray.includes('_creationTime')) ordered.push('_creationTime');
    return ordered;
  };

  const columns = getAllColumns();

  const formatCellValue = (val: any): string => {
    if (val === undefined || val === null) return '—';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return '[Object]';
      }
    }
    return String(val);
  };

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsCollapsed(!isCollapsed)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          borderBottom: '1px solid var(--color-panel-border)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--color-panel-bg-tertiary)',
          padding: '2px 6px',
          borderRadius: '8px'
        }}>
          <Filter size={12} style={{ color: 'var(--color-panel-text)' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 400,
              fontFamily: 'monospace',
              color: 'var(--color-panel-text)',
            }}
          >
            {tableName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-panel-text-muted)',
            }}
          >
            {totalCount} result{totalCount === 1 ? '' : 's'}
          </span>
          <ChevronDown
            size={14}
            style={{
              transition: 'transform 0.15s ease',
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              color: 'var(--color-panel-text-muted)',
            }}
            aria-hidden
          />
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Applied Filters */}
          {filters.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                // backgroundColor: 'color-mix(in srgb, var(--color-panel-bg-secondary) 50%, transparent)',
                // borderRadius: '8px',
                // border: '1px solid color-mix(in srgb, var(--color-panel-accent, #6366f1) 10%, transparent)',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-panel-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Filters:
              </span>
              {filters.map((f: any, idx: number) => {
                const operatorLabel = f.op || f.operator || '=';
                const valueDisplay = typeof f.value === 'string'
                  ? f.value.length > 20
                    ? f.value.substring(0, 20) + '...'
                    : f.value
                  : typeof f.value === 'boolean'
                    ? f.value
                      ? 'true'
                      : 'false'
                    : JSON.stringify(f.value).length > 20
                      ? JSON.stringify(f.value).substring(0, 20) + '...'
                      : JSON.stringify(f.value);

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      border: '1px solid var(--color-panel-border)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: 'var(--color-panel-text)',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', color: 'var(--color-panel-text-secondary)' }}>
                      {f.field}
                    </span>
                    <span style={{ color: 'var(--color-panel-text-muted)' }}>{operatorLabel}</span>
                    <span style={{
                      fontFamily: 'monospace',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-panel-accent, #6366f1)'
                    }}>
                      {valueDisplay}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Data Table */}
          {hasRows && columns.length > 0 && (
            <div
              style={{
                maxHeight: '300px',
                overflow: 'auto',
                backgroundColor: 'var(--color-panel-bg)',
              }}
            >
              <table className="cp-data-table">
                <thead className="cp-data-table__head">
                  <tr className="cp-data-table__header-row">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="cp-data-table__header-cell"
                        style={{
                          minWidth: col === '_id' ? 200 : col === '_creationTime' ? 180 : 140,
                          maxWidth: col === '_id' ? 240 : col === '_creationTime' ? 200 : 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: 'var(--color-panel-text-muted)',
                          letterSpacing: '0.5px',
                          fontWeight: 400,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, rowIdx: number) => (
                    <tr
                      key={row?._id || rowIdx}
                      className="cp-data-table__row"
                    >
                      {columns.map((col) => {
                        const val = row?.[col];
                        const display = formatCellValue(val);
                        const isId = col === '_id';
                        return (
                          <td
                            key={col}
                            className="cp-data-table__cell"
                            style={{
                              maxWidth: isId ? 240 : 260,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontFamily: isId ? 'monospace' : 'inherit',
                              fontSize: isId ? '11px' : '12px',
                            }}
                            title={display}
                          >
                            <div className="cp-data-table__cell-content">
                              <span style={{ textOverflow: 'ellipsis' }} className="cp-data-table__cell-value">{display}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                {canApply && (
                  <tfoot>
                    <tr className="cp-data-table__row">
                      <td
                        colSpan={columns.length}
                        style={{
                          textAlign: 'right',
                          padding: '8px 12px',
                          fontSize: '11px',
                          color: 'var(--color-panel-text-muted)',
                          backgroundColor: 'var(--color-panel-bg)',
                          borderTop: '1px solid var(--color-panel-border)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onApply?.(data)}
                          disabled={isApplying}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-panel-text)',
                            cursor: isApplying ? 'not-allowed' : 'pointer',
                            opacity: isApplying ? 0.65 : 1,
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            textDecoration: 'none',
                            transition: 'text-decoration 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget.style.textDecoration = isApplying ? 'none' : 'underline'); }}
                          onMouseLeave={e => { (e.currentTarget.style.textDecoration = 'none'); }}
                        >
                          {isApplying ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={12} />}
                          <span>View in Data tab</span>
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* No results message */}
          {!hasRows && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                borderRadius: '6px',
                border: '1px solid color-mix(in srgb, var(--color-panel-border) 60%, transparent)',
                fontSize: '12px',
                color: 'var(--color-panel-text-muted)',
                textAlign: 'center',
              }}
            >
              No results found for this filter.
            </div>
          )}

        </div>
      )}
    </div>
  );
};


// Action Artifact Component
const ActionArtifact: React.FC<{ data: any }> = ({ data }) => {
  const isCreateTable = data.action === 'createTable';
  const isAddColumn = data.action === 'addColumn';
  const isListTables = data.action === 'listTables';
  const isSuccess = data.result?.success;
  const componentId = data.componentId;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isSuccess && !isListTables) {
      // Dispatch event to refresh data view (sidebar, etc.)
      const event = new CustomEvent('convex-panel-function-completed', {
        detail: {
          success: true,
          udfType: 'action',
          componentId: componentId || null,
        },
      });
      window.dispatchEvent(event);
    }
  }, [isSuccess, componentId, isListTables]);

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--color-panel-border)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              backgroundColor: isSuccess
                ? 'color-mix(in srgb, var(--color-panel-success, #22c55e) 12%, transparent)'
                : 'color-mix(in srgb, var(--color-panel-error, #ef4444) 12%, transparent)',
              color: isSuccess ? 'var(--color-panel-success, #22c55e)' : 'var(--color-panel-error, #ef4444)',
              border: `1px solid ${isSuccess ? 'color-mix(in srgb, var(--color-panel-success, #22c55e) 35%, transparent)' : 'color-mix(in srgb, var(--color-panel-error, #ef4444) 35%, transparent)'}`,
            }}
          >
            {isSuccess ? <Check size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <span
              style={{
                fontSize: '9px',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                color: 'var(--color-panel-text-muted)',
                lineHeight: '1.1',
                marginBottom: '0px',
              }}
            >
              {isCreateTable ? 'Table Created' : isAddColumn ? 'Column Added' : isListTables ? 'Tables Found' : 'Action Completed'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 400,
                fontFamily: 'monospace',
                color: 'var(--color-panel-text)',
                lineHeight: '1.15',
                marginTop: '0px',
              }}
            >
              {isCreateTable ? data.tableName || data.name || 'New table' : isAddColumn ? data.columnName || 'Column' : isListTables ? `${data.result?.tables?.length || 0} tables` : data.message || 'Operation'}
            </span>
          </div>
        </div>
        <div style={{ color: 'var(--color-panel-text-muted)' }}>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div>
          {isCreateTable && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
                <Table size={16} style={{ color: 'var(--color-panel-text-muted)' }} />
                <span style={{ fontSize: '11px', fontWeight: 400, fontFamily: 'monospace', color: 'var(--color-panel-text)' }}>
                  {data.tableName}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 400,
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    backgroundColor: 'color-mix(in srgb, var(--color-panel-success, #22c55e) 12%, transparent)',
                    color: 'var(--color-panel-success, #22c55e)',
                    border: '1px solid color-mix(in srgb, var(--color-panel-success, #22c55e) 35%, transparent)',
                    marginLeft: 'auto',
                  }}
                >
                  New Table
                </span>
              </div>

              {/* Show columns if available */}
              {data.columns && Array.isArray(data.columns) && data.columns.length > 0 && (
                <div>
                  {data.columns.map((col: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', paddingTop: '4px', paddingBottom: '4px', paddingLeft: '24px' }}>
                      <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--color-panel-border)', marginRight: '4px' }} />
                      <span style={{ fontSize: '11px', fontWeight: 400, fontFamily: 'monospace', color: 'var(--color-panel-text)' }}>
                        {col.name}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 400,
                          fontFamily: 'monospace',
                          padding: '1px 5px',
                          borderRadius: '8px',
                          backgroundColor: 'color-mix(in srgb, var(--color-panel-warning, #fbbf24) 20%, transparent)',
                          color: 'var(--color-panel-warning, #fbbf24)',
                          border: '1px solid color-mix(in srgb, var(--color-panel-warning, #fbbf24) 40%, transparent)',
                          marginLeft: '6px',
                        }}
                      >
                        {col.type || col.fieldType || 'field'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isListTables && data.result?.tables && (
            <div style={{ padding: '8px' }}>
              {data.result.tables.map((table: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: idx < data.result.tables.length - 1 ? '1px solid var(--color-panel-border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Table size={14} style={{ color: 'var(--color-panel-text-muted)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--color-panel-text)', fontFamily: 'monospace' }}>
                      {table.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
                    {table.count} rows
                  </span>
                </div>
              ))}
            </div>
          )}

          {isAddColumn && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                borderRadius: '6px',
                border: '1px solid var(--color-panel-border)',
                padding: '8px',
              }}
            >
              {/* Table Node */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px' }}>
                <ChevronDown size={14} style={{ color: 'var(--color-panel-text-muted)' }} />
                <Table size={14} style={{ color: 'var(--color-panel-text-muted)' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-panel-text)' }}>{data.tableName}</span>
              </div>

              {/* Column Node */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '24px', paddingTop: '2px' }}>
                <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--color-panel-border)', marginRight: '4px' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-panel-text)', fontWeight: 500 }}>
                  {data.columnName}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    marginLeft: '6px',
                  }}
                >
                  New Field
                </span>
              </div>
            </div>
          )}

          {!isListTables && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-panel-text-secondary)', padding: '0 12px 12px' }}>
              {data.message || (isSuccess ? 'Operation completed successfully.' : 'Operation failed.')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Create Table Artifact Component
const CreateTableArtifact: React.FC<{ data: any }> = ({ data }) => {
  const tableName = data.tableName || data.name || 'New table';
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const hasColumns = columns.length > 0;

  if (!hasColumns) {
    return (
      <div
        style={{
          margin: '8px 0',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 12%, transparent)',
              color: 'var(--color-panel-accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Table size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--color-panel-text-muted)',
                fontWeight: 600,
              }}
            >
              New Table
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-panel-text)' }}>
              {tableName}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '999px',
            backgroundColor: 'color-mix(in srgb, var(--color-panel-success, #22c55e) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-panel-success, #22c55e) 30%, transparent)',
            color: 'var(--color-panel-success, #22c55e)',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          <Check size={14} strokeWidth={3} />
          Ready
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--color-panel-border)',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '10px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 12%, transparent)',
              color: 'var(--color-panel-accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Table size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--color-panel-text-muted)',
                fontWeight: 600,
              }}
            >
              Schema Definition
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-panel-text)' }}>
              {tableName}
            </span>
          </div>
        </div>

        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'color-mix(in srgb, var(--color-panel-success, #22c55e) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-panel-success, #22c55e) 30%, transparent)',
            color: 'var(--color-panel-success, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={16} />
        </div>
      </div>

      <div
        style={{
          padding: '12px 14px',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: 0,
              bottom: '8px',
              width: '1px',
              backgroundColor: 'var(--color-panel-border)',
            }}
          />
          {columns.map((col: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '1px',
                  backgroundColor: 'var(--color-panel-border)',
                  marginLeft: '6px',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  border: '1px solid var(--color-panel-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Columns size={14} style={{ color: 'var(--color-panel-text-muted)' }} />
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-panel-text)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {col.name || col.field || `column_${idx + 1}`}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--color-panel-accent, #6366f1)',
                    backgroundColor: 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--color-panel-accent, #6366f1) 30%, transparent)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {col.type || col.fieldType || 'field'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChartArtifact: React.FC<{ data: any }> = ({ data }) => {
  const chartType = data.chartType || 'bar';
  const chartData = data.data || [];
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderChart = () => {
    switch (chartType.toLowerCase()) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-panel-border)" />
            <XAxis dataKey="label" stroke="var(--color-panel-text-muted)" fontSize={10} />
            <YAxis stroke="var(--color-panel-text-muted)" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-panel-border)" />
            <XAxis dataKey="label" stroke="var(--color-panel-text-muted)" fontSize={10} />
            <YAxis stroke="var(--color-panel-text-muted)" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        );
      case 'pie':
      case 'doughnut':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={chartType.toLowerCase() === 'doughnut' ? 40 : 0}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              nameKey="label"
            >
              {chartData.map((index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
            <Legend />
          </PieChart>
        );
      case 'scatter':
      case 'bubble':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-panel-border)" />
            <XAxis type="category" dataKey="label" name="Category" stroke="var(--color-panel-text-muted)" fontSize={10} />
            <YAxis type="number" dataKey="value" name="Value" stroke="var(--color-panel-text-muted)" fontSize={10} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
            <Legend />
            <Scatter name={data.title} data={chartData} fill="#8884d8" />
          </ScatterChart>
        );
      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="var(--color-panel-border)" />
            <PolarAngleAxis dataKey="label" stroke="var(--color-panel-text-muted)" fontSize={10} />
            <PolarRadiusAxis stroke="var(--color-panel-text-muted)" fontSize={10} />
            <Radar name={data.title} dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Legend />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
          </RadarChart>
        );
      case 'radialbar':
        return (
          <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={chartData}>
            <RadialBar
              label={{ position: 'insideStart', fill: '#fff' }}
              background
              dataKey="value"
            />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ top: '50%', right: 0, transform: 'translate(0, -50%)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
          </RadialBarChart>
        );
      case 'treemap':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
            >
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
                itemStyle={{ color: 'var(--color-panel-text)' }}
              />
            </Treemap>
          </ResponsiveContainer>
        );
      case 'funnel':
        return (
          <FunnelChart>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
            <Funnel
              dataKey="value"
              data={chartData}
              isAnimationActive
            >
              {/* @ts-ignore LabelList not exported from recharts root in some versions */}
              {/* <LabelList position="right" fill="#000" stroke="none" dataKey="label" /> */}
            </Funnel>
          </FunnelChart>
        );
      case 'bar':
      case 'column':
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-panel-border)" />
            <XAxis dataKey="label" stroke="var(--color-panel-text-muted)" fontSize={10} />
            <YAxis stroke="var(--color-panel-text-muted)" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-panel-border)', color: 'var(--color-panel-text)' }}
              itemStyle={{ color: 'var(--color-panel-text)' }}
            />
            <Legend />
            <Bar dataKey="value" fill="#8884d8">
              {chartData.map((index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsCollapsed(!isCollapsed)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          padding: '8px 12px',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--color-panel-border)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            padding: '2px 6px',
            borderRadius: '8px',
          }}
        >
          <BarChart3 size={14} style={{ color: 'var(--color-panel-text)' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 400,
              fontFamily: 'monospace',
              color: 'var(--color-panel-text)',
            }}
          >
            {data.title || 'Chart'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--color-panel-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              backgroundColor: 'var(--color-panel-bg)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--color-panel-border)',
            }}
          >
            {chartType} chart
          </span>
          <ChevronDown
            size={14}
            style={{
              transition: 'transform 0.15s ease',
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              color: 'var(--color-panel-text-muted)',
            }}
            aria-hidden
          />
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ width: '100%', height: 300, padding: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// Query Artifact Component
const QueryArtifact: React.FC<{
  data: any;
  onRunQuery: (query: CustomQuery) => void;
}> = ({ data, onRunQuery }) => {
  const handleRun = () => {
    const customQuery: CustomQuery = {
      type: 'customQuery',
      table: data.table || null,
      componentId: data.componentId || null,
    };
    onRunQuery(customQuery);
  };

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid color-mix(in srgb, var(--color-panel-accent, #6366f1) 20%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 5%, transparent)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 10%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--color-panel-accent, #6366f1) 10%, transparent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={14} style={{ color: 'var(--color-panel-accent, #6366f1)' }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 80%, white)',
            }}
          >
            Custom Query
          </span>
          {data.table && (
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 60%, white)',
                marginLeft: '8px',
              }}
            >
              {data.table}
            </span>
          )}
        </div>
        <button
          onClick={handleRun}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'var(--color-panel-accent, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 90%, black)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-accent, #6366f1)';
          }}
        >
          <Play size={12} fill="currentColor" />
          Run Query
        </button>
      </div>
      {data.description && (
        <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
          {data.description}
        </div>
      )}
      {data.query && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--color-panel-bg)',
            borderTop: '1px solid color-mix(in srgb, var(--color-panel-border) 50%, transparent)',
          }}
        >
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'var(--color-panel-text)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {data.query}
          </pre>
        </div>
      )}
    </div>
  );
};

// Logs Artifact Component
const LogsArtifact: React.FC<{
  data: any;
  onViewLogs?: (filters: any) => void;
  totalCount?: number;
  displayLimit?: number;
}> = ({ data, onViewLogs, totalCount, displayLimit = 5 }) => {
  const handleViewLogs = () => {
    if (!onViewLogs) return;

    // Extract filter information from artifact data
    const filters: any = {
      searchQuery: data.filters?.searchQuery || '',
      logTypes: data.filters?.logTypes || [],
      functionIds: data.filters?.functionIds || [],
      componentIds: data.filters?.componentIds || [],
    };

    // If no explicit filters, try to extract from logs
    if (!filters.logTypes.length && data.logs) {
      const logLevels = new Set<string>();
      data.logs.forEach((log: any) => {
        if (log.level) {
          const level = log.level.toLowerCase();
          if (level === 'error') logLevels.add('error');
          else if (level === 'warn' || level === 'warning') logLevels.add('warn');
          else if (level === 'success') logLevels.add('success');
          else if (level === 'debug') logLevels.add('debug');
          else if (level === 'info' || level === 'loginfo') logLevels.add('log / info');
        }
      });
      filters.logTypes = Array.from(logLevels);
    }

    // Extract search query from log messages if not provided
    if (!filters.searchQuery && data.logs && data.logs.length > 0) {
      // Use first log message as search hint
      const firstMessage = data.logs[0]?.logPreview || data.logs[0]?.message;
      if (firstMessage && firstMessage.length < 50) {
        filters.searchQuery = firstMessage;
      }
    }

    onViewLogs(filters);
  };

  // Determine how many logs to display and if there are more
  const effectiveTotalCount = totalCount !== undefined ? totalCount : (data.logs?.length || 0);
  const logsToDisplay = (data.logs || []).slice(0, displayLimit);
  const hasMore = effectiveTotalCount > displayLimit;
  const remainingCount = effectiveTotalCount - displayLimit;

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} style={{ color: '#fbbf24' }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
            }}
          >
            {data.title || 'Logs'}
          </span>
        </div>
        {onViewLogs && (
          <button
            onClick={handleViewLogs}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--color-panel-accent, #6366f1)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-accent, #6366f1) 90%, black)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent, #6366f1)';
            }}
          >
            {hasMore ? (
              <>
                <ArrowRight size={12} />
                +{remainingCount} more
              </>
            ) : (
              <>
                <Eye size={12} />
                View Logs
              </>
            )}
          </button>
        )}
      </div>

      {/* Table Header */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-panel-border)',
          color: 'var(--color-panel-text-muted)',
          padding: '4px 8px',
          backgroundColor: 'var(--color-panel-bg)',
          alignItems: 'center',
          fontSize: '11px',
        }}
      >
        <div style={{ width: '160px' }}>Timestamp</div>
        <div style={{ width: '80px' }}>ID</div>
        <div style={{ width: '128px' }}>Status</div>
        <div style={{ flex: 1 }}>Function</div>
      </div>

      {/* Log Rows */}
      <div style={{ fontSize: '11px' }}>
        {logsToDisplay.map((log: any, i: number) => {
          // Ensure timestamp is a valid number
          const timestamp = typeof log.timestamp === 'number' ? log.timestamp :
            typeof log.timestamp === 'string' ? parseInt(log.timestamp, 10) :
              null;
          const timestampFormatted = timestamp && !isNaN(timestamp) && timestamp > 0
            ? formatTimestamp(timestamp)
            : 'N/A';

          // Safely access properties with defaults
          const isError = log.isError === true;
          const isSuccess = log.isSuccess === true;
          const shortId = log.shortId || '-';
          const functionIdentifier = log.functionIdentifier || '';
          const functionName = log.functionName || '';
          const logTypeIcon = log.logTypeIcon || 'L';
          const logPreview = log.logPreview || null;
          const errorMessage = log.errorMessage || null;
          const executionTime = log.executionTime || null;
          const isCached = log.isCached === true;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                padding: '4px 8px',
                backgroundColor: isError
                  ? 'color-mix(in srgb, var(--color-background-error) 50%, transparent)'
                  : 'transparent',
                borderBottom: i < logsToDisplay.length - 1 ? '1px solid color-mix(in srgb, var(--color-panel-border) 30%, transparent)' : 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isError) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                } else {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-background-error) 60%, transparent)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isError
                  ? 'color-mix(in srgb, var(--color-background-error) 50%, transparent)'
                  : 'transparent';
              }}
            >
              {/* Timestamp */}
              <div style={{
                width: '160px',
                color: isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-secondary)',
                fontFamily: 'monospace',
              }}>
                {timestampFormatted}
              </div>

              {/* ID */}
              <div style={{
                width: '80px',
                color: isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {shortId && shortId !== '-' && shortId !== '' ? (
                  <span
                    style={{
                      border: isError
                        ? '1px solid var(--color-background-errorSecondary)'
                        : '1px solid var(--color-panel-border)',
                      borderRadius: '6px',
                      padding: '0 4px',
                      fontSize: '10px',
                      backgroundColor: isError
                        ? 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)'
                        : 'transparent',
                      color: isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-muted)',
                    }}
                  >
                    {shortId}
                  </span>
                ) : null}
              </div>

              {/* Status */}
              <div style={{
                width: '128px',
                color: isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {isSuccess ? (
                  <>
                    <span style={{ color: 'var(--color-panel-success)' }}>200</span>
                    {isCached ? (
                      <span style={{ color: 'var(--color-panel-success)', fontSize: '10px', fontWeight: 500 }}>(cached)</span>
                    ) : executionTime ? (
                      <span style={{ color: 'var(--color-panel-text-muted)' }}>{executionTime}</span>
                    ) : null}
                  </>
                ) : isError ? (
                  <>
                    <XCircle size={14} style={{ color: 'var(--color-panel-error)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-panel-error)' }}>failure</span>
                    {executionTime && (
                      <span style={{ color: 'var(--color-panel-text-muted)' }}>{executionTime}</span>
                    )}
                  </>
                ) : (
                  <span style={{ color: 'var(--color-panel-text-muted)' }}>-</span>
                )}
              </div>

              {/* Function */}
              <div style={{
                flex: 1,
                color: isError ? 'var(--color-panel-error)' : 'var(--color-panel-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
                overflow: 'hidden',
              }}>
                {/* Log Type Icon */}
                <span
                  style={{
                    borderRadius: '6px',
                    padding: '0px',
                    fontSize: '10px',
                    backgroundColor: isError
                      ? 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)'
                      : 'var(--color-panel-bg-tertiary)',
                    fontWeight: 700,
                    textAlign: 'center',
                    minWidth: '16px',
                    flexShrink: 0,
                  }}
                >
                  {logTypeIcon}
                </span>

                {/* Function Identifier */}
                {functionIdentifier && (
                  <span
                    style={{
                      color: isError
                        ? 'var(--color-panel-error)'
                        : 'var(--color-panel-text-muted)',
                      marginRight: '4px',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                    }}
                  >
                    {functionIdentifier}:
                  </span>
                )}

                {/* Function Name */}
                {functionName && (
                  <span
                    style={{
                      color: 'var(--color-panel-text-muted)',
                      flexShrink: 0,
                      marginRight: '8px',
                    }}
                    title={functionIdentifier ? `${functionIdentifier}:${functionName}` : functionName}
                  >
                    {functionName}
                  </span>
                )}

                {/* Log Preview */}
                {logPreview && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        borderRadius: '4px',
                        padding: '2px 4px',
                        fontSize: '10px',
                        backgroundColor: 'var(--color-panel-bg-secondary)',
                        color: 'var(--color-panel-text-secondary)',
                        fontFamily: 'monospace',
                        flexShrink: 0,
                      }}
                    >
                      log
                    </span>
                    <span
                      style={{
                        color: 'var(--color-panel-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                      title={logPreview}
                    >
                      {logPreview}
                    </span>
                  </span>
                )}

                {/* Error Message */}
                {errorMessage && (
                  <span
                    style={{
                      color: 'var(--color-panel-error)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      minWidth: 0,
                      marginLeft: '8px',
                    }}
                    title={errorMessage}
                  >
                    {errorMessage}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Metrics Artifact Component
const MetricsArtifact: React.FC<{
  data: any;
}> = ({ data }) => {
  const summary = data.summary || {};
  const topFailingFunctions = data.topFailingFunctions || [];

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={16} style={{ color: 'var(--color-panel-accent, #6366f1)' }} />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
            }}
          >
            {data.title || 'Function Metrics'}
          </span>
          {summary.timeWindow && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-panel-text-muted)',
                fontWeight: 400,
              }}
            >
              ({summary.timeWindow})
            </span>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--color-panel-bg)',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-panel-text-muted)',
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              Total Executions
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
              }}
            >
              {summary.totalExecutions?.toLocaleString() || 0}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-panel-text-muted)',
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              Total Failures
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: summary.totalFailures > 0 ? 'var(--color-panel-error)' : 'var(--color-panel-success)',
              }}
            >
              {summary.totalFailures?.toLocaleString() || 0}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-panel-text-muted)',
                marginBottom: '4px',
                fontWeight: 500,
              }}
            >
              Failure Rate
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: (summary.overallFailureRate || 0) > 10 ? 'var(--color-panel-error)' :
                  (summary.overallFailureRate || 0) > 5 ? '#fbbf24' : 'var(--color-panel-success)',
              }}
            >
              {(summary.overallFailureRate || 0).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Top Failing Functions */}
      {topFailingFunctions.length > 0 ? (
        <>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              borderBottom: '1px solid var(--color-panel-border)',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
              }}
            >
              Top Failing Functions
            </span>
          </div>

          {/* Table Header */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--color-panel-border)',
              color: 'var(--color-panel-text-muted)',
              padding: '8px 16px',
              backgroundColor: 'var(--color-panel-bg)',
              alignItems: 'center',
              fontSize: '11px',
              fontWeight: 500,
            }}
          >
            <div style={{ width: '40px' }}>#</div>
            <div style={{ flex: 1 }}>Function</div>
            <div style={{ width: '120px', textAlign: 'right' }}>Failures</div>
            <div style={{ width: '100px', textAlign: 'right' }}>Failure Rate</div>
          </div>

          {/* Function Rows */}
          <div style={{ fontSize: '12px' }}>
            {topFailingFunctions.map((func: any, index: number) => {
              const failureRate = func.failureRate || 0;
              const isHighFailure = failureRate >= 50;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    padding: '10px 16px',
                    backgroundColor: isHighFailure
                      ? 'color-mix(in srgb, var(--color-background-error) 30%, transparent)'
                      : 'transparent',
                    borderBottom: index < topFailingFunctions.length - 1
                      ? '1px solid color-mix(in srgb, var(--color-panel-border) 30%, transparent)'
                      : 'none',
                    transition: 'background-color 0.2s ease',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isHighFailure
                      ? 'color-mix(in srgb, var(--color-background-error) 40%, transparent)'
                      : 'var(--color-panel-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isHighFailure
                      ? 'color-mix(in srgb, var(--color-background-error) 30%, transparent)'
                      : 'transparent';
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    width: '40px',
                    color: 'var(--color-panel-text-muted)',
                    fontWeight: 500,
                  }}>
                    {index + 1}
                  </div>

                  {/* Function Name */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: isHighFailure ? 'var(--color-panel-error)' : 'var(--color-panel-text)',
                      }}
                    >
                      {func.functionName || func.identifier}
                    </div>
                    {func.functionPath && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-panel-text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {func.functionPath}
                      </div>
                    )}
                  </div>

                  {/* Failures */}
                  <div style={{
                    width: '120px',
                    textAlign: 'right',
                    color: isHighFailure ? 'var(--color-panel-error)' : 'var(--color-panel-text)',
                    fontWeight: 500,
                  }}>
                    {func.failures?.toLocaleString() || 0} / {func.total?.toLocaleString() || 0}
                  </div>

                  {/* Failure Rate */}
                  <div style={{
                    width: '100px',
                    textAlign: 'right',
                    color: failureRate >= 50 ? 'var(--color-panel-error)' :
                      failureRate >= 10 ? '#fbbf24' : 'var(--color-panel-text)',
                    fontWeight: 600,
                  }}>
                    {failureRate.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--color-panel-text-muted)',
            fontSize: '12px',
          }}
        >
          ✅ No function failures detected!
        </div>
      )}
    </div>
  );
};

// Memoized input component to prevent parent re-renders during typing
interface ChatInputProps {
  onSubmit: (value: string) => void;
  isLoading: boolean;
  isLoadingTables: boolean;
  aiAvailable: boolean;
  checkingAi: boolean;
  onSuggestionClick?: (text: string) => void;
}

const ChatInput = React.memo<ChatInputProps>(({
  onSubmit,
  isLoading,
  isLoadingTables,
  aiAvailable,
  checkingAi,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || isLoadingTables || !aiAvailable || checkingAi) return;
    onSubmit(trimmed);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = '36px';
    }
  }, [inputValue, isLoading, isLoadingTables, aiAvailable, checkingAi, onSubmit]);

  const isDisabled = isLoading || isLoadingTables || !aiAvailable || checkingAi;
  const hasInput = inputValue.trim().length > 0;

  return (
    <div
      style={{
        padding: '8px 12px 12px 12px',
        backgroundColor: 'transparent',
        flexShrink: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-panel-bg-secondary)',
          border: `1px solid ${isDisabled ? 'var(--color-panel-border)' : 'var(--color-panel-border)'}`,
          borderRadius: '16px',
          transition: 'all 0.2s ease',
          opacity: isDisabled ? 0.8 : 1,
          minWidth: 0,
          maxWidth: '100%',
        }}
        onFocus={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.borderColor = 'var(--color-panel-text-muted)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-panel-border)';
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={aiAvailable ? "Make changes, add new features, ask for anything" : "AI Assistant requires an API key"}
            disabled={isDisabled}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              fontSize: '12px',
              color: 'var(--color-panel-text)',
              padding: '16px 16px 8px 16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              minHeight: '36px',
              maxHeight: '56px',
              overflowY: 'auto',
              lineHeight: '1.5',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.max(56, target.scrollHeight)}px`;
            }}
          />

          {/* Bottom Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px 8px 8px',
              marginTop: '4px',
            }}
          >
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="submit"
                disabled={!hasInput || isDisabled}
                style={{
                  padding: '4px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: hasInput && !isLoading && !isLoadingTables ? 'pointer' : 'not-allowed',
                  backgroundColor: hasInput && !isLoading && !isLoadingTables
                    ? 'var(--color-panel-accent, #6366f1)'
                    : 'var(--color-panel-bg-tertiary)',
                  color: hasInput && !isLoading && !isLoadingTables ? '#fff' : 'var(--color-panel-text-muted)',
                  boxShadow: hasInput && !isLoading && !isLoadingTables
                    ? '0 4px 12px color-mix(in srgb, var(--color-panel-accent, #6366f1) 20%, transparent)'
                    : 'none',
                }}
              >
                {isLoading || isLoadingTables ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ArrowUp size={18} />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});


export const ChatbotSheet = React.memo<ChatbotSheetProps>((props) => {
  const {
    isOpen,
    onClose,
    adminClient,
    accessToken,
    convexUrl,
    onTabChange,
    container,
    componentId = null,
    currentTable = null,
  } = props;

  // DEBUG: Track renders
  const renderCount = useRef(0);
  renderCount.current++;
  console.log('[ChatbotSheet] Render #', renderCount.current);

  const prevProps = useRef<ChatbotSheetProps>(props);
  useEffect(() => {
    const changes: string[] = [];
    const prev = prevProps.current;
    if (prev.isOpen !== props.isOpen) changes.push('isOpen');
    // if (prev.onClose !== props.onClose) changes.push('onClose');
    if (prev.adminClient !== props.adminClient) changes.push('adminClient');
    if (prev.accessToken !== props.accessToken) changes.push('accessToken');
    if (prev.convexUrl !== props.convexUrl) changes.push('convexUrl');
    // if (prev.onTabChange !== props.onTabChange) changes.push('onTabChange');
    if (prev.container !== props.container) changes.push('container');
    if (prev.componentId !== props.componentId) changes.push('componentId');
    if (prev.currentTable !== props.currentTable) changes.push('currentTable');


    prevProps.current = props;
  });

  const { theme } = useThemeSafe();
  const { refreshFilters } = useDataViewContext();

  // Stable admin client ref to avoid effect re-runs when object identity changes but content is same
  // This happens often with ConvexReactClient being recreated in parent
  const adminClientRef = useRef(adminClient);
  useEffect(() => {
    adminClientRef.current = adminClient;
  }, [adminClient]);



  // Chat storage state
  const [aiAvailable, setAiAvailable] = useState(false);
  const [checkingAi, setCheckingAi] = useState(true);
  const [, setAiConfig] = useState<AIConfig | null>(null);
  const [chats, setChats] = useState<AIChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [, setAgentTools] = useState<AgentTool[]>([]);
  const [, setLoadingTools] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  // Message state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you filter your data, answer questions, and more. Try asking me something like 'Show me all users created in the last week' or 'Filter by status active'.",
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // DEBUG: Track isLoading changes
  useEffect(() => {
    console.log('[ChatbotSheet] isLoading changed to:', isLoading);
  }, [isLoading]);

  // DEBUG: Track messages changes
  useEffect(() => {
    console.log('[ChatbotSheet] messages changed, count:', messages.length, 'last:', messages[messages.length - 1]?.content?.substring(0, 50));
  }, [messages]);
  const [tables, setTables] = useState<TableDefinition>({});
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tableSelectorArtifact, setTableSelectorArtifact] = useState<TableSelectorArtifact | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sheetWidth, setSheetWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [isFunctionRunnerOpen, setIsFunctionRunnerOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<CustomQuery | null>(null);
  const [applyingFilterTarget, setApplyingFilterTarget] = useState<string | null>(null);
  const [messageMeta,] = useState<Record<string, { model?: string; durationMs?: number }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamPollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load a specific chat
  const loadChat = useCallback(async (chatId: string) => {
    if (!adminClient) return;

    try {
      const chat = await getChat(adminClient, chatId);
      if (chat) {
        setCurrentChatId(chatId);
        // Convert AIChatMessage to Message format
        const convertedMessages: Message[] = chat.messages.map((msg) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          error: msg.error,
        }));

        // Add welcome message if no messages exist
        if (convertedMessages.length === 0) {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI assistant. I can help you filter your data, answer questions, and more. Try asking me something like 'Show me all users created in the last week' or 'Filter by status active'.",
            timestamp: Date.now(),
          }]);
        } else {
          setMessages(convertedMessages);
        }
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  }, [adminClient]);

  // Load chats function
  const loadChats = useCallback(async () => {
    if (!adminClient) return;

    setIsLoadingChats(true);
    try {
      const fetchedChats = await listChats(adminClient);
      setChats(fetchedChats);

      // Load most recent chat if available and no current chat
      if (fetchedChats.length > 0 && !currentChatId) {
        const mostRecentChat = fetchedChats[0];
        await loadChat(mostRecentChat._id);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [adminClient, currentChatId, loadChat]);

  // Check AI availability when sheet opens
  useEffect(() => {
    if (isOpen && adminClient) {
      // Don't set checkingAi to true immediately if we already have a result
      // This prevents flashing "loading" state on every prop change
      if (!aiAvailable) {
        setCheckingAi(true);
      }

      isAIAvailable(adminClient)
        .then((available) => {
          setAiAvailable(available);
          if (available) {
            loadChats();
            // Fetch config for model name display
            getAIConfig(adminClient)
              .then((config) => setAiConfig(config))
              .catch((error) => {
                console.error('Error fetching AI config:', error);
                setAiConfig(null);
              });
          }
        })
        .catch((error) => {
          console.error('Error checking AI availability:', error);
          setAiAvailable(false);
        })
        .finally(() => {
          setCheckingAi(false);
        });
    } else if (!isOpen) {
      // Only reset when closed
      // setAiAvailable(false); 
      // setCheckingAi(false);
    }
  }, [isOpen, adminClient, loadChats]);

  // Fetch tables when sheet opens
  useEffect(() => {
    if (isOpen && convexUrl && adminClient && aiAvailable) {
      setIsLoadingTables(true);
      getTablesForChatbot(convexUrl, accessToken, adminClient, componentId)
        .then((fetchedTables) => {
          setTables(fetchedTables);
        })
        .catch((error) => {
          console.error('Error fetching tables:', error);
        })
        .finally(() => {
          setIsLoadingTables(false);
        });
    }
  }, [isOpen, convexUrl, accessToken, adminClient, componentId, aiAvailable]);

  // Load available Agent tools (for display) when AI is available
  useEffect(() => {
    if (!isOpen || !aiAvailable || !adminClient) {
      setAgentTools([]);
      return;
    }

    setLoadingTools(true);
    listAgentTools(adminClient)
      .then((tools) => setAgentTools(tools || []))
      .catch((error) => {
        console.error('Error loading agent tools:', error);
        setAgentTools([]);
      })
      .finally(() => setLoadingTools(false));
  }, [isOpen, aiAvailable, adminClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopStreamPolling = useCallback(() => {
    if (streamPollerRef.current) {
      clearInterval(streamPollerRef.current);
      streamPollerRef.current = null;
    }
    streamingMessageIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopStreamPolling();
    };
  }, [stopStreamPolling]);



  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (!container && isOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!container) {
      document.body.style.overflow = '';
    }
    return () => {
      if (!container) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, container]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sheetRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 400;
      const isInContainerLocal = Boolean(container);
      const maxWidth = isInContainerLocal ? window.innerWidth * 0.8 : window.innerWidth * 0.9;
      setSheetWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, container]);

  // Chat management functions
  const handleNewChat = useCallback(async () => {
    if (!adminClient) return;

    try {
      const title = 'New chat';
      const { chatId } = await createChat(adminClient, title);

      setCurrentChatId(chatId);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI assistant. I can help you filter your data, answer questions, and more. Try asking me something like 'Show me all users created in the last week' or 'Filter by status active'.",
        timestamp: Date.now(),
      }]);
      setShowSuggestions(true);


      // Refresh chat list so the new chat appears immediately
      const refreshedChats = await listChats(adminClient);
      setChats(refreshedChats);
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  }, [adminClient]);

  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    if (!adminClient || !newTitle.trim()) return;

    try {
      await updateChatTitle(adminClient, chatId, newTitle.trim());
      setChats((prev) => prev.map((chat) =>
        chat._id === chatId ? { ...chat, title: newTitle.trim() } : chat
      ));
      setEditingChatId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  }, [adminClient]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    if (!adminClient) return;

    try {
      await deleteChat(adminClient, chatId);

      // Refresh list to stay in sync with backend
      const refreshed = await listChats(adminClient);
      setChats(refreshed);

      // If we deleted the active chat, select another or create a new one
      if (currentChatId === chatId) {
        const fallbackId = refreshed[0]?._id;
        if (fallbackId) {
          await loadChat(fallbackId);
        } else {
          await handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
    setDeletingChatId(null);
  }, [adminClient, currentChatId, handleNewChat]);

  // Helper to add assistant message and save to backend
  const addAssistantMessage = useCallback(async (content: string, isError: boolean = false) => {
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      error: isError,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Save to backend if chat exists
    if (currentChatId && adminClient) {
      try {
        await saveMessage(adminClient, currentChatId, 'assistant', content, isError);
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }
  }, [currentChatId, adminClient]);

  const applyFilterArtifact = useCallback(async (artifact: any) => {
    const targetTable =
      artifact?.target ||
      artifact?.tableName ||
      currentTable ||
      null;

    if (!targetTable) {
      await addAssistantMessage('Could not apply filters: missing table name in AI response.', true);
      return;
    }

    try {
      setApplyingFilterTarget(targetTable);

      // Normalize filters into the table filter shape
      const rawFilters = Array.isArray(artifact?.filters)
        ? artifact.filters
        : Array.isArray(artifact?.appliedFilters)
          ? artifact.appliedFilters
          : [];

      const clauses =
        rawFilters?.map((clause: any, idx: number) => ({
          field: clause.field,
          op: clause.op || 'eq',
          value: clause.value,
          enabled: clause.enabled !== false,
          id: clause.id || `${clause.field}_${idx}`,
        }))?.filter((c: any) => !!c.field) || [];

      const filterExpression = { clauses };
      saveTableFilters(targetTable, filterExpression);

      const sortCfg = artifact?.sort || artifact?.sortConfig || null;
      saveTableSortConfig(targetTable, sortCfg);

      saveActiveTable(targetTable);

      // Notify data view to refresh
      refreshFilters?.();

      // Switch to data tab if available
      if (onTabChange) {
        onTabChange('data');
      }

      await addAssistantMessage(
        `Applied ${clauses.length || 0} filter${clauses.length === 1 ? '' : 's'} to table "${targetTable}".`,
        false
      );
    } catch (error: any) {
      console.error('Error applying filter artifact:', error);
      await addAssistantMessage(
        error?.message || 'Failed to apply filters from AI result. Please try again.',
        true
      );
    } finally {
      setApplyingFilterTarget(null);
    }
  }, [addAssistantMessage, onTabChange, refreshFilters]);

  const startStreamPolling = useCallback((chatId: string, onComplete?: () => void) => {
    if (!adminClient) return;

    // Use existing placeholder ID or create new one
    let messageId = streamingMessageIdRef.current;
    if (!messageId) {
      messageId = `assistant-stream-${Date.now()}`;
      streamingMessageIdRef.current = messageId;
      setMessages((prev) => [
        ...prev,
        {
          id: messageId!,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]);
    }

    const startTime = Date.now();
    // Track which stream IDs existed BEFORE we started - used to identify NEW streams
    let existingStreamIds: Set<string> | null = null;
    // Track the new stream we're waiting for
    let newStreamId: string | null = null;

    console.log('[ChatbotSheet] startStreamPolling called for chatId:', chatId);
    const poll = async () => {
      console.log('[ChatbotSheet] poll() executing...');
      try {
        // Get all streams, we'll filter by status on the client
        const res = await listChatStreams(adminClient, { chatId, streamArgs: { kind: 'list' } });

        // syncStreams returns { kind: 'list', messages: [...] } or { kind: 'deltas', deltas: [...] }
        const streams = (res as any)?.messages || (res as any)?.streams || (res as any)?.deltas || [];

        // Debug: Log first stream to see its structure
        if (streams.length > 0) {
          console.log('[ChatbotSheet] First stream structure:', JSON.stringify(streams[0]).substring(0, 500));
        }

        // On first poll, capture all existing stream IDs so we can identify NEW ones
        if (existingStreamIds === null) {
          existingStreamIds = new Set(streams.map((s: any) => s.streamId));
          console.log('[ChatbotSheet] First poll - existing streams:', existingStreamIds.size);
        }

        // Find streams that are NEW (not in our initial set)
        const newStreams = streams.filter((s: any) => !existingStreamIds!.has(s.streamId));

        // Sort new streams by order to find the newest
        const sortedNewStreams = [...newStreams].sort((a: any, b: any) => (b.order || 0) - (a.order || 0));
        const targetStream = sortedNewStreams[0]; // The newest NEW stream

        // Track if we've found our new stream
        if (targetStream?.streamId && targetStream.streamId !== newStreamId) {
          newStreamId = targetStream.streamId;
          console.log('[ChatbotSheet] NEW stream found:', newStreamId, 'order:', targetStream.order, 'status:', targetStream.status);
        }

        // Extract text ONLY from the target (new) stream, not all streams!
        const extractTextFromStream = (s: any): string => {
          if (typeof s?.text === 'string') return s.text;
          if (typeof s?.content === 'string') return s.content;
          const parts = s?.chunks || s?.messages || s?.parts || [];
          return parts
            .map((c: any) => c?.text ?? c?.delta ?? c?.content ?? c?.message ?? '')
            .join('');
        };

        const text = targetStream ? extractTextFromStream(targetStream) : '';

        // Check for API errors in stream parts (e.g., quota exceeded, rate limit)
        const streamParts = targetStream?.parts || targetStream?.chunks || [];
        const apiError = parseAPIError(streamParts);

        if (apiError) {
          console.log('[ChatbotSheet] API error detected in stream:', apiError.code, apiError.message);
          // Create error message content with special marker for rendering
          const errorContent = JSON.stringify({
            type: 'api_error',
            error: apiError,
          });

          // Update the message with error content
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, content: errorContent, error: true } : m))
          );

          // Stop polling immediately on error
          console.log('[ChatbotSheet] Stopping polling due to API error');
          stopStreamPolling();
          onComplete?.();
          streamingMessageIdRef.current = null;
          return; // Exit poll early
        }

        if (typeof text === 'string' && text.length > 0) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, content: text } : m))
          );
        }

        // Check status of the NEW stream (if we found one)
        const targetStatus = targetStream?.status || targetStream?.state;
        const isTargetStreaming = targetStatus === 'streaming';
        const isTargetFinished = targetStatus === 'finished' || targetStatus === 'aborted';

        // We're done streaming only if:
        // 1. We found a NEW stream AND it's finished/aborted (not still streaming)
        // 2. OR we've been waiting long enough (fallback timeout)
        const foundNewStream = newStreamId !== null;
        const allFinished = foundNewStream && isTargetFinished && !isTargetStreaming;

        // Fallback: If no NEW streams found after 30 seconds, reload chat to get the final message
        const shouldReload = allFinished || (Date.now() - startTime > 30000);
        console.log('[ChatbotSheet] poll result - total:', streams.length, 'new:', newStreams.length, 'target:', newStreamId?.substring(0, 8), 'status:', targetStatus, 'text:', text?.length || 0, 'allFinished:', allFinished, 'shouldReload:', shouldReload);

        if (shouldReload) {
          console.log('[ChatbotSheet] Stopping polling, calling onComplete and loadChat');
          stopStreamPolling();
          onComplete?.();
          // Small delay to let backend sync the message from Agent to aiChatMessages table
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadChat(chatId);
          // Remove streaming placeholder after loading real messages
          streamingMessageIdRef.current = null;
        }
      } catch (error) {
        console.error('[Stream] Error polling stream deltas:', error);
        onComplete?.();
      }
    };

    poll();
    if (streamPollerRef.current) {
      clearInterval(streamPollerRef.current);
    }
    streamPollerRef.current = setInterval(poll, 900);
  }, [adminClient, loadChat, stopStreamPolling]);



  const handleSubmit = useCallback(async (query: string) => {
    if (!query.trim() || isLoading || !adminClient || !convexUrl) {
      return;
    }

    // Check AI availability
    if (!aiAvailable) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'AI Assistant requires an API key. Please configure it in Settings → AI Analysis.',
        timestamp: Date.now(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    setShowSuggestions(false); // Hide suggestions after first interaction

    // Create chat if doesn't exist
    let chatIdToUse = currentChatId;
    if (!chatIdToUse) {
      try {
        // Generate title from first message (truncate to 50 chars)
        const title = query.length > 50 ? query.substring(0, 47) + '...' : query;
        const result = await createChat(adminClient, title);
        chatIdToUse = result.chatId;
        setCurrentChatId(chatIdToUse);

        // Reload chats to get the new one
        const fetchedChats = await listChats(adminClient);
        setChats(fetchedChats);
      } catch (error) {
        console.error('Error creating chat:', error);
      }
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to backend
    if (chatIdToUse) {
      try {
        await saveMessage(adminClient, chatIdToUse, 'user', query);
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    setIsLoading(true);

    try {
      if (chatIdToUse) {
        try {
          stopStreamPolling();

          const placeholderId = `ai-${Date.now()}`;
          streamingMessageIdRef.current = placeholderId;
          setMessages((prev) => [
            ...prev,
            {
              id: placeholderId,
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
              isStreaming: true,
            },
          ]);

          const result = await generateResponseStream(adminClient, {
            chatId: chatIdToUse,
            prompt: query,
            convexUrl,
            accessToken,
            componentId,
            tableName: currentTable || undefined,
          });

          if (!result.success) {
            await addAssistantMessage(
              result.message || 'An error occurred while generating a response.',
              true
            );
            setIsLoading(false);
          } else {
            startStreamPolling(chatIdToUse, () => setIsLoading(false));
          }
        } catch (error: any) {
          console.error('Error generating response:', error);
          await addAssistantMessage(
            error?.message || 'An error occurred while generating a response. Please try again.',
            true
          );
          setIsLoading(false);
        }
      } else {
        await addAssistantMessage(
          'Unable to generate response: chat not found.',
          true
        );
      }

      return;
    } catch (error: any) {
      console.error('Error processing query:', error);
      await addAssistantMessage(
        error?.message || 'An error occurred while processing your query. Please try again.',
        true
      );
      setIsLoading(false);
    }
  }, [isLoading, adminClient, convexUrl, componentId, currentChatId, aiAvailable, accessToken, getChat, addAssistantMessage, startStreamPolling, stopStreamPolling]);

  const handleSuggestionClick = useCallback((suggestion: string | { text: string; icon: any }) => {
    const text = typeof suggestion === 'string' ? suggestion : suggestion.text;
    handleSubmit(text);
  }, [handleSubmit]);

  const handleTableSelect = useCallback(async (tableName: string) => {
    if (!tableSelectorArtifact || !adminClient || !convexUrl) return;

    setIsLoading(true);
    setTableSelectorArtifact(null);

    try {
      const tableSchema = tables[tableName];
      const tableFields = tableSchema?.fields?.map(field => field.fieldName) || [];
      const allTableFields = ['_id', '_creationTime', ...tableFields];

      const result = await navigateToDataViewWithQuery(
        tableSelectorArtifact.query,
        adminClient,
        tables,
        componentId,
        tableName,
        allTableFields
      );

      if (result.success) {
        await addAssistantMessage(result.message, false);

        if (onTabChange) {
          onTabChange('data');
        }
      } else {
        await addAssistantMessage(result.message, true);
      }
    } catch (error: any) {
      console.error('Error processing table selection:', error);
      await addAssistantMessage(
        error?.message || 'An error occurred while processing your selection. Please try again.',
        true
      );
    } finally {
      setIsLoading(false);
    }
  }, [tableSelectorArtifact, adminClient, convexUrl, tables, componentId, onTabChange, addAssistantMessage]);

  const handleRunQuery = useCallback((query: CustomQuery) => {
    setSelectedQuery(query);
    setIsFunctionRunnerOpen(true);
  }, []);

  const handleViewLogs = useCallback(async (filters: any) => {
    try {
      const result = await navigateToLogsWithFilters(filters);
      if (result.success) {
        if (onTabChange) {
          onTabChange('logs');
        }
      }
    } catch (error: any) {
      console.error('Error navigating to logs:', error);
    }
  }, [onTabChange]);

  if (!isOpen) return null;

  const isInContainer = Boolean(container);
  const portalTarget = container || document.body;
  const positionType = isInContainer ? 'absolute' : 'fixed';

  const sheetContent = (
    <>
      {/* Backdrop */}
      {!isInContainer && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 80%, transparent)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Chats Popover - Floating popover to the left of the chatbot sheet */}
      {aiAvailable && sidebarOpen && (
        <>
          {/* Backdrop for popover */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: positionType,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent',
              zIndex: isInContainer ? 1001 : 1001,
              animation: 'fadeIn 0.2s ease-out',
            }}
          />
          {/* Popover content - positioned to the left of the chatbot sheet */}
          <div
            style={{
              position: positionType,
              top: '8px',
              right: `${sheetWidth + 8}px`, // Position to the left of the sheet with 16px gap
              bottom: 'auto',
              width: '320px',
              maxHeight: 'calc(100vh - 32px)',
              backgroundColor: 'var(--color-panel-bg)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              zIndex: isInContainer ? 1002 : 1002,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)',
              animation: 'slideInLeftPopover 0.3s ease-out',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div
              style={{
                padding: '4px 8px',
                borderBottom: '1px solid var(--color-panel-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--color-panel-bg-secondary)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--color-panel-text)' }}>
                Previous Chats
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={handleNewChat}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: 'var(--color-panel-accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="New Chat"
                >
                  New
                </button>
                <IconButton
                  icon={X}
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close chats"
                />
              </div>
            </div>

            {/* Chat List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              {isLoadingChats ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-panel-text-muted)', fontSize: '12px' }}>
                  Loading...
                </div>
              ) : chats.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-panel-text-muted)', fontSize: '12px' }}>
                  No chats yet
                </div>
              ) : (
                chats.map((chat) => {
                  const isActive = chat._id === currentChatId;
                  const isEditing = editingChatId === chat._id;
                  const isDeleting = deletingChatId === chat._id;

                  return (
                    <div
                      key={chat._id}
                      onClick={() => !isEditing && !isDeleting && loadChat(chat._id)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: isActive
                          ? 'var(--color-panel-text)'
                          : 'var(--color-panel-text-secondary)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        const buttonWrapper = e.currentTarget.querySelector(
                          '.chat-actions-wrapper'
                        ) as HTMLElement;
                        const buttonBackdrop = e.currentTarget.querySelector(
                          '.chat-actions-backdrop'
                        ) as HTMLElement;
                        if (buttonWrapper) {
                          buttonWrapper.style.opacity = '1';
                          buttonWrapper.style.transform = 'translateX(0)';
                        }
                        if (buttonBackdrop) {
                          buttonBackdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const buttonWrapper = e.currentTarget.querySelector(
                          '.chat-actions-wrapper'
                        ) as HTMLElement;
                        const buttonBackdrop = e.currentTarget.querySelector(
                          '.chat-actions-backdrop'
                        ) as HTMLElement;
                        if (buttonWrapper) {
                          buttonWrapper.style.opacity = '0';
                          buttonWrapper.style.transform = 'translateX(100%)';
                        }
                        if (buttonBackdrop) {
                          buttonBackdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                        }
                      }}
                    >
                      {isDeleting ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
                            Delete this chat?
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat._id);
                              }}
                              style={{
                                flex: 1,
                                padding: '4px',
                                fontSize: '11px',
                                backgroundColor: 'var(--color-panel-error)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingChatId(null);
                              }}
                              style={{
                                flex: 1,
                                padding: '4px',
                                fontSize: '11px',
                                backgroundColor: 'var(--color-panel-bg-tertiary)',
                                color: 'var(--color-panel-text)',
                                border: '1px solid var(--color-panel-border)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                          <input
                            ref={titleInputRef}
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameChat(chat._id, editingTitle);
                              } else if (e.key === 'Escape') {
                                setEditingChatId(null);
                                setEditingTitle('');
                              }
                            }}
                            onBlur={() => {
                              if (editingTitle.trim()) {
                                handleRenameChat(chat._id, editingTitle);
                              } else {
                                setEditingChatId(null);
                                setEditingTitle('');
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: '100%',
                              padding: '4px',
                              fontSize: '12px',
                              backgroundColor: 'var(--color-panel-bg)',
                              border: '1px solid var(--color-panel-accent)',
                              borderRadius: '4px',
                              color: 'var(--color-panel-text)',
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              flex: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: isActive ? 600 : 400,
                              minWidth: 0,
                              transition: 'flex 0.15s ease',
                            }}
                          >
                            {chat.title}
                          </div>
                          <div
                            className="chat-actions-wrapper"
                            style={{
                              marginLeft: 'auto',
                              flexShrink: 0,
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: 0,
                              transform: 'translateX(100%)',
                              transition: 'opacity 0.15s ease, transform 0.15s ease',
                              pointerEvents: 'none',
                            }}
                          >
                            <div
                              className="chat-actions-backdrop"
                              style={{
                                position: 'absolute',
                                right: '-50px',
                                top: 0,
                                bottom: 0,
                                left: '-20px',
                                background: `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`,
                                pointerEvents: 'none',
                                transition: 'background 0.15s ease',
                                zIndex: 0,
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(chat._id);
                                setEditingTitle(chat.title);
                                setTimeout(() => titleInputRef.current?.focus(), 0);
                              }}
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-panel-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                padding: '4px',
                                lineHeight: 1,
                                position: 'relative',
                                zIndex: 1,
                                pointerEvents: 'auto',
                                borderRadius: '4px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-panel-text)';
                                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingChatId(chat._id);
                              }}
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-panel-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                padding: '4px',
                                lineHeight: 1,
                                position: 'relative',
                                zIndex: 1,
                                pointerEvents: 'auto',
                                borderRadius: '4px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-panel-error)';
                                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: positionType,
          top: 0,
          right: 0,
          bottom: 0,
          width: `${sheetWidth}px`,
          minWidth: '400px',
          maxWidth: isInContainer ? '80vw' : '90vw',
          backgroundColor: 'var(--color-panel-bg)',
          borderLeft: '1px solid var(--color-panel-border)',
          zIndex: isInContainer ? 1000 : 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isInContainer ? undefined : '-4px 0 24px var(--color-panel-shadow)',
          animation: 'slideInRight 0.3s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            cursor: 'col-resize',
            zIndex: 1001,
            backgroundColor: isResizing ? 'var(--color-panel-accent, #6366f1)' : 'transparent',
            transition: isResizing ? 'none' : 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent, #6366f1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        />

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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {aiAvailable && (
              <IconButton
                icon={sidebarOpen ? ChevronLeft : ChevronRight}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              />
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-panel-text)',
            }}>
              <img
                src={theme === 'dark' ? convexAIDark : convexAILight}
                alt="Convex AI"
                style={{
                  width: 24,
                  height: 24,
                  fontSize: 24,
                  display: 'inline-block',
                  verticalAlign: 'middle',
                }}
              />
              <span>AI Assistant</span>
              {currentChatId && (
                <span style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)', marginLeft: '8px' }}>
                  {chats.find(c => c._id === currentChatId)?.title || 'Untitled'}
                </span>
              )}
            </div>
          </div>

          {/* Close Button */}
          <IconButton
            icon={X}
            onClick={onClose}
            aria-label="Close AI assistant"
          />
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minWidth: 0,
          }}
        >
          {/* AI Availability Check Message */}
          {checkingAi ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '40px 20px',
                color: 'var(--color-panel-text-muted)',
              }}
            >
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '14px' }}>Checking AI availability...</div>
            </div>
          ) : !aiAvailable ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <AlertCircle size={48} style={{ color: 'var(--color-panel-error)' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
                AI Assistant requires an API key
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-panel-text-muted)', maxWidth: '400px' }}>
                Please configure your AI provider API key in Settings → AI Analysis to use the AI Assistant.
              </div>
              <button
                onClick={() => {
                  if (onTabChange) {
                    onTabChange('settings');
                  }
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'var(--color-panel-accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Settings size={16} />
                Go to Settings
              </button>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.role === 'user';
                const isError = message.error;

                if (isUser) {
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        alignItems: 'flex-end',
                        paddingLeft: '24px',
                        paddingRight: '0',
                        animation: 'fadeInUp 0.4s ease-out',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: 'var(--color-panel-bg-tertiary)',
                          color: 'var(--color-panel-text)',
                          padding: '10px 14px',
                          borderRadius: '16px',
                          borderBottomRightRadius: '4px',
                          border: '1px solid color-mix(in srgb, var(--color-panel-border) 50%, transparent)',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          maxWidth: '100%',
                          minWidth: 0,
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          flexShrink: 1,
                        }}
                      >
                        <p
                          style={{
                            whiteSpace: 'pre-wrap',
                            fontSize: '12px',
                            lineHeight: '1.6',
                            margin: 0,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {message.content}
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-panel-text-muted)',
                          textAlign: 'right',
                        }}
                      >
                        Sent on {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'flex-start',
                      paddingRight: '24px',
                      animation: 'fadeInUp 0.4s ease-out',
                    }}
                  >
                    {/* Avatar */}
                    {/* <div
                  style={{
                    flexShrink: 0,
                    marginRight: '12px',
                    marginTop: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(to bottom right, var(--color-panel-accent, #6366f1), #9333ea)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px color-mix(in srgb, var(--color-panel-accent, #6366f1) 20%, transparent)',
                    }}
                  >
                    <Brain size={16} style={{ color: '#fff' }} />
                  </div>
                </div> */}

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        maxWidth: '100%',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        ...(isError
                          ? {
                            padding: '16px',
                            borderRadius: '12px',
                            backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--color-panel-error) 20%, transparent)',
                            color: 'color-mix(in srgb, var(--color-panel-error) 80%, white)',
                          }
                          : {}),
                      }}
                    >
                      {/* Check if this is an API error message (JSON with type: 'api_error') */}
                      {(() => {
                        if (isError && message.content.startsWith('{"type":"api_error"')) {
                          try {
                            const errorData = JSON.parse(message.content);
                            if (errorData?.type === 'api_error' && errorData?.error) {
                              return <APIErrorArtifact error={errorData.error} />;
                            }
                          } catch {
                            // Fall through to regular error display
                          }
                        }
                        return null;
                      })()}

                      {/* Regular error header (only shown for non-API-error messages) */}
                      {isError && !message.content.startsWith('{"type":"api_error"') && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                            color: 'var(--color-panel-error)',
                          }}
                        >
                          <AlertCircle size={16} />
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '12px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Error
                          </span>
                        </div>
                      )}
                      {/* Only render markdown content if NOT an API error (API errors use APIErrorArtifact above) */}
                      {!(isError && message.content.startsWith('{"type":"api_error"')) && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: isError ? 'color-mix(in srgb, var(--color-panel-error) 80%, white)' : 'var(--color-panel-text)',
                            lineHeight: '1.75',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            maxWidth: '100%',
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code(props: any) {
                                const { children, className, node, ...rest } = props
                                const match = /language-(\w+)/.exec(className || '')
                                const language = match ? match[1] : ''
                                const code = String(children).replace(/\n$/, '')

                                // Check if this is inline code (no language, typically no newlines, and short)
                                // Inline code doesn't have a className and is usually single-line
                                const isInlineCode = !className && !code.includes('\n');

                                if (isInlineCode) {
                                  // Return a simple styled code element for inline code
                                  // This avoids DOM nesting issues (div/pre inside p)
                                  return (
                                    <code
                                      style={{
                                        backgroundColor: 'var(--color-panel-bg-secondary)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.9em',
                                        fontFamily: 'monospace',
                                        color: 'var(--color-panel-accent, #6366f1)',
                                      }}
                                      {...rest}
                                    >
                                      {children}
                                    </code>
                                  );
                                }

                                if (language === 'json') {
                                  try {
                                    const data = JSON.parse(code);

                                    if (data.type === 'action') {
                                      return <ActionArtifact data={data} />;
                                    }
                                    if (
                                      data.type === 'filter' ||
                                      data.target ||
                                      data.tableName
                                    ) {
                                      return (
                                        <FilterArtifact
                                          data={data}
                                          onApply={applyFilterArtifact}
                                          isApplying={applyingFilterTarget === (data.target || data.tableName)}
                                        />
                                      );
                                    }
                                    if (data.type === 'create_table') {
                                      return <CreateTableArtifact data={data} />;
                                    }
                                    if (data.type === 'chart') {
                                      return <ChartArtifact data={data} />;
                                    }
                                    if (data.type === 'logs') {
                                      return <LogsArtifact data={data} onViewLogs={handleViewLogs} totalCount={data.totalCount} />;
                                    }
                                    if (data.type === 'metrics') {
                                      return <MetricsArtifact data={data} />;
                                    }
                                    if (data.type === 'query') {
                                      return <QueryArtifact data={data} onRunQuery={handleRunQuery} />;
                                    }
                                  } catch (e) {
                                    // Fallback to standard code block
                                  }
                                }

                                return <CodeArtifact language={language} code={code} />;
                              },
                              table: ({ node, ...props }: any) => <div style={{ overflowX: 'auto', margin: '10px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%' }} {...props} /></div>,
                              th: ({ node, ...props }: any) => <th style={{ border: '1px solid var(--color-panel-border)', padding: '8px', backgroundColor: 'var(--color-panel-bg-secondary)', fontWeight: 600, textAlign: 'left' }} {...props} />,
                              td: ({ node, ...props }: any) => <td style={{ border: '1px solid var(--color-panel-border)', padding: '8px' }} {...props} />,
                              p: ({ node, ...props }: any) => <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }} {...props} />,
                              ul: ({ node, ...props }: any) => <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }} {...props} />,
                              ol: ({ node, ...props }: any) => <ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }} {...props} />,
                              li: ({ node, ...props }: any) => <li style={{ marginBottom: '4px' }} {...props} />,
                              a: ({ node, ...props }: any) => <a style={{ color: 'var(--color-panel-accent, #6366f1)', textDecoration: 'none' }} {...props} />,
                              blockquote: ({ node, ...props }: any) => <blockquote style={{ borderLeft: '4px solid var(--color-panel-border)', margin: '0 0 8px 0', paddingLeft: '12px', color: 'var(--color-panel-text-secondary)' }} {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                          {(() => {
                            const meta = messageMeta[message.id];
                            if (!meta) return null;
                            const durationLabel = meta.durationMs ? formatDuration(meta.durationMs) : '';
                            const modelLabel = meta.model || '';
                            if (!modelLabel && !durationLabel) return null;
                            return (
                              <div
                                style={{
                                  marginTop: '8px',
                                  fontSize: '10px',
                                  color: 'var(--color-panel-text-muted)',
                                  display: 'flex',
                                  gap: '6px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                {modelLabel && <span>{modelLabel}</span>}
                                {durationLabel && <span style={{ color: 'var(--color-panel-text-secondary)' }}>→ Ran for {durationLabel}</span>}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                    color: 'var(--color-panel-text-muted)',
                    fontSize: '12px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                >
                  <Brain size={14} style={{ animation: 'bounce 1s infinite' }} />
                  <span>Thinking...</span>
                </div>
              )}

              {/* Table Selector Artifact */}
              {tableSelectorArtifact && Object.keys(tables).length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'var(--color-panel-bg-secondary)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: '12px',
                    maxWidth: '80%',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-panel-text)',
                      marginBottom: '4px',
                    }}
                  >
                    Select a table to filter:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {Object.keys(tables).map((tableName) => (
                      <button
                        key={tableName}
                        type="button"
                        onClick={() => handleTableSelect(tableName)}
                        disabled={isLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          backgroundColor: 'var(--color-panel-bg)',
                          border: '1px solid var(--color-panel-border)',
                          borderRadius: '8px',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                          opacity: isLoading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                            e.currentTarget.style.borderColor = 'var(--color-panel-accent, #6366f1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.backgroundColor = 'var(--color-panel-bg)';
                            e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                          }
                        }}
                      >
                        <Table size={16} style={{ color: 'var(--color-panel-accent, #6366f1)', flexShrink: 0 }} />
                        <span
                          style={{
                            fontSize: '14px',
                            color: 'var(--color-panel-text)',
                            fontWeight: 500,
                          }}
                        >
                          {tableName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area Wrapper */}
        <div
          style={{
            padding: '8px',
            backgroundColor: 'var(--color-panel-bg)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Suggestions Header & Chips */}
          {aiAvailable && showSuggestions && !isLoading && messages.length === 1 && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  // paddingBottom: '4px',
                  maskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                  minWidth: 0,
                }}
              >
                {SUGGESTIONS.slice(0, 3).map((suggestion, index) => {
                  const text = typeof suggestion === 'string' ? suggestion : suggestion.text;
                  const icon = typeof suggestion === 'object' ? suggestion.icon : null;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        border: '1px solid var(--color-panel-border)',
                        backgroundColor: 'var(--color-panel-bg-secondary)',
                        color: 'var(--color-panel-text)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                        e.currentTarget.style.borderColor = 'var(--color-panel-accent, #6366f1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                        e.currentTarget.style.borderColor = 'var(--color-panel-border)';
                      }}
                    >
                      {icon && React.createElement(icon, { size: 12 })}
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Agent Tools */}
          {/* {aiAvailable && (agentTools.length > 0 || loadingTools) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '8px 8px 0 8px',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)', fontWeight: 600 }}>
                Available tools
                {loadingTools && (
                  <span style={{ marginLeft: '6px', fontWeight: 400 }}>Loading...</span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {agentTools.map((tool) => (
                  <div
                    key={tool.name}
                    title={tool.description}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '9999px',
                      border: '1px solid var(--color-panel-border)',
                      backgroundColor: 'var(--color-panel-bg-secondary)',
                      color: 'var(--color-panel-text)',
                      fontSize: '11px',
                      lineHeight: 1.3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={12} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600 }}>{tool.name}</span>
                      <span style={{ color: 'var(--color-panel-text-muted)' }}>
                        {tool.description.length > 72
                          ? `${tool.description.slice(0, 69)}...`
                          : tool.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Styled Input Container - using memoized component to prevent re-renders during typing */}
          <ChatInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isLoadingTables={isLoadingTables}
            aiAvailable={aiAvailable}
            checkingAi={checkingAi}
          />

          {isLoadingTables && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-panel-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              Loading tables...
            </div>
          )}
        </div>
      </div>

      {/* Function Runner Sheet */}
      <Sheet
        isOpen={isFunctionRunnerOpen}
        onClose={() => {
          setIsFunctionRunnerOpen(false);
          setSelectedQuery(null);
        }}
        title="Run Query"
      >
        {selectedQuery && (
          <FunctionRunner
            onClose={() => {
              setIsFunctionRunnerOpen(false);
              setSelectedQuery(null);
            }}
            adminClient={adminClient}
            deploymentUrl={convexUrl}
            selectedFunction={selectedQuery}
            componentId={componentId}
            isVertical={true}
            isExpanded={true}
          />
        )}
      </Sheet>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInLeftPopover {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );

  return createPortal(sheetContent, portalTarget);
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render when these props actually change
  // Returns true if props are EQUAL (don't re-render), false if different (do re-render)
  const isOpenEqual = prevProps.isOpen === nextProps.isOpen;
  const accessTokenEqual = prevProps.accessToken === nextProps.accessToken;
  const convexUrlEqual = prevProps.convexUrl === nextProps.convexUrl;
  const componentIdEqual = prevProps.componentId === nextProps.componentId;
  const currentTableEqual = prevProps.currentTable === nextProps.currentTable;
  const isInDataViewEqual = prevProps.isInDataView === nextProps.isInDataView;
  const containerEqual = prevProps.container === nextProps.container;
  const adminClientEqual = prevProps.adminClient === nextProps.adminClient;
  const availableFieldsEqual = prevProps.availableFields?.length === nextProps.availableFields?.length;

  const areEqual = isOpenEqual && accessTokenEqual && convexUrlEqual &&
    componentIdEqual && currentTableEqual && isInDataViewEqual &&
    containerEqual && adminClientEqual && availableFieldsEqual;

  if (!areEqual) {
    console.log('[ChatbotSheet] Props changed, will re-render:', {
      isOpen: !isOpenEqual,
      accessToken: !accessTokenEqual,
      convexUrl: !convexUrlEqual,
      componentId: !componentIdEqual,
      currentTable: !currentTableEqual,
      isInDataView: !isInDataViewEqual,
      container: !containerEqual,
      adminClient: !adminClientEqual,
      availableFields: !availableFieldsEqual,
    });
  }

  return areEqual;
});
