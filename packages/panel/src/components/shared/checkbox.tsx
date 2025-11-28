import React, { useCallback, useEffect, useRef } from 'react';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: number;
  containerSize?: number;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ size = 16, containerSize, indeterminate = false, style, ...props }, ref) => {
    const outer = containerSize ?? size + 10;
    const inputRef = useRef<HTMLInputElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
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
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          opacity: props.disabled ? 0.5 : 1,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
      > 
        <input
          ref={setRefs}
          type="checkbox"
          {...props}
          style={{
            appearance: 'none',
            width: size,
            height: size,
            borderRadius: 6,
            cursor: 'pointer',
            border: props.checked ? '1px solid transparent' : '1px solid var(--color-panel-border)',
            backgroundColor: props.checked ? 'var(--color-panel-success)' : 'var(--color-panel-bg-tertiary)',
            boxShadow: props.checked
              ? '0 0 6px color-mix(in srgb, var(--color-panel-success) 60%, transparent)'
              : '0 1px 2px var(--color-panel-shadow)',
            transition: 'all 0.15s ease',
          }}
        />
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';

