/**
 * DocumentActions Component
 * Action buttons for documents: Copy, Edit, Clone, Delete
 */

import { useState } from "react";
import { Copy, Edit, CopyPlus, Trash2, Check } from "lucide-react";
import { IconButton } from "@/components/ui/button";

interface DocumentActionsProps {
  documentId: string;
  document: Record<string, any>;
  onEdit?: (documentId: string) => void;
  onClone?: (document: Record<string, any>) => void;
  onDelete?: (documentId: string) => void;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function DocumentActions({
  documentId,
  document,
  onEdit,
  onClone,
  onDelete,
  size = "xs",
  className = "",
}: DocumentActionsProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const iconSize = size === "xs" ? 12 : size === "sm" ? 14 : 16;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(document, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClone = () => {
    if (onClone) {
      const { _id, _creationTime, ...cloneData } = document;
      onClone(cloneData);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.(documentId);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Copy */}
      <IconButton
        onClick={handleCopy}
        variant="ghost"
        size="xs"
        tooltip={copied ? "Copied!" : "Copy document"}
        style={{
          color: copied ? "var(--color-success-base)" : undefined,
        }}
      >
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </IconButton>

      {/* Edit */}
      {onEdit && (
        <IconButton
          onClick={() => onEdit(documentId)}
          variant="ghost"
          size="xs"
          tooltip="Edit document"
        >
          <Edit size={iconSize} />
        </IconButton>
      )}

      {/* Clone */}
      {onClone && (
        <IconButton
          onClick={handleClone}
          variant="ghost"
          size="xs"
          tooltip="Clone document"
        >
          <CopyPlus size={iconSize} />
        </IconButton>
      )}

      {/* Delete */}
      {onDelete && (
        <IconButton
          onClick={handleDelete}
          variant={showDeleteConfirm ? "destructive" : "ghost"}
          size="xs"
          tooltip={
            showDeleteConfirm
              ? "Click again to confirm delete"
              : "Delete document"
          }
        >
          <Trash2 size={iconSize} />
        </IconButton>
      )}
    </div>
  );
}

export default DocumentActions;
