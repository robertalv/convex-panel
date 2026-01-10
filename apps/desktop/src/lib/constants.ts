/**
 * API Routes and Constants for Convex
 */

export const ROUTES = {
  QUERY: "/api/query",
  MUTATION: "/api/mutation",
  QUERY_BATCH: "/api/admin/query_batch",
  STORAGE: "/api/storage",
  STORAGE_UPLOAD: "/api/storage/upload",
} as const;

export const SYSTEM_QUERIES = {
  GET_FILE: "_system/frontend/fileStorageV2:getFile",
  GET_FILE_METADATA: "_system/frontend/fileStorageV2:fileMetadata",
  LIST_DOCUMENTS: "system:listDocuments",
  QUERY: "system:query",
} as const;

export const SYSTEM_MUTATIONS = {
  GENERATE_UPLOAD_URL: "_system/frontend/fileStorageV2:generateUploadUrl",
  DELETE_FILES: "_system/frontend/fileStorageV2:deleteFiles",
} as const;
