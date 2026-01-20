/**
 * ClearTableConfirmation Component
 * A dialog for confirming and executing table clearing with progress indicator
 */

import { useState, useEffect, useRef } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export interface ClearTableConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableName: string;
  numRows?: number;
  adminClient: any;
  componentId: string | null;
  onError?: (error: string) => void;
}

// System query for clearing table page
const CLEAR_TABLE_PAGE = "_system/frontend/clearTablePage:default";

export function ClearTableConfirmation({
  isOpen,
  onClose,
  onConfirm,
  tableName,
  numRows,
  adminClient,
  componentId,
  onError,
}: ClearTableConfirmationProps) {
  const [initialNumRows, setInitialNumRows] = useState(numRows);
  const [numDeleted, setNumDeleted] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsClearing(false);
      setNumDeleted(0);
      setInitialNumRows(numRows);
    }
  }, [isOpen, numRows]);

  const progressPct = initialNumRows
    ? Math.min(100, Math.floor((numDeleted / initialNumRows) * 100))
    : 0;

  const closeWithConfirmation = () => {
    if (isClearing) {
      const shouldClose = window.confirm(
        "Closing the dialog will cancel the clear table operation with the table partially cleared. Are you sure you want to continue?",
      );
      if (!shouldClose) {
        return;
      }
    }
    onClose();
  };

  const handleConfirm = async () => {
    setInitialNumRows(numRows);
    setIsClearing(true);
    setNumDeleted(0);
    let nextCursor: string | null = null;
    let hasMoreDocuments = true;

    while (isMountedRef.current && hasMoreDocuments) {
      try {
        const result: {
          hasMore?: boolean;
          continueCursor?: string;
          deleted?: number;
        } = await adminClient.mutation(CLEAR_TABLE_PAGE as any, {
          tableName,
          cursor: nextCursor,
          componentId,
        });

        hasMoreDocuments = result?.hasMore ?? false;
        nextCursor = result?.continueCursor ?? null;
        setNumDeleted((prev) => prev + (result?.deleted ?? 0));
      } catch (error: any) {
        hasMoreDocuments = false;
        setIsClearing(false);
        onError?.(
          error?.message ||
            "Failed to clear table. Please try again or contact support.",
        );
        return;
      }
    }

    setIsClearing(false);

    if (isMountedRef.current) {
      onConfirm();
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={closeWithConfirmation}
      onConfirm={handleConfirm}
      title="Clear table"
      message={
        isClearing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>
              {progressPct}% done
            </span>
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "var(--color-border-base)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  backgroundColor: "var(--color-brand-base)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              Delete all documents in{" "}
              <code
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  padding: "2px 4px",
                  borderRadius: "3px",
                  backgroundColor: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border-base)",
                }}
              >
                {tableName}
              </code>
              ?
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Clearing a large table may take a few minutes to complete. Keep
              this dialog open while clearing is in progress. Documents that are
              created during the clear operation may not be deleted.
            </div>
          </div>
        )
      }
      confirmLabel={isClearing ? "Clearing..." : "Confirm"}
      cancelLabel="Cancel"
      variant="danger"
      disableCancel={isClearing}
      isLoading={isClearing}
    />
  );
}

export default ClearTableConfirmation;
