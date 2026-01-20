import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { Sheet, SheetLayout } from "../../../components/shared";
import { ObjectEditor } from "../../../components/editor";
import { insertDocuments } from "../../../utils/api/documents";
import { toast } from "sonner";
import type { TableSchema, TableField } from "../../../types";
import type { Value } from "convex/values";

export interface AddDocumentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  tableSchema?: TableSchema;
  componentId?: string | null;
  adminClient?: any;
  onDocumentAdded?: () => void;
  container?: HTMLElement | null;
  /**
   * Render mode for the sheet:
   * - 'portal': Uses createPortal to render the sheet (default, used for overlays)
   * - 'inline': Renders directly without portal (used for push-aside layouts in desktop)
   */
  renderMode?: "portal" | "inline";
}

// Helper to check if value is a plain object
function isPlainObject(value: any): value is Record<string, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

// Helper to omit properties from an object
function omitBy<T extends Record<string, any>>(
  obj: T,
  predicate: (value: any, key: string) => boolean,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      !predicate(obj[key], key)
    ) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Helper type for generic document
type GenericDocument = Record<string, Value>;

// Helper to check if value is a document or array of documents
function isDocument(
  value: Value | undefined,
  allowMultipleDocuments: boolean,
): value is GenericDocument | GenericDocument[] {
  return (
    isPlainObject(value) ||
    (allowMultipleDocuments &&
      Array.isArray(value) &&
      value.length >= 1 &&
      value.every(isPlainObject))
  );
}

// Helper to extract the actual type from a field shape
const getFieldType = (field: { shape: any }): string => {
  const normalizeType = (type: string | undefined): string => {
    if (!type) return "any";
    const lower = type.toLowerCase();
    if (
      lower === "string" ||
      lower === "boolean" ||
      lower === "number" ||
      lower === "array" ||
      lower === "object" ||
      lower === "float64" ||
      lower === "int64" ||
      lower === "bytes" ||
      lower === "id" ||
      lower === "any"
    ) {
      return lower;
    }
    return lower;
  };

  if (field.shape?.type === "optional" && field.shape?.shape?.type) {
    return normalizeType(field.shape.shape.type);
  }
  if (field.shape?.type) {
    const directType = normalizeType(field.shape.type);
    if (directType !== "optional") {
      return directType;
    }
  }
  if (field.shape?.shape?.type) {
    return normalizeType(field.shape.shape.type);
  }
  return "any";
};

// Generate default document value from schema
const getDefaultDocument = (tableSchema?: TableSchema): GenericDocument => {
  if (tableSchema && tableSchema.fields && tableSchema.fields.length > 0) {
    const defaultDoc: GenericDocument = {};

    const fieldsToInclude = tableSchema.fields.filter((field) => {
      return !field.fieldName.startsWith("_");
    });

    fieldsToInclude.forEach((field) => {
      let exampleValue: Value;
      const fieldType = getFieldType(field);

      if (field.shape.tableName || field.shape.shape?.tableName) {
        exampleValue = "";
      } else if (
        fieldType === "boolean" ||
        field.shape?.type === "Boolean" ||
        field.shape?.type === "boolean" ||
        field.shape?.shape?.type === "boolean" ||
        field.shape?.shape?.type === "Boolean"
      ) {
        exampleValue = false;
      } else if (fieldType === "number" || fieldType === "float64") {
        exampleValue = 0;
      } else if (fieldType === "array") {
        exampleValue = [];
      } else if (fieldType === "object") {
        if (field.shape.fields && field.shape.fields.length > 0) {
          const nestedObj: GenericDocument = {};
          field.shape.fields
            .filter(
              (nestedField: any) =>
                !nestedField.fieldName.startsWith("_") &&
                nestedField.optional !== true,
            )
            .forEach((nestedField: any) => {
              const nestedFieldType = getFieldType(nestedField);
              if (nestedFieldType === "boolean") {
                nestedObj[nestedField.fieldName] = false;
              } else if (
                nestedFieldType === "number" ||
                nestedFieldType === "float64"
              ) {
                nestedObj[nestedField.fieldName] = 0;
              } else if (nestedFieldType === "array") {
                nestedObj[nestedField.fieldName] = [];
              } else {
                nestedObj[nestedField.fieldName] = "";
              }
            });
          exampleValue = Object.keys(nestedObj).length > 0 ? nestedObj : {};
        } else {
          exampleValue = {};
        }
      } else if (fieldType === "bytes") {
        exampleValue = "";
      } else {
        exampleValue = "";
      }

      defaultDoc[field.fieldName] = exampleValue;
    });

    if (Object.keys(defaultDoc).length > 0) {
      return defaultDoc;
    }
  }

  return {};
};

