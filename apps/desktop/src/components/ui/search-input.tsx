import * as React from "react";
import { Input, type InputProps } from "./input";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<InputProps, "type"> {
  placeholder?: string;
  containerClassName?: string;
  iconClassName?: string;
  iconName?: string;
  width?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      placeholder = "Search...",
      containerClassName,
      iconClassName,
      iconName = "search",
      width = "w-64",
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("relative", width, containerClassName)}>
        <Icon
          name={iconName}
          className={cn(
            "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle",
            iconClassName,
          )}
        />
        <Input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className={cn("pl-9", className)}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
