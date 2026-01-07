import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/button";

/** Storage key prefix for persisting sheet sizes */
const STORAGE_KEY_PREFIX = "convex-panel-sheet-size-";

type Side = "left" | "right" | "top" | "bottom";

interface ResizableSheetProps {
  /** Unique identifier for persisting size */
  id: string;
  /** Sheet title (optional - if not provided, no header is rendered) */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Close handler (optional - if not provided, no close button is rendered) */
  onClose?: () => void;
  /** Sheet content */
  children: ReactNode;
  /** Which side the sheet appears from */
  side?: Side;
  /** Default width (for left/right sheets) */
  defaultWidth?: number;
  /** Default height (for top/bottom sheets) */
  defaultHeight?: number;
  /** Minimum width */
  minWidth?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Minimum height */
  minHeight?: number;
  /** Maximum height */
  maxHeight?: number;
  /** Optional header actions (rendered after title, before close button) */
  headerActions?: ReactNode;
  /** Whether to show the resize handle */
  resizable?: boolean;
  /** Whether to show the header (defaults to true if title is provided) */
  showHeader?: boolean;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Helper to determine if a side uses horizontal (width) sizing
 */
function isHorizontalSide(side: Side): boolean {
  return side === "left" || side === "right";
}

/**
 * Get resize handle position styles based on side
 */
function getResizeHandleStyles(side: Side): React.CSSProperties {
  switch (side) {
    case "left":
      // Handle on right edge
      return {
        right: 0,
        top: 0,
        bottom: 0,
        width: "4px",
        cursor: "ew-resize",
      };
    case "right":
      // Handle on left edge
      return {
        left: 0,
        top: 0,
        bottom: 0,
        width: "4px",
        cursor: "ew-resize",
      };
    case "top":
      // Handle on bottom edge
      return {
        bottom: 0,
        left: 0,
        right: 0,
        height: "4px",
        cursor: "ns-resize",
      };
    case "bottom":
      // Handle on top edge
      return {
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        cursor: "ns-resize",
      };
  }
}

/**
 * Get border styles based on side
 */
function getBorderStyles(side: Side): React.CSSProperties {
  switch (side) {
    case "left":
      return { borderRight: "1px solid var(--color-border-base)" };
    case "right":
      return { borderLeft: "1px solid var(--color-border-base)" };
    case "top":
      return { borderBottom: "1px solid var(--color-border-base)" };
    case "bottom":
      return { borderTop: "1px solid var(--color-border-base)" };
  }
}

export function ResizableSheet({
  id,
  title,
  subtitle,
  onClose,
  children,
  side = "right",
  defaultWidth = 400,
  defaultHeight = 320,
  minWidth = 300,
  maxWidth = 800,
  minHeight = 200,
  maxHeight = 600,
  headerActions,
  resizable = true,
  showHeader,
  className = "",
}: ResizableSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHorizontal = isHorizontalSide(side);

  // Determine if header should be shown
  const shouldShowHeader = showHeader ?? title !== undefined;

  // Load persisted size from localStorage
  const getPersistedSize = useCallback(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return isHorizontal ? parsed.width : parsed.height;
      }
    } catch {
      // Ignore parse errors
    }
    return isHorizontal ? defaultWidth : defaultHeight;
  }, [id, isHorizontal, defaultWidth, defaultHeight]);

  const [size, setSize] = useState<number>(getPersistedSize);
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  // Persist size to localStorage
  useEffect(() => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${id}`;
      const stored = localStorage.getItem(key);
      const parsed = stored ? JSON.parse(stored) : {};

      if (isHorizontal) {
        parsed.width = size;
      } else {
        parsed.height = size;
      }

      localStorage.setItem(key, JSON.stringify(parsed));
    } catch {
      // Ignore storage errors
    }
  }, [id, isHorizontal, size]);

  // Handle resize drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = isHorizontal ? e.clientX : e.clientY;
      startSize.current = size;
      document.body.style.cursor = isHorizontal ? "ew-resize" : "ns-resize";
      document.body.style.userSelect = "none";
    },
    [isHorizontal, size],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const currentPos = isHorizontal ? e.clientX : e.clientY;

      // Calculate delta based on side
      // For right/bottom: dragging toward center (negative delta) = increase size
      // For left/top: dragging away from center (positive delta) = increase size
      let delta: number;
      if (side === "right" || side === "bottom") {
        delta = startPos.current - currentPos;
      } else {
        // left or top
        delta = currentPos - startPos.current;
      }

      const minSize = isHorizontal ? minWidth : minHeight;
      const maxSize = isHorizontal ? maxWidth : maxHeight;

      const newSize = Math.min(
        maxSize,
        Math.max(minSize, startSize.current + delta),
      );
      setSize(newSize);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [side, isHorizontal, minWidth, maxWidth, minHeight, maxHeight]);

  // Handle escape key (only if onClose is provided)
  useEffect(() => {
    if (!onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full relative ${className}`}
      style={{
        width: isHorizontal ? `${size}px` : "100%",
        minWidth: isHorizontal ? `${size}px` : undefined,
        maxWidth: isHorizontal ? `${size}px` : undefined,
        height: isHorizontal ? "100%" : `${size}px`,
        minHeight: isHorizontal ? undefined : `${size}px`,
        maxHeight: isHorizontal ? undefined : `${size}px`,
        backgroundColor: "var(--color-surface-base)",
        ...getBorderStyles(side),
      }}
    >
      {/* Resize handle */}
      {resizable && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute z-10 transition-colors"
          style={{
            ...getResizeHandleStyles(side),
            backgroundColor: isDragging.current
              ? "var(--color-brand-base)"
              : "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor =
              "var(--color-border-strong)";
          }}
          onMouseLeave={(e) => {
            if (!isDragging.current) {
              (e.currentTarget as HTMLDivElement).style.backgroundColor =
                "transparent";
            }
          }}
        />
      )}

      {/* Header (optional) */}
      {shouldShowHeader && (
        <div
          className="flex items-center justify-between px-4 h-[45px] shrink-0"
          style={{
            borderBottom: "1px solid var(--color-border-base)",
            backgroundColor: "var(--color-surface-raised)",
          }}
        >
          <div className="flex-1 min-w-0">
            {title && (
              <h3
                className="text-sm font-medium truncate"
                style={{ color: "var(--color-text-base)" }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className="text-xs mt-0.5 font-mono truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            {onClose && (
              <IconButton
                type="button"
                size="xs"
                variant="ghost"
                onClick={onClose}
                className="text-text-muted hover:text-text-base"
              >
                <X size={16} />
              </IconButton>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}

export default ResizableSheet;