// Validate a value against a field schema
const validateFieldValue = (
  value: any,
  field: TableField,
  fieldPath: string = "",
): string[] => {
  const errors: string[] = [];
  const shape = field.shape;
  if (!shape) return errors;

  const shapeAny = shape as any;
  let isOptional = field.optional;
  let currentShape: any = shape;

  if (shape.type === "optional" && shapeAny.shape) {
    isOptional = true;
    currentShape = shapeAny.shape;
  } else if (shapeAny.shape) {
    currentShape = shapeAny.shape;
    if (currentShape.type === "optional" && (currentShape as any).shape) {
      isOptional = true;
      currentShape = (currentShape as any).shape;
    }
  }

  if ((value === undefined || value === null) && isOptional) {
    return errors;
  }

  if ((value === undefined || value === null) && !isOptional) {
    errors.push(
      `Type '${value === null ? "null" : "undefined"}' is not assignable to required field '${fieldPath || field.fieldName}'`,
    );
    return errors;
  }

  let unionValue: any[] | null = null;
  if (
    shape.type === "union" &&
    shapeAny.value &&
    Array.isArray(shapeAny.value)
  ) {
    unionValue = shapeAny.value;
  } else if (currentShape.type === "union") {
    const currentShapeAny = currentShape as any;
    if (currentShapeAny.value && Array.isArray(currentShapeAny.value)) {
      unionValue = currentShapeAny.value;
    }
  }

  if (unionValue) {
    const isValid = unionValue.some((item: any) => {
      if (item.type === "literal") {
        return value === item.value;
      }
      return true;
    });

    if (!isValid) {
      const literalValues = unionValue
        .filter((item: any) => item.type === "literal")
        .map((item: any) => `"${item.value}"`)
        .join(", ");

      if (literalValues) {
        const unionParts = unionValue
          .filter((item: any) => item.type === "literal")
          .map((item: any) => `v.literal("${item.value}")`)
          .join(",\n      ");
        errors.push(
          `Type '${typeof value === "string" ? `"${value}"` : typeof value}' is not assignable to:\nv.union(\n      ${unionParts}\n    )`,
        );
      } else {
        errors.push(`Type '${typeof value}' is not assignable to union type`);
      }
    }
  } else if (currentShape.type === "literal") {
    const currentShapeAny = currentShape as any;
    if (value !== currentShapeAny.value) {
      errors.push(
        `Type '${typeof value === "string" ? `"${value}"` : typeof value}' is not assignable to: v.literal("${currentShapeAny.value}")`,
      );
    }
  } else if (
    currentShape.type === "id" ||
    currentShape.tableName ||
    shape.tableName
  ) {
    if (typeof value !== "string" || !value.match(/^[a-zA-Z0-9_-]+$/)) {
      const tableName = currentShape.tableName || shape.tableName || "";
      errors.push(
        `Type '${typeof value}' is not assignable to: v.id("${tableName}")`,
      );
    }
  } else if (
    currentShape.type === "boolean" ||
    currentShape.type === "Boolean"
  ) {
    if (typeof value !== "boolean") {
      errors.push(`Type '${typeof value}' is not assignable to: v.boolean()`);
    }
  } else if (
    currentShape.type === "number" ||
    currentShape.type === "float64" ||
    currentShape.type === "Number"
  ) {
    if (typeof value !== "number" || isNaN(value)) {
      errors.push(`Type '${typeof value}' is not assignable to: v.number()`);
    }
  } else if (currentShape.type === "string" || currentShape.type === "String") {
    if (typeof value !== "string") {
      errors.push(`Type '${typeof value}' is not assignable to: v.string()`);
    }
  } else if (currentShape.type === "array") {
    const currentShapeAny = currentShape as any;
    if (!Array.isArray(value)) {
      errors.push(`Type '${typeof value}' is not assignable to: v.array(...)`);
    } else if (currentShapeAny.value) {
      value.forEach((item, index) => {
        const elementErrors = validateFieldValue(
          item,
          {
            fieldName: `${fieldPath}[${index}]`,
            optional: false,
            shape: currentShapeAny.value,
          } as TableField,
          `${fieldPath}[${index}]`,
        );
        errors.push(...elementErrors);
      });
    }
  } else if (currentShape.type === "object") {
    const currentShapeAny = currentShape as any;
    if (!isPlainObject(value)) {
      errors.push(
        `Type '${typeof value}' is not assignable to: v.object({...})`,
      );
    } else if (currentShapeAny.fields) {
      currentShapeAny.fields.forEach((f: TableField) => {
        const fieldValue = (value as Record<string, any>)[f.fieldName];
        const fieldErrors = validateFieldValue(
          fieldValue,
          f,
          fieldPath ? `${fieldPath}.${f.fieldName}` : f.fieldName,
        );
        errors.push(...fieldErrors);
      });
    }
  }

  return errors;
};

