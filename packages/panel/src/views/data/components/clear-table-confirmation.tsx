import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../../../components/shared/confirm-dialog';
import { clearTablePage } from '../../../utils/api/documents';

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

export const ClearTableConfirmation: React.FC<ClearTableConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tableName,
  numRows,
  adminClient,
  componentId,
  onError,
}) => {
  const [initialNumRows, setInitialNumRows] = useState(numRows);
  const [numDeleted, setNumDeleted] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
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
        "Closing the popup will cancel the clear table operation with the table partially cleared. Are you sure you want to continue?"
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

    while (isMounted && hasMoreDocuments) {
      try {
        const result = await clearTablePage(
          adminClient,
          tableName,
          nextCursor,
          componentId
        );

        hasMoreDocuments = result.hasMore;
        nextCursor = result.continueCursor;
        setNumDeleted((prev) => prev + result.deleted);
      } catch (error: any) {
        hasMoreDocuments = false;
        setIsClearing(false);
        onError?.(error?.message || 'Failed to clear table. Please try again or contact support.');
        return;
      }
    }

    setIsClearing(false);
    
    if (isMounted) {
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>
              {progressPct}% done
            </span>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--color-panel-border)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-panel-accent)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>Delete all documents in this table?</div>
            <div style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
              Clearing a large table may take a few minutes to complete. Keep
              this dialogue open while clearing is in progress. Documents that
              are created during the clear operation may not be deleted.
            </div>
          </div>
        )
      }
      confirmLabel="Confirm"
      cancelLabel="Cancel"
      variant="danger"
      disableCancel={isClearing}
    />
  );
};








