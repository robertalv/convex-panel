import { TableField, TableSchema } from '../../../../types';
import { parseAccessToken } from '../../../../utils/api';

export const DEFAULT_COLUMN_WIDTH = 160;
export const MIN_COLUMN_WIDTH = 96;

export type ColumnMeta = {
  typeLabel: string;
  optional: boolean;
  linkTable?: string;
};

// Helper to check if a value looks like a Convex ID
export const isConvexId = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  // Convex IDs typically start with 'k' followed by alphanumeric characters
  // and are usually 32+ characters long
  return /^k[a-z0-9]{20,}$/.test(value);
};

// Helper to create a dashboard URL for a referenced document
// Format: https://dashboard.convex.dev/t/<team_name>/<project_name>/<cloud_url>/data?table=<table_name>
export const createDocumentLink = (
  deploymentUrl: string | undefined,
  tableName: string,
  documentId: string,
  componentId: string | null,
  teamSlug?: string,
  projectSlug?: string,
  accessToken?: string
): string | null => {
  if (!deploymentUrl || !isConvexId(documentId)) {
    return null;
  }

  // Try to extract team/project slugs from access token if not provided
  let effectiveTeamSlug = teamSlug;
  let effectiveProjectSlug = projectSlug;
  
  if ((!effectiveTeamSlug || !effectiveProjectSlug) && accessToken) {
    const tokenInfo = parseAccessToken(accessToken);
    effectiveTeamSlug = effectiveTeamSlug || tokenInfo.teamSlug;
    effectiveProjectSlug = effectiveProjectSlug || tokenInfo.projectSlug;
  }

  // If we still don't have team/project slugs, we can't create a valid dashboard URL
  if (!effectiveTeamSlug || !effectiveProjectSlug) {
    return null;
  }

  try {
    // Extract deployment name from URL
    const url = new URL(deploymentUrl);
    const hostname = url.hostname;
    
    // Format: https://[deployment-name].convex.cloud
    const deploymentMatch = hostname.match(/^([^.]+)\.convex\.cloud$/);
    if (!deploymentMatch) {
      return null;
    }
    
    const deploymentName = deploymentMatch[1];
    
    // Build dashboard URL
    // Format: https://dashboard.convex.dev/t/<team_name>/<project_name>/<cloud_url>/data?table=<table_name>
    const params = new URLSearchParams({ table: tableName });
    if (componentId) {
      params.set('componentId', componentId);
    }
    const link = `https://dashboard.convex.dev/t/${effectiveTeamSlug}/${effectiveProjectSlug}/${deploymentName}/data?${params.toString()}`;
    return link;
  } catch (err) {
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

