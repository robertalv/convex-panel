import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
  direction?: "horizontal" | "vertical";
  className?: string;
}

/**
 * A draggable resize handle for resizing panels.
 * Supports both horizontal (left/right) and vertical (up/down) resizing.
 */
export function ResizeHandle({
  onResize,
  onResizeEnd,
  direction = "horizontal",
  className,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const startPosRef = React.useRef(0);

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos =
          direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPosRef.current;
        startPosRef.current = currentPos;
        onResize(delta);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        onResizeEnd?.();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [direction, onResize, onResizeEnd],
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        "group relative flex items-center justify-center",
        "transition-colors duration-fast",
        direction === "horizontal"
          ? "w-1 cursor-col-resize hover:w-1"
          : "h-1 cursor-row-resize hover:h-1",
        className,
      )}
    >
      {/* Visual indicator line */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-fast",
          "bg-border-muted group-hover:bg-brand-base",
          isDragging && "bg-brand-base",
          direction === "horizontal"
            ? "h-8 w-0.5 group-hover:w-1"
            : "w-8 h-0.5 group-hover:h-1",
          isDragging && (direction === "horizontal" ? "w-1" : "h-1"),
        )}
      />
      {/* Larger hit area for easier grabbing */}
      <div
        className={cn(
          "absolute",
          direction === "horizontal"
            ? "inset-y-0 -inset-x-1"
            : "inset-x-0 -inset-y-1",
        )}
      />
    </div>
  );
}

export default ResizeHandle;
