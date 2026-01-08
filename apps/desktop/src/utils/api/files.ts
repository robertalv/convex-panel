/**
 * File storage operations
 * Handles fetching, uploading, and deleting files from Convex storage
 */

import type { FileMetadata } from './types';
import { getDeploymentUrl, getAdminKey } from '../adminClient';
import { ROUTES, SYSTEM_MUTATIONS, SYSTEM_QUERIES } from '../constants';

/**
 * Fetch file metadata using system UDF
 * @param adminClient - The Convex admin client instance
 * @param storageId - The storage ID of the file
 * @param useMockData - Whether to use mock data
 * @returns File metadata or null if not found
 */
export async function fetchFileMetadata(
  adminClient: any,
  storageId: string,
  useMockData = false
): Promise<FileMetadata | null> {
  if (useMockData) {
    return null;
  }

  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    const file = await adminClient.query(SYSTEM_QUERIES.GET_FILE, {
      storageId,
    });
    return file || null;
  } catch (err: any) {
    return null;
  }
}

/**
 * Alternative approach using system UDFs that might be available
 * @param deploymentUrl - The deployment URL
 * @param authToken - The authentication token
 * @param componentId - The component ID
 * @param paginationOpts - The pagination options
 * @returns The file metadata
 */
async function fetchFilesAlternative(
  deploymentUrl: string,
  authToken: string,
  componentId: string | null = null,
  paginationOpts: { numItems?: number; cursor?: string } = {}
): Promise<{ page: FileMetadata[]; isDone: boolean; continueCursor?: string }> {
  try {
    // Try using the system table query UDF directly
    const response = await fetch(`${deploymentUrl}${ROUTES.QUERY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Convex ${authToken}`,
        'Convex-Client': 'dashboard-admin',
      },
      body: JSON.stringify({
        path: SYSTEM_QUERIES.LIST_DOCUMENTS,
        args: {
          table: '_storage',
          limit: paginationOpts.numItems || 100,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();

      if (result && (result.value || result.success)) {
        const files = result.value || result;
        const filesArray = Array.isArray(files) ? files : [];

        const filesWithUrls: FileMetadata[] = filesArray.map((file: any) => ({
          _id: file._id,
          _creationTime: file._creationTime,
          storageId: file._id,
          contentType: file.contentType || null,
          size: file.size || null,
          name: file.name || null,
          sha256: file.sha256 || null,
          url: `${deploymentUrl}${ROUTES.STORAGE}/${file._id}`,
        }));

        return {
          page: filesWithUrls,
          isDone: true,
          continueCursor: undefined,
        };
      }
    }

    // Last resort: try to use the dashboard's internal API
    return await fetchFilesLastResort(deploymentUrl, authToken, componentId, paginationOpts);
  } catch (err: any) {
    return await fetchFilesLastResort(deploymentUrl, authToken, componentId, paginationOpts);
  }
}

/**
 * Last resort: try to mimic what the dashboard does
 * @param deploymentUrl - The deployment URL
 * @param authToken - The authentication token
 * @param componentId - The component ID
 * @param paginationOpts - The pagination options
 * @returns The file metadata
 */
async function fetchFilesLastResort(
  deploymentUrl: string,
  authToken: string,
  componentId: string | null = null,
  paginationOpts: { numItems?: number; cursor?: string } = {}
): Promise<{ page: FileMetadata[]; isDone: boolean; continueCursor?: string }> {
  try {
    // This mimics what the Convex dashboard might do
    const response = await fetch(`${deploymentUrl}${ROUTES.QUERY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Convex ${authToken}`,
        'Convex-Client': 'dashboard-0.0.0',
      },
      body: JSON.stringify({
        path: SYSTEM_QUERIES.GET_FILE_METADATA,
        args: {
          componentId: componentId,
          paginationOpts: {
            numItems: paginationOpts.numItems || 100,
            cursor: paginationOpts.cursor || null,
          },
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();

      if (result && result.value) {
        const data = result.value;
        const files = data.page || [];

        const filesWithUrls: FileMetadata[] = files.map((file: any) => ({
          _id: file._id,
          _creationTime: file._creationTime,
          storageId: file._id,
          contentType: file.contentType || null,
          size: file.size || null,
          name: file.name || null,
          sha256: file.sha256 || null,
          url: file.url || `${deploymentUrl}${ROUTES.STORAGE}/${file._id}`,
        }));

        return {
          page: filesWithUrls,
          isDone: data.isDone !== false,
          continueCursor: data.continueCursor,
        };
      }
    }

    return {
      page: [],
      isDone: true,
      continueCursor: undefined,
    };
  } catch (err: any) {
    return {
      page: [],
      isDone: true,
      continueCursor: undefined,
    };
  }
}

/**
 * List files using admin API to query system tables directly
 * @param deploymentUrl - The deployment URL
 * @param authToken - The authentication token
 * @param componentId - Optional component ID
 * @param paginationOpts - Pagination options
 * @returns Array of file metadata with URLs
 */
async function fetchFilesDirectAPI(
  deploymentUrl: string,
  authToken: string,
  componentId: string | null = null,
  paginationOpts: { numItems?: number; cursor?: string } = {}
): Promise<{ page: FileMetadata[]; isDone: boolean; continueCursor?: string }> {
  try {
    // Use the admin API to query the _storage table directly
    const response = await fetch(`${deploymentUrl}${ROUTES.QUERY_BATCH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Convex ${authToken}`,
        'Convex-Client': 'dashboard-admin',
      },
      body: JSON.stringify({
        queries: [{
          udf: {
            identifier: SYSTEM_QUERIES.QUERY,
            args: {
              table: "_storage",
              limit: paginationOpts.numItems || 100,
            }
          }
        }]
      }),
    });

    if (!response.ok) {
      // Try alternative approach
      return await fetchFilesAlternative(deploymentUrl, authToken, componentId, paginationOpts);
    }

    const result = await response.json();

    if (result && result.results && result.results[0]) {
      const queryResult = result.results[0];
      if (queryResult.success && queryResult.value) {
        const files = Array.isArray(queryResult.value) ? queryResult.value : [];

        const filesWithUrls: FileMetadata[] = files.map((file: any) => ({
          _id: file._id,
          _creationTime: file._creationTime,
          storageId: file._id,
          contentType: file.contentType || null,
          size: file.size || null,
          name: file.name || null,
          sha256: file.sha256 || null,
          url: `${deploymentUrl}${ROUTES.STORAGE}/${file._id}`,
        }));

        return {
          page: filesWithUrls,
          isDone: true,
          continueCursor: undefined,
        };
      }
    }

    // If admin API didn't work, try alternative
    return await fetchFilesAlternative(deploymentUrl, authToken, componentId, paginationOpts);
  } catch (err: any) {
    return await fetchFilesAlternative(deploymentUrl, authToken, componentId, paginationOpts);
  }
}

/**
 * List all files with metadata
 * Tries multiple approaches: admin client, system functions, and direct API
 * @param adminClient - The Convex admin client instance
 * @param componentId - Optional component ID to filter files
 * @param useMockData - Whether to use mock data
 * @param paginationOpts - Pagination options
 * @returns Array of file metadata with URLs
 */
export async function fetchFiles(
  adminClient: any,
  componentId: string | null = null,
  useMockData = false,
  paginationOpts: { numItems?: number; cursor?: string } = {}
): Promise<{ page: FileMetadata[]; isDone: boolean; continueCursor?: string }> {
  if (useMockData) {
    return { page: [], isDone: true };
  }

  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;
  const deploymentUrl = getDeploymentUrl(adminClient);
  const adminKey = getAdminKey(adminClient);

  try {
    try {
      const result = await adminClient.query(SYSTEM_QUERIES.GET_FILE_METADATA, {
        componentId: normalizedComponentId,
        paginationOpts: {
          numItems: paginationOpts.numItems || 100,
          cursor: paginationOpts.cursor || null,
        },
      });

      if (result && typeof result === 'object') {
        const page = result.page || (Array.isArray(result) ? result : []);

        const filesWithUrls: FileMetadata[] = page.map((file: any) => ({
          _id: file._id || file.storageId,
          _creationTime: file._creationTime || file.creationTime || Date.now(),
          storageId: file.storageId || file._id,
          contentType: file.contentType || file.content_type || null,
          size: file.size || null,
          name: file.name || null,
          sha256: file.sha256 || null,
          url: file.url || (deploymentUrl ? `${deploymentUrl}${ROUTES.STORAGE}/${file.storageId || file._id}` : undefined),
        }));

        return {
          page: filesWithUrls,
          isDone: result.isDone !== false,
          continueCursor: result.continueCursor,
        };
      }
    } catch (err: any) {
      // Continue to try other approaches
    }
  } catch (err) {
    // Continue to next approach
  }

  if (deploymentUrl && adminKey) {
    try {
      const result = await fetchFilesDirectAPI(deploymentUrl, adminKey, normalizedComponentId, paginationOpts);
      if (result.page.length > 0) {
        return result;
      }
    } catch (err) {
      // Continue
    }
  }

  return { page: [], isDone: true };
}

/**
 * Generate an upload URL for file storage
 * @param adminClient - The admin client instance (optional if deploymentUrl and accessToken are provided)
 * @param componentId - Optional component ID
 * @param deploymentUrl - Optional deployment URL (takes priority over extracting from adminClient)
 * @param accessToken - Optional access token (takes priority over extracting from adminClient)
 * @returns Upload URL with token or null
 */
export async function generateUploadUrl(
  adminClient: any,
  componentId: string | null = null,
  deploymentUrl?: string,
  accessToken?: string
): Promise<{ uploadUrl: string | null; error?: string }> {
  const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;
  
  const finalDeploymentUrl = deploymentUrl || (adminClient ? getDeploymentUrl(adminClient) : null);
  const finalAdminKey = accessToken || (adminClient ? getAdminKey(adminClient) : null);

  if (!finalDeploymentUrl) {
    return { uploadUrl: null, error: 'Missing deployment URL' };
  }

  if (!finalAdminKey) {
    return { uploadUrl: null, error: 'Missing admin key/access token' };
  }
  
  const componentVariations = [
    normalizedComponentId,
    null,
  ].filter((id, index, arr) => arr.indexOf(id) === index);

  if (adminClient && adminClient.mutation) {
    for (const compId of componentVariations) {
      try {
        const result = await adminClient.mutation(SYSTEM_MUTATIONS.GENERATE_UPLOAD_URL, {
          componentId: compId,
        });

        if (typeof result === 'string' && result.includes(ROUTES.STORAGE_UPLOAD)) {
          const uploadUrl = result.startsWith('http') ? result : `${finalDeploymentUrl}${result.startsWith('/') ? result : '/' + result}`;
          return { uploadUrl };
        }
      } catch (err: any) {
        // Continue to next attempt
      }
    }
  }
  
  if (adminClient && adminClient.query) {
    for (const compId of componentVariations) {
      try {
        const result = await adminClient.query(SYSTEM_MUTATIONS.GENERATE_UPLOAD_URL, {
          componentId: compId,
        });

        if (typeof result === 'string' && result.includes(ROUTES.STORAGE_UPLOAD)) {
          const uploadUrl = result.startsWith('http') ? result : `${finalDeploymentUrl}${result.startsWith('/') ? result : '/' + result}`;
          return { uploadUrl };
        }
      } catch (err: any) {
        // Continue to next attempt
      }
    }
  }

  for (const compId of componentVariations) {
    try {
      const response = await fetch(`${finalDeploymentUrl}${ROUTES.MUTATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Convex ${finalAdminKey}`,
          'Convex-Client': 'dashboard-admin',
        },
        body: JSON.stringify({
          path: SYSTEM_MUTATIONS.GENERATE_UPLOAD_URL,
          args: compId !== null ? { componentId: compId } : {},
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // The result might be wrapped in { value: ... } or be a direct string
        let uploadUrl: string | null = null;
        
        if (result.value && typeof result.value === 'string') {
          uploadUrl = result.value;
        } else if (typeof result === 'string') {
          uploadUrl = result;
        }
        
        if (uploadUrl && uploadUrl.includes(ROUTES.STORAGE_UPLOAD)) {
          // Make sure it's an absolute URL
          if (uploadUrl.startsWith('/')) {
            uploadUrl = `${finalDeploymentUrl}${uploadUrl}`;
          } else if (!uploadUrl.startsWith('http')) {
            uploadUrl = `${finalDeploymentUrl}/${uploadUrl}`;
          }
          
          return { uploadUrl };
        }
      }
    } catch (err: any) {
      // Continue to next attempt
    }
  }
  
  for (const compId of componentVariations) {
    try {
      const response = await fetch(`${finalDeploymentUrl}${ROUTES.QUERY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Convex ${finalAdminKey}`,
          'Convex-Client': 'dashboard-admin',
        },
        body: JSON.stringify({
          path: SYSTEM_MUTATIONS.GENERATE_UPLOAD_URL,
          args: compId !== null ? { componentId: compId } : {},
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // The result might be wrapped in { value: ... } or be a direct string
        let uploadUrl: string | null = null;
        
        if (result.value && typeof result.value === 'string') {
          uploadUrl = result.value;
        } else if (typeof result === 'string') {
          uploadUrl = result;
        }
        
        if (uploadUrl && uploadUrl.includes(ROUTES.QUERY)) {
          // Make sure it's an absolute URL
          if (uploadUrl.startsWith('/')) {
            uploadUrl = `${finalDeploymentUrl}${uploadUrl}`;
          } else if (!uploadUrl.startsWith('http')) {
            uploadUrl = `${finalDeploymentUrl}/${uploadUrl}`;
          }
          
          return { uploadUrl };
        }
      }
    } catch (err: any) {
      // Continue to next attempt
    }
  }

  return { uploadUrl: null, error: 'Unable to generate upload URL. File storage may not be available for this deployment.' };
}

/**
 * Diagnose file storage availability
 * @param adminClient - The admin client instance
 * @param deploymentUrl - Optional deployment URL
 * @param accessToken - Optional access token
 * @returns Diagnostic information
 */
export async function diagnoseFileStorageAvailability(
  adminClient: any,
  deploymentUrl?: string,
  accessToken?: string
): Promise<{ available: boolean; details: string[] }> {
  const finalDeploymentUrl = deploymentUrl || (adminClient ? getDeploymentUrl(adminClient) : null);
  const finalAdminKey = accessToken || (adminClient ? getAdminKey(adminClient) : null);
  
  const details: string[] = [];
  
  if (!finalDeploymentUrl) {
    details.push('No deployment URL available');
    return { available: false, details };
  }
  
  if (!finalAdminKey) {
    details.push('No admin key available');
    return { available: false, details };
  }
  
  details.push(`Deployment URL: ${finalDeploymentUrl}`);
  details.push(`Admin key: ${finalAdminKey.substring(0, 10)}...`);
  
  try {
    const response = await fetch(`${finalDeploymentUrl}${ROUTES.QUERY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Convex ${finalAdminKey}`,
      },
      body: JSON.stringify({
        path: SYSTEM_MUTATIONS.GENERATE_UPLOAD_URL,
        args: { componentId: null },
      }),
    });
    
    details.push(`API Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      details.push(`File storage is available`);
      details.push(`Response: ${JSON.stringify(result, null, 2)}`);
      return { available: true, details };
    } else {
      const errorText = await response.text();
      details.push(`File storage not available: ${errorText}`);
      return { available: false, details };
    }
  } catch (error: any) {
    details.push(`Network error: ${error?.message || 'Unknown error'}`);
    return { available: false, details };
  }
}

/**
 * Upload file with multiple fallback methods
 * @param file - The file to upload
 * @param adminClient - The admin client instance
 * @param componentId - Optional component ID
 * @param deploymentUrl - Optional deployment URL
 * @param accessToken - Optional access token
 * @param onProgress - Optional progress callback
 * @returns Upload result with method used
 */
export async function uploadFileWithFallbacks(
  file: File,
  adminClient: any,
  componentId: string | null = null,
  deploymentUrl?: string,
  accessToken?: string,
  onProgress?: (progress: number) => void
): Promise<{ storageId: string | null; error?: string; method?: string }> {

  const { uploadUrl, error: urlError } = await generateUploadUrl(
    adminClient, 
    componentId, 
    deploymentUrl, 
    accessToken
  );
  
  if (uploadUrl) {
    try {
      const storageId = await uploadFile(file, uploadUrl, onProgress);
      if (storageId) {
        return { storageId, method: 'upload-url' };
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
    }
  }
  
  return { 
    storageId: null, 
    error: `Upload failed: ${urlError || 'Unable to generate upload URL'}`,
    method: 'none'
  };
}

/**
 * Upload a file to Convex storage
 * @param file - The file to upload
 * @param uploadUrl - The upload URL with token
 * @param onProgress - Optional progress callback (0-100)
 * @returns Storage ID or null
 */
export async function uploadFile(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const responseText = xhr.responseText.trim();
          
          if (!responseText) {
            const location = xhr.getResponseHeader('Location');
            if (location) {
              const match = location.match(/\/([^\/]+)$/);
              if (match) {
                resolve(match[1]);
                return;
              }
            }
            resolve(null);
            return;
          }
          
          const response = JSON.parse(responseText);
          
          let storageId: string | null = null;
          
          if (typeof response === 'string') {
            storageId = response;
          } else if (response.storageId) {
            storageId = response.storageId;
          } else if (response.id) {
            storageId = response.id;
          } else if (response._id) {
            storageId = response._id;
          } else if (response.value) {
            storageId = typeof response.value === 'string' 
              ? response.value 
              : response.value.storageId || response.value.id || response.value._id || null;
          }
          
          resolve(storageId);
        } catch (err) {
          const location = xhr.getResponseHeader('Location');
          if (location) {
            const match = location.match(/\/([^\/]+)$/);
            if (match) {
              resolve(match[1]);
              return;
            }
          }
          resolve(null);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('POST', uploadUrl);

    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }
    
    xhr.send(file);
  });
}

/**
 * Delete files from storage using adminClient mutation
 * @param adminClient - The Convex admin client instance
 * @param storageIds - Array of storage IDs to delete (or single string)
 * @param componentId - Optional component ID
 * @returns Success status
 */
export async function deleteFile(
  adminClient: any,
  storageIds: string | string[],
  componentId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!adminClient) {
    return {
      success: false,
      error: 'Admin client not available',
    };
  }

  try {
    // Normalize to array
    const idsArray = Array.isArray(storageIds) ? storageIds : [storageIds];
    const normalizedComponentId = componentId === 'app' || componentId === null ? null : componentId;

    // Use adminClient.mutation to call the system function
    // componentId is passed as part of the args object
    await adminClient.mutation(
      SYSTEM_MUTATIONS.DELETE_FILES,
      {
        storageIds: idsArray,
        componentId: normalizedComponentId,
      }
    );

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to delete file',
    };
  }
}