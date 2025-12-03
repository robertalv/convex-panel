/**
 * Backup and restore operations
 * Handles creating, listing, managing, and restoring backups
 */

import { ROUTES, SYSTEM_MUTATIONS, SYSTEM_QUERIES } from '../constants';
import type {
  CloudBackupResponse,
  PeriodicBackupConfig,
} from './types';
import { CONVEX_API_DOMAIN, CONVEX_PROVISION_DOMAIN } from '../constants';

/**
 * Create a backup for a deployment
 * @param deploymentId - The deployment ID
 * @param accessToken - The access token
 * @param includeStorage - Whether to include storage in the backup
 * @returns The backup
 */
export async function createBackup(
  deploymentId: number,
  accessToken: string,
  includeStorage: boolean = false,
): Promise<CloudBackupResponse> {
  const baseUrl = `https://${CONVEX_PROVISION_DOMAIN}/`;
  const path = ROUTES.REQUEST_CLOUD_BACKUP.replace('{deploymentId}', deploymentId.toString());
  const endpoint = `${baseUrl}${path}`;
  
  const authHeader = `Bearer ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeStorage,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Unknown error';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorText || 'Unknown error';
    } catch {
      errorMessage = errorText || 'Unknown error';
    }
    throw new Error(`Failed to create backup: ${response.status}, message: ${errorMessage}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    sourceDeploymentId: result.sourceDeploymentId || deploymentId,
    sourceDeploymentName: result.sourceDeploymentName,
    state: result.state,
    requestedTime: result.requestedTime || result.createdTime || Date.now(),
    includeStorage: result.includeStorage || includeStorage,
    snapshotId: result.snapshotId,
    expirationTime: result.expirationTime,
  };
}

/**
 * List existing backups for a team
 * Uses the dashboard API endpoint which requires Bearer token authentication
 * @param teamId - The team ID
 * @param accessToken - The access token
 * @returns The backups
 */
