/**
 * FunctionSelector Component
 * Searchable dropdown for selecting Convex functions
 * Uses SearchableSelect for consistent UI with ComponentSelector
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";

// Types
export interface ModuleFunction {
  name: string;
  identifier: string;
  udfType: "query" | "mutation" | "action" | "httpAction";
  visibility?: {
    kind: "public" | "internal";
  };
  args?: string;
  returns?: string;
  componentId?: string | null;
  componentPath?: string;
  file?: {
    path: string;
  };
}

export interface CustomQuery {
  type: "customQuery";
  table: string | null;
  componentId?: string | null;
}

export type SelectedFunction = ModuleFunction | CustomQuery | null;

export function isCustomQuery(value: SelectedFunction): value is CustomQuery {
  return value !== null && "type" in value && value.type === "customQuery";
}

const ALL_FUNCTIONS_VALUE = "__all__";
const CUSTOM_QUERY_VALUE = "__custom__";

interface FunctionSelectorBaseProps {
  functions: ModuleFunction[];
  componentId?: string | null;
  showCustomQuery?: boolean;
  showAllFunctions?: boolean;
  placeholder?: string;
  variant?: "inline" | "input";
  fullWidth?: boolean;
}

interface FunctionSelectorSingleProps extends FunctionSelectorBaseProps {
  multiSelect?: false;
  selectedFunction: SelectedFunction;
  onSelect: (fn: SelectedFunction) => void;
}

interface FunctionSelectorMultiProps extends FunctionSelectorBaseProps {
  multiSelect: true;
  selectedFunction: SelectedFunction[];
  onSelect: (fns: SelectedFunction[]) => void;
}

type FunctionSelectorProps =
  | FunctionSelectorSingleProps
  | FunctionSelectorMultiProps;

export function FunctionSelector(props: FunctionSelectorProps) {
  const {
    functions,
    componentId,
    showCustomQuery = true,
    showAllFunctions = false,
    placeholder = "Select function...",
    variant = "inline",
    fullWidth = false,
  } = props;

  const multiSelect = props.multiSelect || false;

  // Filter functions by component ID
  const filteredByComponent = useMemo(() => {
    if (componentId === undefined) {
      return functions;
    }

    return functions.filter((fn) => {
      if (componentId === null) {
        return fn.componentId === null || fn.componentId === undefined;
      }
      return fn.componentId === componentId;
    });
  }, [functions, componentId]);

  // Build options list
  const options = useMemo(() => {
    const result: Array<{
      value: string;
      label: string;
      sublabel?: string;
      badge?: string;
      badgeColor?: string;
    }> = [];

    // Add "All functions" option
    if (showAllFunctions) {
      result.push({
        value: ALL_FUNCTIONS_VALUE,
        label: "All functions",
      });
    }

    // Add custom query option
    if (showCustomQuery) {
      result.push({
        value: CUSTOM_QUERY_VALUE,
        label: "Custom test query",
      });
    }

    // Add function options
    for (const fn of filteredByComponent) {
      let filePath = fn.file?.path || "";
      let functionName = fn.name || fn.identifier || "Unnamed function";

      // Parse identifier
      if (fn.identifier && fn.identifier.includes(":")) {
        const parts = fn.identifier.split(":");
        if (
          fn.identifier.startsWith("GET ") ||
          fn.identifier.startsWith("POST ") ||
          fn.identifier.startsWith("PUT ") ||
          fn.identifier.startsWith("DELETE ") ||
          fn.identifier.startsWith("PATCH ") ||
          fn.identifier.startsWith("OPTIONS ")
        ) {
          functionName = fn.identifier;
          filePath = "";
        } else {
          const filePart = parts.slice(0, -1).join(":");
          functionName = parts[parts.length - 1];
          if (filePart) {
            filePath = filePart;
            if (filePath.endsWith(".js")) {
              filePath = filePath.slice(0, -3);
            }
          }
        }
      }

      const fileName = filePath ? filePath.split("/").pop() || filePath : "";

      // Get badge info for UDF type
      const typeBadges: Record<string, { label: string; color: string }> = {
        query: { label: "Q", color: "text-blue-500" },
        mutation: { label: "M", color: "text-orange-500" },
        action: { label: "A", color: "text-purple-500" },
        httpAction: { label: "HTTP", color: "text-green-500" },
      };

      const badgeInfo = typeBadges[fn.udfType];

      result.push({
        value: fn.identifier,
        label: functionName,
        sublabel: fileName || undefined,
        badge: badgeInfo?.label,
        badgeColor: badgeInfo?.color,
      });
    }

    return result;
  }, [filteredByComponent, componentId, showCustomQuery, showAllFunctions]);

  // Convert SelectedFunction to string value
  const toValue = (fn: SelectedFunction): string => {
    if (!fn) return ALL_FUNCTIONS_VALUE;
    if (isCustomQuery(fn)) return CUSTOM_QUERY_VALUE;
    return fn.identifier;
  };

  // Convert string value to SelectedFunction
  const fromValue = (value: string): SelectedFunction => {
    if (value === ALL_FUNCTIONS_VALUE) return null;
    if (value === CUSTOM_QUERY_VALUE)
      return { type: "customQuery", table: null, componentId };
    const fn = filteredByComponent.find((f) => f.identifier === value);
    return fn || null;
  };

  const selectValue = useMemo(() => {
    if (multiSelect) {
      return (props.selectedFunction as SelectedFunction[]).map(toValue);
    }
    return toValue(props.selectedFunction as SelectedFunction);
  }, [props.selectedFunction, multiSelect]);

  const handleChange = (value: string | string[]) => {
    if (multiSelect) {
      const functions = (value as string[]).map(fromValue);
      (props.onSelect as (fns: SelectedFunction[]) => void)(functions);
    } else {
      const fn = fromValue(value as string);
      (props.onSelect as (fn: SelectedFunction) => void)(fn);
    }
  };

  const selectVariant = variant === "input" ? "outline" : "ghost";

  if (multiSelect) {
    return (
      <div
        className={cn(
          fullWidth && "w-full",
          variant === "input" && "flex-1 min-w-0",
        )}
      >
        <SearchableSelect
          multiSelect={true}
          value={selectValue as string[]}
          options={options}
          onChange={handleChange as (values: string[]) => void}
          placeholder={placeholder}
          searchPlaceholder="Search functions..."
          variant={selectVariant}
          className={cn(fullWidth && "w-full")}
          buttonClassName={cn(
            variant === "inline" && "pl-2 pr-1 py-0.5",
            fullWidth && "w-full",
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        fullWidth && "w-full",
        variant === "input" && "flex-1 min-w-0",
      )}
    >
      <SearchableSelect
        value={selectValue as string}
        options={options}
        onChange={handleChange as (value: string) => void}
        placeholder={placeholder}
        searchPlaceholder="Search functions..."
        variant={selectVariant}
        className={cn(fullWidth && "w-full")}
        buttonClassName={cn(
          variant === "inline" && "pl-2 pr-1 py-0.5",
          fullWidth && "w-full",
        )}
      />
    </div>
  );
}

export default FunctionSelector;
