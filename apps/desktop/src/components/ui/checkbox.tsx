import React, { useCallback, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: number;
  containerSize?: number;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { size = 16, containerSize, indeterminate = false, style, ...props },
    ref,
  ) => {
    const outer = containerSize ?? size + 10;
    const inputRef = useRef<HTMLInputElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
      },
      [ref],
    );

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate && !props.checked;
      }
    }, [indeterminate, props.checked]);

    return (
      <label
        style={{
          width: outer,
          height: outer,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: props.disabled ? "not-allowed" : "pointer",
          opacity: props.disabled ? 0.5 : 1,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          position: "relative",
          ...style,
        }}
      >
        <input
          ref={setRefs}
          type="checkbox"
          {...props}
          style={{
            appearance: "none",
            width: size,
            height: size,
            borderRadius: 6,
            cursor: "pointer",
            border: props.checked
              ? "1px solid transparent"
              : "1px solid var(--color-panel-border)",
            backgroundColor: props.checked
              ? "var(--color-panel-accent)"
              : "var(--color-panel-bg-tertiary)",
            transition: "all 0.15s ease",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: 0,
          }}
        />
        {props.checked && (
          <Icon name="check" className="h-4 w-4" />
        )}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
