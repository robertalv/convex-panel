import { TableField, TableSchema } from '../../../types';

export const DEFAULT_COLUMN_WIDTH = 160;
export const MIN_COLUMN_WIDTH = 96;

export type ColumnMeta = {
  typeLabel: string;
  optional: boolean;
  linkTable?: string;
};

export const isConvexId = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  return /^k[a-z0-9]{20,}$/.test(value);
};

export const createDocumentLink = (
  deploymentUrl: string | undefined,
  tableName: string,
  documentId: string,
  componentId: string | null
): string | null => {
  if (!deploymentUrl || !isConvexId(documentId)) {
    return null;
  }

  try {
    const url = new URL(deploymentUrl);
    const hostname = url.hostname;
    
    // Format: https://[deployment-name].convex.cloud
    const deploymentMatch = hostname.match(/^([^.]+)\.convex\.cloud$/);
    if (!deploymentMatch) return null;
    
    const deploymentName = deploymentMatch[1];
    
    // Build dashboard URL
    // Format: https://dashboard.convex.dev/[deployment]/data/[table]?id=[id]
    // If componentId is provided, include it in the query
    const params = new URLSearchParams({ id: documentId });
    if (componentId) {
      params.set('componentId', componentId);
    }
    
    return `https://dashboard.convex.dev/${deploymentName}/data/${tableName}?${params.toString()}`;
  } catch (err) {
    console.error('Failed to create document link:', err);
    return null;
  }
};

export const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'unset';
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    if (value.length > 30) {
      return value;
    }
    return value;
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === 'object') {
    try {
    return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return String(value);
};

export const getValueColor = (value: any): string => {
  if (typeof value === 'string' && value.length > 20) {
    return 'var(--color-panel-text)';
  }
  if (typeof value === 'boolean') {
    return 'var(--color-panel-warning)';
  }
  if (typeof value === 'number') {
    return 'var(--color-panel-warning)';
  }
  return 'var(--color-panel-text)';
};

const deriveTypeLabel = (field?: TableField): string => {
  if (!field) {
    return 'string';
  }
  if (field.shape.type === 'object' && field.shape.fields?.length) {
    return 'object';
  }
  if (field.shape.type === 'Id') {
    return field.shape.tableName ? `id<${field.shape.tableName}>` : 'id';
  }
  if (field.shape.shape && field.shape.shape.tableName) {
    return `id<${field.shape.shape.tableName}>`;
  }
  return field.shape.type ?? 'string';
};

export const buildColumnMeta = (tableSchema?: TableSchema): Record<string, ColumnMeta> => {
  const meta: Record<string, ColumnMeta> = {
    _id: { typeLabel: 'id', optional: false },
    _creationTime: { typeLabel: 'timestamp', optional: false },
  };

  tableSchema?.fields?.forEach((field) => {
    meta[field.fieldName] = {
      typeLabel: deriveTypeLabel(field),
      optional: field.optional ?? false,
      linkTable:
        field.shape.tableName ??
        field.shape.shape?.tableName ??
        field.shape.fields?.find((f) => f.shape.tableName)?.shape.tableName,
    };
  });

  return meta;
};

