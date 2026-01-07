/**
 * ListView Component
 * Full-screen card-style list view for documents with inline editing
 */

import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { TableDocument, TableSchema } from "../../types";
import { DocumentCard } from "../DocumentCard";
import { ListViewSkeleton } from "../skeletons";

interface ListViewProps {
  documents: TableDocument[];
  schema?: TableSchema;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  observerTarget: (node: HTMLDivElement | null) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit?: (documentId: string) => void;
  onClone?: (document: Record<string, any>) => void;
  onDelete?: (documentId: string) => void;
  onPatchDocument?: (
    documentId: string,
    fields: Record<string, any>,
  ) => Promise<void>;
}

export function ListView({
  documents,
  schema,
  isLoading,
  isLoadingMore,
  hasMore,
  observerTarget,
  selectedIds,
  onSelectionChange,
  onEdit,
  onClone,
  onDelete,
  onPatchDocument,
}: ListViewProps) {
  // Handle document selection
  const handleSelectDocument = useCallback(
    (docId: string) => {
      if (selectedIds.includes(docId)) {
        onSelectionChange(selectedIds.filter((id) => id !== docId));
      } else {
        onSelectionChange([...selectedIds, docId]);
      }
    },
    [selectedIds, onSelectionChange],
  );

  if (isLoading && documents.length === 0) {
    return <ListViewSkeleton />;
  }

  if (documents.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ color: "var(--color-text-muted)" }}
      >
        <p className="text-sm">No documents found</p>
        <p className="text-xs mt-1">Add a document or adjust your filters</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-3 w-full">
        {documents.map((doc) => (
          <DocumentCard
            key={doc._id}
            document={doc}
            schema={schema}
            onEdit={onEdit}
            onClone={onClone}
            onDelete={onDelete}
            onPatchDocument={onPatchDocument}
            isSelected={selectedIds.includes(doc._id)}
            onSelect={handleSelectDocument}
          />
        ))}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={observerTarget}
            className="flex items-center justify-center py-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {isLoadingMore && (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-xs">Loading more...</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListView;
