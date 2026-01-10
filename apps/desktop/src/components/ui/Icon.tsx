/**
 * Icon Component
 *
 * Global icon component using Hugeicons for consistent iconography throughout the app
 *
 * Supports both string names (e.g., "analytics") and direct icon components
 */

import React, { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Analytics01Icon,
  Notification01Icon,
  TableIcon,
  UserCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Tick02Icon,
  Rocket01Icon,
  SourceCodeIcon,
  ArrowDown01Icon,
  Globe02Icon,
  LiveStreaming02Icon,
  Edit01Icon,
  PreferenceHorizontalIcon,
  SortByUp01Icon,
  ListViewIcon,
  TextIcon,
  GridIcon,
  ToggleOnIcon,
  ToggleOffIcon,
  Link02Icon,
  CodeIcon,
  CancelCircleIcon,
  File02Icon,
  Clock01Icon,
  ArrowUpDownIcon,
  Cancel01Icon,
  SortByDown01Icon,
  Share08Icon,
  Activity03Icon,
  Copy02Icon,
  Loading03Icon,
  LinkSquare01Icon,
  GithubIcon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";

/**
 * Custom icon name mappings
 * Map friendly string names to specific icon components
 */
const ICON_MAP: Record<string, IconSvgElement> = {
  "alert-circle": AlertCircleIcon,
  check: Tick02Icon,
  "external-link": LinkSquare01Icon,
  spinner: Loading03Icon,
  copy: Copy02Icon,
  activity: Activity03Icon,
  close: Cancel01Icon,
  share: Share08Icon,
  "arrow-up-down": ArrowUpDownIcon,
  clock: Clock01Icon,
  clear: CancelCircleIcon,
  list: ListViewIcon,
  filter: PreferenceHorizontalIcon,
  sort: ArrowUpDownIcon,
  sortAsc: SortByUp01Icon,
  sortDesc: SortByDown01Icon,
  health: Analytics01Icon,
  analytics: Analytics01Icon,
  notifications: Notification01Icon,
  table: TableIcon,
  database: TableIcon,
  user: UserCircleIcon,
  globe: Globe02Icon,
  "chevron-back": ArrowLeft01Icon,
  "chevron-forward": ArrowRight01Icon,
  "chevron-down": ArrowDown01Icon,
  "arrow-left": ArrowLeft01Icon,
  "arrow-right": ArrowRight01Icon,
  "checkmark-circle": CheckmarkCircle01Icon,
  checkmark: Tick02Icon,
  rocket: Rocket01Icon,
  code: SourceCodeIcon,
  signal: LiveStreaming02Icon,
  pencil: Edit01Icon,
  edit: Edit01Icon,
  terminal: SourceCodeIcon,
  "field-string": TextIcon,
  "field-number": GridIcon,
  "field-boolean": ToggleOffIcon,
  "field-id": Link02Icon,
  "field-object": CodeIcon,
  "field-array": ListViewIcon,
  "toggle-on": ToggleOnIcon,
  "toggle-off": ToggleOffIcon,
  "file-text": File02Icon,
  "circle-dot": UserCircleIcon,
  type: TextIcon,
  hash: GridIcon,
  "toggle-left": ToggleOffIcon,
  "circle-slash": CancelCircleIcon,
  braces: CodeIcon,
  fingerprint: Link02Icon,
  github: GithubIcon,
};

export interface IconProps {
  /**
   * Icon name as a string (e.g., "health" maps to Analytics01Icon via ICON_MAP)
   * OR the icon component directly from @hugeicons/core-free-icons
   *
   * Either `name` or `icon` must be provided.
   *
   * Custom mappings are defined in ICON_MAP. If not found there,
   * it will try the automatic pattern: "name" -> "Name01Icon"
   *
   * @example
   * // Using custom mapped name
   * <Icon name="health" />
   *
   * // Using automatic pattern (if not in ICON_MAP)
   * <Icon name="analytics" />
   *
   * // Using icon component directly
   * <Icon icon={Analytics01Icon} />
   */
  name?: string;
  icon?: IconSvgElement;

  /**
   * Size of the icon in pixels
   * @default 24
   */
  size?: number;

  /**
   * Color of the icon
   * @default 'currentColor'
   */
  color?: string;

  /**
   * Stroke width of the icon
   * @default 1.5
   */
  strokeWidth?: number;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

/**
 * Gets the icon component by name
 * Checks custom ICON_MAP for the provided name
 */
function getIconComponent(name: string): IconSvgElement | null {
  // Check custom mapping
  if (ICON_MAP[name]) {
    return ICON_MAP[name];
  }

  // If not found, return null (will show warning)
  return null;
}

/**
 * Global Icon component using Hugeicons
 *
 * @example
 * ```tsx
 * import { Icon } from '@/components/ui/Icon';
 *
 * // Using string name (recommended)
 * <Icon name="analytics" size={24} color="black" />
 * <Icon name="notification" />
 *
 * // Using icon component directly (also supported)
 * import { Notification03Icon } from '@hugeicons/core-free-icons';
 * <Icon icon={Notification03Icon} size={24} color="black" />
 * ```
 */
export function Icon({
  name,
  icon,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.5,
  className,
  style,
}: IconProps) {
  // Resolve icon component from name or use provided icon
  const iconComponent = useMemo(() => {
    if (icon) {
      return icon;
    }
    if (name) {
      const resolved = getIconComponent(name);
      if (!resolved) {
        console.warn(
          `Icon "${name}" not found in ICON_MAP. Available icons: ${Object.keys(ICON_MAP).join(", ")}`,
        );
        return null;
      }
      return resolved;
    }
    console.warn('Icon component requires either "name" or "icon" prop');
    return null;
  }, [name, icon]);

  if (!iconComponent) {
    return null;
  }

  return (
    <HugeiconsIcon
      icon={iconComponent}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}

export default Icon;
