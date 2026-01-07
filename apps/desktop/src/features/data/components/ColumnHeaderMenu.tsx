/**
 * ColumnHeaderMenu Component
 * Dropdown menu for column headers with sort, freeze, and delete options
 * Styled to match SearchableSelect dropdown
 */

import { useState, useRef, useMemo, useCallback } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Menu, MenuItem, MenuDivider, MenuTrigger } from "@/components/ui/menu";

type MenuItemConfig =
  | {
      type: "item";
      icon: React.ReactNode;
      label: string;
      onClick: () => void;
      disabled?: boolean;
      destructive?: boolean;
      active?: boolean;
    }
  | { type: "divider" };

interface ColumnHeaderMenuProps {
  column: string;
  isSystemField: boolean;
  isFrozen?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSortAscending: () => void;
  onSortDescending: () => void;
  onClearSort?: () => void;
  onFreeze?: () => void;
  onUnfreeze?: () => void;
  onEditColumn?: () => void;
  onDeleteColumn?: () => void;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  triggerElement: React.ReactNode;
  /** If provided, will be called to check if a drag just happened - if true, don't open menu */
  checkDragInProgress?: () => boolean;
}

export function ColumnHeaderMenu({
  column: _column,
  isSystemField,
  isFrozen = false,
  sortDirection,
  onSortAscending,
  onSortDescending,
  onClearSort: _onClearSort,
  onFreeze,
  onUnfreeze,
  onEditColumn,
  onDeleteColumn,
  onMenuOpen,
  onMenuClose,
  triggerElement,
  checkDragInProgress,
}: ColumnHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMenuOpenRef = useRef(onMenuOpen);
  const onMenuCloseRef = useRef(onMenuClose);
  onMenuOpenRef.current = onMenuOpen;
  onMenuCloseRef.current = onMenuClose;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      onMenuOpenRef.current?.();
    } else {
      onMenuCloseRef.current?.();
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onMenuCloseRef.current?.();
  }, []);

  const handleMenuAction = useCallback(
    (action: () => void) => {
      action();
      handleClose();
    },
    [handleClose],
  );

  const menuItems = useMemo<MenuItemConfig[]>(() => {
    const items: MenuItemConfig[] = [
      {
        type: "item",
        icon: <ArrowUp size={14} />,
        label: "Sort Ascending",
        onClick: () => handleMenuAction(onSortAscending),
        active: sortDirection === "asc",
      },
      {
        type: "item",
        icon: <ArrowDown size={14} />,
        label: "Sort Descending",
        onClick: () => handleMenuAction(onSortDescending),
        active: sortDirection === "desc",
      },
    ];
    return items;
  }, [
    sortDirection,
    isFrozen,
    isSystemField,
    onSortAscending,
    onSortDescending,
    onFreeze,
    onUnfreeze,
    onEditColumn,
    onDeleteColumn,
    handleMenuAction,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: "100%", height: "100%" }}
    >
      <MenuTrigger
        open={isOpen}
        onOpenChange={handleOpenChange}
        checkBeforeOpen={checkDragInProgress}
        style={{ width: "100%", height: "100%" }}
      >
        {triggerElement}
      </MenuTrigger>

      <Menu open={isOpen} onClose={handleClose} align="left" sideOffset={4}>
        {menuItems.map((item, index) => {
          if (item.type === "divider") {
            return <MenuDivider key={`divider-${index}`} />;
          }
          return (
            <MenuItem
              key={`item-${index}-${item.label}`}
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
              disabled={item.disabled}
              destructive={item.destructive}
              active={item.active}
            />
          );
        })}
      </Menu>
    </div>
  );
}

export default ColumnHeaderMenu;