export async function listBackups(
  teamId: number,
  accessToken: string,
): Promise<CloudBackupResponse[]> {
  const baseUrl = `https://${CONVEX_PROVISION_DOMAIN}`;
  const path = ROUTES.LIST_CLOUD_BACKUPS.replace('{teamId}', teamId.toString());
  const endpoint = `${baseUrl}${path}`;
  
  const authHeader = `Bearer ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Unknown error';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorText || 'Unknown error';
    } catch {
      // If not JSON, use errorText as-is
    }
    throw new Error(`Failed to list backups: ${response.status}, message: ${errorMessage}`);
  }

  const result = await response.json();
  
  const backups = Array.isArray(result) ? result : [];
  
  return backups.map((backup: any) => ({
    id: backup.id,
    sourceDeploymentId: backup.sourceDeploymentId,
    sourceDeploymentName: backup.sourceDeploymentName,
    state: backup.state,
    requestedTime: backup.requestedTime || backup.createdTime,
    includeStorage: backup.includeStorage,
    snapshotId: backup.snapshotId,
    expirationTime: backup.expirationTime,
  }));
}

/**
 * Get a specific backup by ID
 * @param backupId - The backup ID
 * @param accessToken - The access token
 * @returns The backup
 */
export async function getBackup(
  backupId: number,
  accessToken: string,
): Promise<CloudBackupResponse> {
  const baseUrl = `https://${CONVEX_PROVISION_DOMAIN}/`;
  const path = ROUTES.GET_CLOUD_BACKUP.replace('{backupId}', backupId.toString());
  const endpoint = `${baseUrl}${path}`;

  const authHeader = `Bearer ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Unknown error';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorText || 'Unknown error';
    } catch {
      // If not JSON, use errorText as-is
      errorMessage = errorText || 'Unknown error';
    }
    throw new Error(`Failed to get backup: ${response.status}, message: ${errorMessage}`);
  }

  const result = await response.json();
  
  return {
    id: result.id,
    sourceDeploymentId: result.sourceDeploymentId,
    sourceDeploymentName: result.sourceDeploymentName,
    state: result.state,
    requestedTime: result.requestedTime || result.createdTime,
    includeStorage: result.includeStorage,
    snapshotId: result.snapshotId,
    expirationTime: result.expirationTime,
  };
}

/**
 * Delete a specific backup by ID
 * Requires team access token (same as other backup operations)
 * @param backupId - The backup ID
 * @param accessToken - The access token
 * @returns The backup
 */
export async function deleteBackup(
  backupId: number,
  accessToken: string
): Promise<void> {
  const baseUrl = `https://${CONVEX_PROVISION_DOMAIN}/`;
  const path = ROUTES.DELETE_CLOUD_BACKUP.replace('{backupId}', backupId.toString());
  const endpoint = `${baseUrl}${path}`;
  
  const authHeader = `Bearer ${accessToken}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Unknown error';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorText || 'Unknown error';
    } catch {
      errorMessage = errorText || 'Unknown error';
    }
    throw new Error(`Failed to delete backup: ${response.status}, message: ${errorMessage}`);
  }
  // Success - no response body expected
}

/**
 * Cancel a backup that's in progress or requested
 * Only works for backups in "inProgress" or "requested" state
 * @param backupId - The backup ID
 * @param accessToken - The access token
 * @returns The backup
 */
// export async function cancelBackup(
//   backupId: number,
//   accessToken: string
// ): Promise<void> {
//   const baseUrl = `https://${CONVEX_PROVISION_DOMAIN}/`;
//   const path = ROUTES.CANCEL_CLOUD_BACKUP.replace('{backupId}', backupId.toString());
//   const endpoint = `${baseUrl}${path}`;
  
//   const authHeader = `Bearer ${accessToken}`;
//   const response = await fetch(endpoint, {
//     method: 'POST',
//     headers: {
//       'Authorization': authHeader,
//       'Content-Type': 'application/json',
//     },
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     let errorMessage = errorText || 'Unknown error';
//     try {
//       const error = JSON.parse(errorText);
//       errorMessage = error.message || errorText || 'Unknown error';
//     } catch {
//       errorMessage = errorText || 'Unknown error';
//     }
//     throw new Error(`Failed to cancel backup: ${response.status}, message: ${errorMessage}`);
//   }
// }

/**
 * Restore a backup to a deployment
 * @param deploymentId - The deployment ID
 * @param backupId - The backup ID
 * @param accessToken - The access token
 * @returns The import ID
 */
export async function restoreBackup(
  deploymentId: number,
  backupId: number,
  accessToken: string,
): Promise<{ importId: string }> {
  // Use api.convex.dev (not provision.convex.dev) to match dashboard
  const path = ROUTES.RESTORE_FROM_CLOUD_BACKUP.replace('{deploymentId}', deploymentId.toString());
  const endpoint = `https://${CONVEX_API_DOMAIN}/${path}`;
  
  const authHeader = `Bearer ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-0.0.0',
    },
    body: JSON.stringify({
      id: backupId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Unknown error';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorText || 'Unknown error';
    } catch {
      errorMessage = errorText || 'Unknown error';
    }
    throw new Error(`Failed to restore backup: ${response.status}, message: ${errorMessage}`);
  }

  const result = await response.json();
  return { importId: result.importId };
}

/**
 * List snapshot imports from a deployment
 * @param adminClient - The admin client
 * @returns The snapshot imports
 */
export async function listSnapshotImports(
  adminClient: any,
): Promise<any[]> {
  const result = await adminClient.query(SYSTEM_QUERIES.LIST_SNAPSHOT_IMPORTS, {});
  return Array.isArray(result) ? result : [];
}

/**
 * Get the latest cloud restore from snapshot imports
 * Returns the most recent restore by creation time
 * @param adminClient - The admin client
 * @returns The latest restore
 */
export async function getLatestRestore(
  adminClient: any,
): Promise<any | null> {
  const imports = await listSnapshotImports(adminClient);
  const cloudRestores = imports.filter((imp: any) => imp.requestor?.type === 'cloudRestore');
  
  if (cloudRestores.length === 0) {
    return null;
  }
  
  cloudRestores.sort((a: any, b: any) => {
    const timeA = a._creationTime || 0;
    const timeB = b._creationTime || 0;
    return timeB - timeA;
  });
  
  return cloudRestores[0] || null;
}

/**
 * Confirm/perform a snapshot import
 * @param adminClient - The admin client
 * @param deploymentUrl - The deployment URL
 * @param importId - The import ID
 * @param accessToken - The access token
 * @returns The import ID
 * 
 * TODO: Need to fix this
 */
export async function confirmSnapshotImport(
  adminClient: any,
  deploymentUrl: string,
  importId: string,
  accessToken: string
): Promise<void> {
  if (adminClient && typeof adminClient.mutation === 'function') {
    try {
      await adminClient.mutation(SYSTEM_MUTATIONS.CONFIRM_IMPORT, { importId });
      return;
    } catch (err: any) {
      console.warn('adminClient mutation failed, falling back to HTTP:', err);
    }
  }

  const response = await fetch(`${deploymentUrl}${ROUTES.PERFORM_IMPORT_API}`, {
    method: 'POST',
    headers: {
      'Authorization': `Convex ${accessToken}`,
      'Content-Type': 'application/json',
      'Convex-Client': 'dashboard-0.0.0',
    },
    body: JSON.stringify({
      importId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Unknown error';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || errorText || 'Unknown error';
    } catch {
      // If not JSON, use errorText as-is
    }
    throw new Error(`Failed to perform import: ${response.status}, message: ${errorMessage}`);
  }
}

/**
 * Get download URL for a backup
 * @param snapshotId - The snapshot ID
 * @param accessToken - The access token
 * @param includeStorage - Whether to include storage in the backup
 * @returns The download URL
 */
export function getBackupDownloadUrl(
  snapshotId: string,
  accessToken: string,
  includeStorage: boolean = true
): string {
  const params = new URLSearchParams({ 
    adminKey: accessToken,
    include_storage: includeStorage ? 'true' : 'false'
  });

  const path = ROUTES.GET_BACKUP_DOWNLOAD_URL.replace('{snapshotId}', snapshotId).replace('{params}', params.toString());
  const endpoint = `https://${CONVEX_API_DOMAIN}/${path}`;
  
  return endpoint;
}

/**
 * Download a backup
 * @param backup - The backup
 * @param accessToken - The access token
 * @returns The download URL
 */
export function downloadBackup(
  backup: CloudBackupResponse,
  accessToken: string
): string {
  if (backup.state !== 'complete') {
    throw new Error('Backup is not ready for download. Current state: ' + backup.state);
  }
  
  if (!backup.snapshotId) {
    throw new Error('Backup does not have a snapshot ID');
  }
  
  return getBackupDownloadUrl(
    backup.snapshotId,
    accessToken,
    backup.includeStorage
  );
}

/**
 * Configure periodic/automatic backups for a deployment
 * @param deploymentId - The deployment ID
 * @param accessToken - The access token
 * @param cronspec - The cron spec
 * @param includeStorage - Whether to include storage in the backup
 * @param expirationDeltaSecs - The expiration delta in seconds
 * @param useBearerToken - Whether to use bearer token
 * @returns The void
 */
export async function configurePeriodicBackup(
  deploymentId: number,
  accessToken: string,
  cronspec: string,
  includeStorage: boolean = false,
  expirationDeltaSecs?: number,
  useBearerToken: boolean = false
): Promise<void> {
  const path = ROUTES.CONFIGURE_PERIODIC_BACKUP.replace('{deploymentId}', deploymentId.toString());
  const endpoint = `https://${CONVEX_API_DOMAIN}${path}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cronspec,
      includeStorage,
      ...(expirationDeltaSecs && { expirationDeltaSecs }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to configure periodic backup: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get periodic backup configuration using the management API
 * This is how the dashboard actually does it
 * @param deploymentId - The deployment ID
 * @param accessToken - The access token
 * @returns The periodic backup config
 */
export async function getPeriodicBackupConfig(
  deploymentId: number,
  accessToken: string
): Promise<PeriodicBackupConfig | null> {
  try {
    const path = ROUTES.GET_PERIODIC_BACKUP_CONFIG.replace('{deploymentId}', deploymentId.toString());
    const endpoint = `https://${CONVEX_API_DOMAIN}${path}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      throw new Error(`Failed to get periodic backup config: ${response.status} - ${errorText}`);
    }

    const config = await response.json();
    return config;
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
}

/**
 * Disable periodic backup for a deployment
 * @param deploymentId - The deployment ID
 * @param accessToken - The access token
 * @param useBearerToken - Whether to use bearer token
 * @returns The void
 */
export async function disablePeriodicBackup(
  deploymentId: number,
  accessToken: string,
  useBearerToken: boolean = false
): Promise<void> {
  const path = ROUTES.DISABLE_PERIODIC_BACKUP.replace('{deploymentId}', deploymentId.toString());
  const endpoint = `https://${CONVEX_API_DOMAIN}${path}`;
  const authHeader = useBearerToken
    ? `Bearer ${accessToken}`
    : `Convex ${accessToken}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to disable periodic backup: ${response.status}, message: ${error.message || 'Unknown error'}`);
  }
}

