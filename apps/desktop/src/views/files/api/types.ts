/**
 * File Storage API Types
 */

export interface FileMetadata {
  _id: string;
  _creationTime: number;
  storageId: string;
  contentType?: string | null;
  size?: number | null;
  name?: string | null;
  sha256?: string | null;
  url?: string;
  // Upload state (only present for files being uploaded)
  uploadState?: {
    progress: number;
    status: "uploading" | "success" | "error";
    error?: string;
    file?: File; // Original File object for uploading files
  };
}
