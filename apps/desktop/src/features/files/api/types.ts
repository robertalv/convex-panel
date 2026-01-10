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
}