export const AddDocumentSheet: React.FC<AddDocumentSheetProps> = ({
  isOpen,
  onClose,
  selectedTable,
  tableSchema,
  componentId,
  adminClient,
  onDocumentAdded,
  container,
  renderMode = "portal",
}) => {
  const defaultDocument = useMemo(
    () => getDefaultDocument(tableSchema),
    [tableSchema],
  );

  const initialValue = useMemo(() => {
    if (selectedTable && defaultDocument) {
      return [defaultDocument];
    }
    return undefined;
  }, [selectedTable, defaultDocument]);

  const [value, setValue] = useState<Value | undefined>(initialValue);
  const [documents, setDocuments] = useState<GenericDocument[]>(() => {
    if (!initialValue) return [];
    if (Array.isArray(initialValue)) {
      return initialValue.filter((item): item is GenericDocument =>
        isPlainObject(item),
      );
    }
    return isPlainObject(initialValue) ? [initialValue] : [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInvalidObject, setIsInvalidObject] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [syntaxErrors, setSyntaxErrors] = useState<string[]>([]);
  const [showProblems, setShowProblems] = useState(false);
  const randomNumberRef = useRef<number>(Math.random());

  useEffect(() => {
    if (selectedTable) {
      const defaultValue = [defaultDocument];
      setValue(defaultValue);
      setDocuments(defaultValue);
      setError(null);
      setIsInvalidObject(false);
    }
  }, [selectedTable, defaultDocument]);

  // Validate documents against schema
  const validateDocuments = useCallback(
    (docs: GenericDocument[]): string[] => {
      if (!tableSchema || !tableSchema.fields) return [];

      const errors: string[] = [];

      docs.forEach((doc, docIndex) => {
        const docPrefix = docs.length > 1 ? `[${docIndex}]` : "";

        tableSchema.fields.forEach((field) => {
          if (field.fieldName.startsWith("_")) return;

          const fieldValue = doc[field.fieldName];
          const fieldErrors = validateFieldValue(
            fieldValue,
            field,
            `${docPrefix}.${field.fieldName}`,
          );
          errors.push(...fieldErrors);
        });
      });

      return errors;
    },
    [tableSchema],
  );

  const onChange = useCallback(
    (newValue?: Value) => {
      setValue(newValue);

      const cleanValue = newValue
        ? Array.isArray(newValue)
          ? newValue
          : isPlainObject(newValue)
            ? omitBy(
                newValue as Record<string, Value>,
                (_v: Value, k: string) => k.startsWith("_"),
              )
            : newValue
        : undefined;

      if (isDocument(cleanValue, true)) {
        const docsArray = Array.isArray(cleanValue) ? cleanValue : [cleanValue];
        setDocuments(docsArray);

        const errors = validateDocuments(docsArray);
        if (errors.length > 0) {
          setIsInvalidObject(true);
          setValidationErrors(errors);
        } else {
          setIsInvalidObject(false);
          setValidationErrors([]);
        }
      } else {
        setDocuments([]);
        setIsInvalidObject(false);
        setValidationErrors([]);
      }
    },
    [validateDocuments],
  );

  let validationError: string | undefined;
  if (isInvalidObject) {
    validationError = "Please fix the errors above to continue.";
  } else if (!isDocument(value, true)) {
    validationError =
      "Please enter a document or an array of documents to continue.";
  } else if (documents.length === 0) {
    validationError = "At least one document is required.";
  }

  const [submitErrorMessage, setSubmitErrorMessage] = useState<
    string | undefined
  >(undefined);
  const validationMessage = validationError ?? submitErrorMessage;

  useEffect(() => {
    setSubmitErrorMessage(undefined);
  }, [validationError, documents]);

  const disabled = validationError !== undefined || isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (disabled || !adminClient) {
      return;
    }

    setSubmitErrorMessage(undefined);
    setIsSubmitting(true);
    setError(null);

    try {
      const cleanDocuments = documents.map((doc) => {
        const { _id, _creationTime, ...rest } = doc;
        return rest;
      });

      if (!selectedTable) {
        throw new Error("No table selected");
      }

      await insertDocuments(
        selectedTable,
        cleanDocuments,
        adminClient,
        componentId || null,
      );

      toast.success(
        `Successfully added ${cleanDocuments.length} document${cleanDocuments.length > 1 ? "s" : ""} to ${selectedTable}`,
      );

      if (onDocumentAdded) {
        onDocumentAdded();
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      let errorMessage = "Failed to insert documents";

      if (err?.data) {
        errorMessage = err.data;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
      setSubmitErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    adminClient,
    documents,
    selectedTable,
    componentId,
    disabled,
    onDocumentAdded,
    onClose,
  ]);

  const allErrors = [...syntaxErrors, ...validationErrors];
  const hasErrors = allErrors.length > 0;

  const footerContent = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        style={{
          padding: "6px 10px",
          borderRadius: "8px",
          border: "none",
          background: "transparent",
          color: "var(--color-panel-text)",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          fontSize: "11px",
          fontWeight: 500,
          transition: "all 0.15s ease",
          opacity: isSubmitting ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-tertiary)";
            e.currentTarget.style.borderColor = "var(--color-panel-text-muted)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-secondary)";
            e.currentTarget.style.borderColor = "var(--color-panel-border)";
          }
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
        style={{
          padding: "6px 10px",
          borderRadius: "8px",
          border: "none",
          background: disabled
            ? "var(--color-panel-bg-tertiary)"
            : "var(--color-panel-accent)",
          color: disabled
            ? "var(--color-panel-text-muted)"
            : "var(--color-panel-bg)",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = "0.9";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = "1";
          }
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span>Adding...</span>
          </>
        ) : (
          <>
            <Plus size={14} />
            <span>Add</span>
          </>
        )}
      </button>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      width="480px"
      container={container}
      renderMode={renderMode}
    >
      <SheetLayout
        title="Add Document"
        onClose={onClose}
        footer={footerContent}
        contentNoPadding
        contentStyle={{ overflow: "hidden" }}
      >
        {/* Editor Container */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <ObjectEditor
            key={`${selectedTable}-${randomNumberRef.current}`}
            defaultValue={value}
            onChange={onChange}
            onError={(errors) => {
              setIsInvalidObject(errors.length > 0);
              setSyntaxErrors(errors);
            }}
            path={`document/${selectedTable}/${randomNumberRef.current}`}
            fullHeight
            autoFocus
            saveAction={handleSubmit}
            showLineNumbers
            language="json"
            indentTopLevel={true}
            className=""
            editorClassname=""
          />
        </div>

        {/* Error Messages */}
        {(error || validationMessage) && (
          <div
            style={{
              padding: "10px 12px",
              margin: "12px",
              borderRadius: "8px",
              backgroundColor:
                "color-mix(in srgb, var(--color-panel-error) 10%, transparent)",
              border: "1px solid var(--color-panel-error)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              color: "var(--color-panel-error)",
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error || validationMessage}</span>
              {hasErrors && (
                <span style={{ fontSize: "10px", opacity: 0.8 }}>
                  ({allErrors.length}{" "}
                  {allErrors.length === 1 ? "problem" : "problems"})
                </span>
              )}
            </div>
            {hasErrors && (
              <button
                type="button"
                onClick={() => setShowProblems(!showProblems)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-panel-error)",
                  background: "transparent",
                  color: "var(--color-panel-error)",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "color-mix(in srgb, var(--color-panel-error) 20%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {showProblems ? "Hide" : "View"}
              </button>
            )}
          </div>
        )}

        {/* Problems List */}
        {showProblems && hasErrors && (
          <div
            style={{
              padding: "10px 12px",
              margin: "0 12px 12px",
              backgroundColor: "var(--color-panel-bg)",
              border: "1px solid var(--color-panel-border)",
              borderRadius: "8px",
              maxHeight: "120px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            {allErrors.map((errorMsg, index) => (
              <div
                key={index}
                style={{
                  padding: "8px 10px",
                  backgroundColor: "var(--color-panel-bg-tertiary)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  color: "var(--color-panel-text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {errorMsg}
              </div>
            ))}
          </div>
        )}
      </SheetLayout>
    </Sheet>
  );
};
