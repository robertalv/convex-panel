import { useMemo } from "react";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ConvexComponent } from "@/views/data/types";

const ROOT_VALUE = "__root__";

interface ComponentSelectorBaseProps {
  components: ConvexComponent[];
  fullWidth?: boolean;
  variant?: "inline" | "input";
}

interface ComponentSelectorSingleProps extends ComponentSelectorBaseProps {
  multiSelect?: false;
  selectedComponentId: string | null;
  onSelect: (componentId: string | null) => void;
}

interface ComponentSelectorMultiProps extends ComponentSelectorBaseProps {
  multiSelect: true;
  selectedComponentId: (string | null)[];
  onSelect: (componentIds: (string | null)[]) => void;
}

type ComponentSelectorProps =
  | ComponentSelectorSingleProps
  | ComponentSelectorMultiProps;

export function ComponentSelector(props: ComponentSelectorProps) {
  const { components, fullWidth = false, variant = "inline" } = props;
  const multiSelect = props.multiSelect || false;

  const options = useMemo(() => {
    return components.map((component) => {
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

  const selectValue = useMemo(() => {
    if (multiSelect) {
      return (props.selectedComponentId as (string | null)[]).map((id) =>
        id === null ? ROOT_VALUE : id,
      );
    }
    return props.selectedComponentId === null
      ? ROOT_VALUE
      : (props.selectedComponentId as string);
  }, [props.selectedComponentId, multiSelect]);

  const handleChange = (value: string | string[]) => {
    if (multiSelect) {
      const componentIds = (value as string[]).map((v) =>
        v === ROOT_VALUE ? null : v,
      );
      (props.onSelect as (ids: (string | null)[]) => void)(componentIds);
    } else {
      const componentId = value === ROOT_VALUE ? null : (value as string);
      (props.onSelect as (id: string | null) => void)(componentId);
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
          placeholder="Select components..."
          searchPlaceholder="Search components..."
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
        placeholder="Select component..."
        searchPlaceholder="Search components..."
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
