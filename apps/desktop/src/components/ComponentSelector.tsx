/**
 * ComponentSelector Component
 * Searchable dropdown for selecting a Convex component
 */

import { useMemo } from "react";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { ConvexComponent } from "@/features/data/types";

// Special value to represent root app (null) in SearchableSelect
const ROOT_VALUE = "__root__";

interface ComponentSelectorProps {
  /** Currently selected component ID (null = root app) */
  selectedComponentId: string | null;
  /** Called when a component is selected */
  onSelect: (componentId: string | null) => void;
  /** List of available components */
  components: ConvexComponent[];
  /** Stretch to full width */
  fullWidth?: boolean;
  /** Visual style variant */
  variant?: "inline" | "input";
}

export function ComponentSelector({
  selectedComponentId,
  onSelect,
  components,
  fullWidth = false,
  variant = "inline",
}: ComponentSelectorProps) {
  // Convert components to SearchableSelect options
  const options = useMemo(() => {
    return components.map((component) => {
      // Get display label for a component
      const getDisplayLabel = (comp: ConvexComponent) => {
        if (comp.id === null) {
          return "Root (app)";
        }
        return comp.path || comp.name || comp.id;
      };

      return {
        value: component.id === null ? ROOT_VALUE : component.id,
        label: getDisplayLabel(component),
      };
    });
  }, [components]);

  // Convert selectedComponentId to SearchableSelect value format
  const selectValue = useMemo(() => {
    return selectedComponentId === null ? ROOT_VALUE : selectedComponentId;
  }, [selectedComponentId]);

  // Handle selection change - convert back to null for root
  const handleChange = (value: string) => {
    const componentId = value === ROOT_VALUE ? null : value;
    onSelect(componentId);
  };

  // Map variant to SearchableSelect variant
  const selectVariant = variant === "input" ? "outline" : "ghost";

  return (
    <div
      className={cn(
        fullWidth && "w-full",
        variant === "input" && "flex-1 min-w-0",
      )}
    >
      <SearchableSelect
        value={selectValue}
        options={options}
        onChange={handleChange}
        placeholder="Select component..."
        searchPlaceholder="Search components..."
        triggerIcon={<Code size={14} />}
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

export default ComponentSelector;
