import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, ArrowRight, Search, Copy } from "lucide-react";
import type { TableDocument } from "../../../types";
import {
  formatValue,
  formatTimestamp,
  buildColumnMeta,
} from "./table/data-table-utils";
import { patchDocumentFields } from "../../../utils/api/documents";
import { toast } from "../../../utils/toast";
import { Sheet, SheetLayout, IconButton } from "../../../components/shared";

export interface EditDocumentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocumentIds: string[];
  documents: TableDocument[];
  selectedTable: string;
  tables: any;
  adminClient?: any;
  componentId?: string | null;
  onDocumentUpdate?: () => void;
  container?: HTMLElement | null;
  /**
   * Render mode for the sheet:
   * - 'portal': Uses createPortal to render the sheet (default, used for overlays)
   * - 'inline': Renders directly without portal (used for push-aside layouts in desktop)
   */
  renderMode?: "portal" | "inline";
}

export const EditDocumentSheet: React.FC<EditDocumentSheetProps> = ({
  isOpen,
  onClose,
  selectedDocumentIds,
  documents,
  selectedTable,
  tables,
  adminClient,
  componentId,
  onDocumentUpdate,
  container,
  renderMode = "portal",
}) => {
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [currentDocument, setCurrentDocument] = useState<TableDocument | null>(
    null,
  );
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [editingField, setEditingField] = useState<{
    fieldName: string;
    value: any;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cachedDocuments, setCachedDocuments] = useState<
    Map<string, TableDocument>
  >(new Map());

  // Get table schema for column metadata
  const tableSchema = tables?.[selectedTable];
  const columnMeta = useMemo(() => buildColumnMeta(tableSchema), [tableSchema]);

  // Get all fields from current document
  const allFields = useMemo(() => {
    if (!currentDocument) return [];
    return Object.keys(currentDocument).sort((a, b) => {
      // System fields first
      if (a === "_id") return -1;
      if (b === "_id") return -1;
      if (a === "_creationTime") return 1;
      if (b === "_creationTime") return 1;
      return a.localeCompare(b);
    });
  }, [currentDocument]);

  // Filter fields based on search query
  const filteredFields = useMemo(() => {
    if (!searchQuery) return allFields;
    const query = searchQuery.toLowerCase();
    return allFields.filter((field) => field.toLowerCase().includes(query));
  }, [allFields, searchQuery]);

  // Fetch document when index changes
  const fetchDocument = useCallback(
    async (documentId: string) => {
      // Check cache first
      if (cachedDocuments.has(documentId)) {
        setCurrentDocument(cachedDocuments.get(documentId) || null);
        return;
      }

      // Check if document is in documents prop
      const existingDoc = documents.find((doc) => doc._id === documentId);
      if (existingDoc) {
        setCurrentDocument(existingDoc);
        setCachedDocuments((prev) =>
          new Map(prev).set(documentId, existingDoc),
        );
        return;
      }

      // Fetch from server
      if (!adminClient || !selectedTable) return;

      setIsLoadingDocument(true);
      try {
        const normalizedComponentId =
          componentId === "app" || componentId === null ? null : componentId;

        const filterString = btoa(
          JSON.stringify({
            clauses: [
              {
                op: "eq",
                field: "_id",
                value: documentId,
                enabled: true,
                id: `_id_${Date.now()}`,
              },
            ],
          }),
        );

        const result = await adminClient.query(
          "_system/frontend/paginatedTableDocuments:default" as any,
          {
            table: selectedTable,
            componentId: normalizedComponentId,
            filters: filterString,
            paginationOpts: {
              numItems: 1,
              cursor: null,
              id: Date.now(),
            },
          },
        );

        const fetchedDoc = result?.page?.[0] || null;
        if (fetchedDoc) {
          setCurrentDocument(fetchedDoc);
          setCachedDocuments((prev) =>
            new Map(prev).set(documentId, fetchedDoc),
          );
        }
      } catch (error: any) {
        console.error("Error fetching document:", error);
        toast("error", "Failed to load document");
      } finally {
        setIsLoadingDocument(false);
      }
    },
    [adminClient, selectedTable, componentId, documents, cachedDocuments],
  );

  // Update document when index changes
  useEffect(() => {
    if (!isOpen || selectedDocumentIds.length === 0) return;

    const index = Math.min(
      currentDocumentIndex,
      selectedDocumentIds.length - 1,
    );
    const documentId = selectedDocumentIds[index];
    if (documentId) {
      fetchDocument(documentId);
    }
  }, [currentDocumentIndex, selectedDocumentIds, isOpen, fetchDocument]);

  // Reset to first document when sheet opens
  useEffect(() => {
    if (isOpen && selectedDocumentIds.length > 0) {
      setCurrentDocumentIndex(0);
      setEditingField(null);
      setEditingValue("");
      setEditError(null);
      setSearchQuery("");
    }
  }, [isOpen, selectedDocumentIds]);

  // Navigate to previous document
  const handlePrevious = useCallback(() => {
    if (currentDocumentIndex > 0) {
      setCurrentDocumentIndex((prev) => prev - 1);
      setEditingField(null);
      setEditingValue("");
      setEditError(null);
    }
  }, [currentDocumentIndex]);

  // Navigate to next document
  const handleNext = useCallback(() => {
    if (currentDocumentIndex < selectedDocumentIds.length - 1) {
      setCurrentDocumentIndex((prev) => prev + 1);
      setEditingField(null);
      setEditingValue("");
      setEditError(null);
    }
  }, [currentDocumentIndex, selectedDocumentIds.length]);

  // Handle field click to start editing
  const handleFieldClick = useCallback((fieldName: string, value: any) => {
    if (fieldName === "_id" || fieldName === "_creationTime") {
      return; // Don't allow editing system fields
    }

    setEditingField({ fieldName, value });

    // Format value for editing
    if (value === null || value === undefined) {
      setEditingValue("");
    } else if (typeof value === "object") {
      setEditingValue(JSON.stringify(value, null, 2));
    } else {
      setEditingValue(String(value));
    }
    setEditError(null);
  }, []);

  // Handle cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    setEditingValue("");
    setEditError(null);
  }, []);

  // Handle save editing
  const handleSaveEdit = useCallback(async () => {
    if (
      !editingField ||
      !currentDocument ||
      !adminClient ||
      !selectedTable ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      // Parse the value based on the original value type
      let parsedValue: any = editingValue;
      const originalValue = editingField.value;

      // Try to parse as JSON if it looks like JSON
      if (typeof originalValue === "object" && originalValue !== null) {
        try {
          parsedValue = JSON.parse(editingValue);
        } catch {
          // If parsing fails, keep as string
          parsedValue = editingValue;
        }
      } else if (typeof originalValue === "number") {
        // Try to parse as number
        const numValue = parseFloat(editingValue);
        if (!isNaN(numValue)) {
          parsedValue = numValue;
        }
      } else if (typeof originalValue === "boolean") {
        // Parse boolean
        if (editingValue.toLowerCase() === "true") {
          parsedValue = true;
        } else if (editingValue.toLowerCase() === "false") {
          parsedValue = false;
        }
      } else if (originalValue === null || originalValue === undefined) {
        // If original was null/undefined, try to parse or keep as string
        if (
          editingValue.trim() === "" ||
          editingValue.toLowerCase() === "null" ||
          editingValue.toLowerCase() === "unset"
        ) {
          parsedValue = null;
        } else {
          try {
            parsedValue = JSON.parse(editingValue);
          } catch {
            parsedValue = editingValue;
          }
        }
      }

      // Update the document
      await patchDocumentFields(
        selectedTable,
        [currentDocument._id],
        { [editingField.fieldName]: parsedValue },
        adminClient,
      );

      // Update local cache
      const updatedDoc = {
        ...currentDocument,
        [editingField.fieldName]: parsedValue,
      };
      setCurrentDocument(updatedDoc);
      setCachedDocuments((prev) =>
        new Map(prev).set(currentDocument._id, updatedDoc),
      );

      // Clear editing state
      setEditingField(null);
      setEditingValue("");

      // Show success toast
      toast("success", "Field updated successfully");

      // Call update callback
      if (onDocumentUpdate) {
        onDocumentUpdate();
      }
    } catch (error: any) {
      console.error("Error updating document:", error);
      const errorMessage =
        error?.data || error?.message || "Failed to update field";
      setEditError(errorMessage);
      toast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [
    editingField,
    editingValue,
    currentDocument,
    adminClient,
    selectedTable,
    isSaving,
    onDocumentUpdate,
  ]);

  // Handle copy field value
  const handleCopy = useCallback(async (value: any) => {
    try {
      let textToCopy: string;
      if (value === null || value === undefined) {
        textToCopy = "null";
      } else if (typeof value === "object") {
        textToCopy = JSON.stringify(value, null, 2);
      } else {
        textToCopy = String(value);
      }

      await navigator.clipboard.writeText(textToCopy);
      toast("success", "Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast("error", "Failed to copy");
    }
  }, []);

  // Handle keyboard shortcuts (arrow keys for navigation)
  useEffect(() => {
    if (!isOpen) return;

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (editingField) return; // Don't navigate while editing

      if (e.key === "ArrowLeft" && currentDocumentIndex > 0) {
        e.preventDefault();
        e.stopPropagation();
        handlePrevious();
      } else if (
        e.key === "ArrowRight" &&
        currentDocumentIndex < selectedDocumentIds.length - 1
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      } else if (e.key === "Escape" && editingField) {
        e.preventDefault();
        e.stopPropagation();
        handleCancelEdit();
      }
    };

    window.addEventListener("keydown", handleArrowKeys);
    return () => {
      window.removeEventListener("keydown", handleArrowKeys);
    };
  }, [
    isOpen,
    editingField,
    currentDocumentIndex,
    selectedDocumentIds.length,
    handleCancelEdit,
    handlePrevious,
    handleNext,
  ]);

  const canNavigatePrevious = currentDocumentIndex > 0;
  const canNavigateNext = currentDocumentIndex < selectedDocumentIds.length - 1;
  const showNavigation = selectedDocumentIds.length > 1;

  // Title with document count and position indicator
  const titleContent = showNavigation ? (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span>
        {selectedDocumentIds.length}{" "}
        {selectedDocumentIds.length === 1 ? "document" : "documents"}
      </span>
      <span
        style={{
          padding: "0 4px",
          borderRadius: "6px",
          backgroundColor: "var(--color-panel-bg-tertiary)",
          fontSize: "11px",
          color: "var(--color-panel-text-secondary)",
          lineHeight: "14px",
        }}
      >
        {currentDocumentIndex + 1} of {selectedDocumentIds.length}
      </span>
    </div>
  ) : (
    `${selectedDocumentIds.length} ${selectedDocumentIds.length === 1 ? "document" : "documents"}`
  );

  // Navigation buttons for header left
  const headerLeftContent = showNavigation ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <button
        type="button"
        onClick={handlePrevious}
        disabled={!canNavigatePrevious}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          padding: 0,
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "8px",
          cursor: canNavigatePrevious ? "pointer" : "not-allowed",
          color: "var(--color-panel-text-muted)",
          opacity: canNavigatePrevious ? 1 : 0.5,
          flexShrink: 0,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (canNavigatePrevious) {
            e.currentTarget.style.color = "var(--color-panel-text)";
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-tertiary)";
          }
        }}
        onMouseLeave={(e) => {
          if (canNavigatePrevious) {
            e.currentTarget.style.color = "var(--color-panel-text-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <ArrowLeft size={14} />
      </button>
      <button
        type="button"
        onClick={handleNext}
        disabled={!canNavigateNext}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          padding: 0,
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "8px",
          cursor: canNavigateNext ? "pointer" : "not-allowed",
          color: "var(--color-panel-text-muted)",
          opacity: canNavigateNext ? 1 : 0.5,
          flexShrink: 0,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (canNavigateNext) {
            e.currentTarget.style.color = "var(--color-panel-text)";
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-tertiary)";
          }
        }}
        onMouseLeave={(e) => {
          if (canNavigateNext) {
            e.currentTarget.style.color = "var(--color-panel-text-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <ArrowRight size={14} />
      </button>
    </div>
  ) : undefined;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="480px"
      container={container}
      renderMode={renderMode}
    >
      <SheetLayout
        title={typeof titleContent === "string" ? titleContent : ""}
        headerLeft={
          <>
            {headerLeftContent}
            {typeof titleContent !== "string" && titleContent}
          </>
        }
        onClose={onClose}
        contentNoPadding
        contentStyle={{ overflow: "hidden" }}
      >
        {/* Search */}
        <div
          style={{
            padding: "4px 12px",
            borderBottom: "1px solid var(--color-panel-border)",
            flexShrink: 0,
          }}
        >
          <div className="cp-search-wrapper">
            <Search size={14} className="cp-search-icon" />
            <input
              type="text"
              placeholder="Search by field name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                border: "none !important",
                height: "32px",
                paddingLeft: "28px",
                paddingRight: "8px",
                fontSize: "12px",
                color: "var(--color-panel-text)",
                outline: "none",
                boxSizing: "border-box",
                transition:
                  "border-color 0.2s ease, background-color 0.2s ease",
              }}
            />
          </div>
        </div>

        {/* Fields List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
          }}
        >
          {isLoadingDocument ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                color: "var(--color-panel-text-secondary)",
                fontSize: "14px",
              }}
            >
              Loading document...
            </div>
          ) : !currentDocument ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                color: "var(--color-panel-text-secondary)",
                fontSize: "14px",
              }}
            >
              Document not found
            </div>
          ) : filteredFields.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                color: "var(--color-panel-text-secondary)",
                fontSize: "14px",
              }}
            >
              {searchQuery ? "No fields match your search" : "No fields found"}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {filteredFields.map((fieldName) => {
                const value = currentDocument[fieldName];
                const isEditing = editingField?.fieldName === fieldName;
                const isSystemField =
                  fieldName === "_id" || fieldName === "_creationTime";
                const meta = columnMeta[fieldName] || {
                  typeLabel: typeof value,
                  optional: false,
                };

                // Format display value
                const isCreationTime =
                  fieldName === "_creationTime" && typeof value === "number";
                const displayValue = isCreationTime
                  ? formatTimestamp(value)
                  : formatValue(value);

                return (
                  <div key={fieldName}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-panel-text)",
                          fontFamily: "monospace",
                        }}
                      >
                        {fieldName}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--color-panel-text-secondary)",
                          fontFamily: "monospace",
                        }}
                      >
                        {meta.typeLabel}
                      </span>
                    </div>

                    {isEditing ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editingValue}
                          onChange={(e) => {
                            setEditingValue(e.target.value);
                            setEditError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              handleCancelEdit();
                            } else if (
                              e.key === "Enter" &&
                              (e.metaKey || e.ctrlKey)
                            ) {
                              handleSaveEdit();
                            }
                          }}
                          style={{
                            width: "100%",
                            minHeight: "28px",
                            padding: "12px",
                            fontSize: "12px",
                            fontFamily: "monospace",
                            backgroundColor: editError
                              ? "var(--color-panel-bg-secondary)"
                              : "var(--color-panel-bg-secondary)",
                            border: editError
                              ? "1px solid var(--color-panel-error)"
                              : "1px solid var(--color-panel-border)",
                            borderRadius: "8px",
                            color: "var(--color-panel-text)",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => {
                            if (!editError) {
                              e.currentTarget.style.borderColor =
                                "var(--color-panel-accent)";
                              e.currentTarget.style.backgroundColor =
                                "var(--color-panel-bg-tertiary)";
                            }
                          }}
                          onBlur={(e) => {
                            if (!editError) {
                              e.currentTarget.style.borderColor =
                                "var(--color-panel-border)";
                              e.currentTarget.style.backgroundColor =
                                "var(--color-panel-bg-secondary)";
                            }
                          }}
                        />
                        {editError && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-panel-error)",
                              padding: "0 2px",
                              lineHeight: "14px",
                              minHeight: "14px",
                            }}
                          >
                            {editError}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                            marginTop: "2px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 500,
                              backgroundColor: "transparent",
                              border: "1px solid var(--color-panel-border)",
                              borderRadius: "8px",
                              color: "var(--color-panel-text-secondary)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                "var(--color-panel-text)";
                              e.currentTarget.style.borderColor =
                                "var(--color-panel-border-hover)";
                              e.currentTarget.style.backgroundColor =
                                "var(--color-panel-hover)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                "var(--color-panel-text-secondary)";
                              e.currentTarget.style.borderColor =
                                "var(--color-panel-border)";
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 500,
                              backgroundColor: isSaving
                                ? "var(--color-panel-bg-accent)"
                                : "var(--color-panel-primary)",
                              border: "none",
                              borderRadius: "8px",
                              color: isSaving
                                ? "var(--color-panel-text-secondary)"
                                : "var(--color-panel-text-on-primary)",
                              cursor: isSaving ? "not-allowed" : "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSaving) {
                                e.currentTarget.style.opacity = "0.9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSaving) {
                                e.currentTarget.style.opacity = "1";
                              }
                            }}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() =>
                          !isSystemField && handleFieldClick(fieldName, value)
                        }
                        style={{
                          position: "relative",
                          padding: "4px 28px 4px 12px",
                          backgroundColor: "var(--color-panel-bg-secondary)",
                          border: "1px solid var(--color-panel-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--color-panel-text)",
                          fontFamily:
                            typeof value === "string" && value.length > 50
                              ? "monospace"
                              : "inherit",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          cursor: isSystemField ? "default" : "pointer",
                          minHeight: "28px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSystemField) {
                            e.currentTarget.style.backgroundColor =
                              "var(--color-panel-bg-tertiary)";
                            e.currentTarget.style.borderColor =
                              "var(--color-panel-border-hover)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSystemField) {
                            e.currentTarget.style.backgroundColor =
                              "var(--color-panel-bg-secondary)";
                            e.currentTarget.style.borderColor =
                              "var(--color-panel-border)";
                          }
                        }}
                      >
                        {displayValue}
                        <div
                          style={{
                            position: "absolute",
                            right: "4px",
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconButton
                            icon={Copy}
                            onClick={() => handleCopy(value)}
                            size={14}
                            aria-label="Copy value"
                            defaultColor="var(--color-panel-text-secondary)"
                            hoverBackgroundColor="var(--color-panel-bg-tertiary)"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetLayout>
    </Sheet>
  );
};
