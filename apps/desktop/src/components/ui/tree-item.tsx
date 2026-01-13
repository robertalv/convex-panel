import { ChevronRight, ChevronDown } from "lucide-react";

export interface TreeItemProps {
  label: string;
  icon?: React.ReactNode;
  depth: number;
  isExpanded?: boolean;
  isExpandable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onToggle?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function TreeItem({
  label,
  icon,
  depth,
  isExpanded,
  isExpandable,
  isSelected,
  onClick,
  onToggle,
  rightContent,
  className = "",
}: TreeItemProps) {
  const paddingLeft = 12 + depth * 16;

  return (
    <div
      className={`flex items-center h-7 cursor-pointer text-xs transition-colors ${className}`}
      style={{
        paddingLeft,
        backgroundColor: isSelected
          ? "var(--color-surface-raised)"
          : "transparent",
        color: isSelected
          ? "var(--color-text-base)"
          : "var(--color-text-muted)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      onClick={(e) => {
        if (isExpandable && onToggle) {
          onToggle();
        }
        onClick?.();
        e.stopPropagation();
      }}
    >
      {isExpandable && (
        <span
          className="w-4 h-4 flex items-center justify-center mr-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      )}
      {!isExpandable && <span className="w-4 mr-1" />}
      {icon && <span className="mr-2 shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {rightContent && (
        <span className="mr-2" style={{ color: "var(--color-text-muted)" }}>
          {rightContent}
        </span>
      )}
    </div>
  );
}

export default TreeItem;
