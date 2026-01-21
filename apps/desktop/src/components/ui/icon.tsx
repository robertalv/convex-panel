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
  AlertCircleIcon,
  BookOpen02Icon,
  Book02Icon,
  PlayIcon,
  ZapIcon,
  GridTableIcon,
  Search01Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  FlowSquareIcon,
  DashboardSpeed01Icon,
  Files01Icon,
  Timer02Icon,
  CommandIcon,
  ComputerTerminal01Icon,
  Settings01Icon,
  Sun01Icon,
  Moon01Icon,
  ComputerIcon,
  Logout01Icon,
  PaintBoardIcon,
  SquareIcon,
  CheckmarkSquare02Icon,
  MoreVerticalIcon,
  ShopSignIcon,
  Store01Icon,
  ArrowUp01Icon,
  WaterfallUp01Icon,
  TradeUpIcon,
  Undo03Icon,
  ChartLineData01Icon,
  ArrowUpRight01Icon,
  ArrowUpLeft01Icon,
  Database02Icon,
  CpuIcon,
  Layers01Icon,
  HelpCircleIcon,
  Alert02Icon
} from "@hugeicons/core-free-icons";

const ICON_MAP: Record<string, IconSvgElement> = {
  layers: Layers01Icon,
  cpu: CpuIcon,
  database2: Database02Icon,
  "arrow-up-right": ArrowUpRight01Icon,
  "arrow-up-left": ArrowUpLeft01Icon,
  trendingUp: TradeUpIcon,
  "more-vertical": MoreVerticalIcon,
  "log-out": Logout01Icon,
  system: ComputerIcon,
  sun: Sun01Icon,
  moon: Moon01Icon,
  settings: Settings01Icon,
  command: CommandIcon,
  logs: LiveStreaming02Icon,
  timer: Timer02Icon,
  files: Files01Icon,
  performance: DashboardSpeed01Icon,
  flow: FlowSquareIcon,
  "panel-left-close": PanelLeftCloseIcon,
  "panel-left-open": PanelLeftOpenIcon,
  search: Search01Icon,
  grid: GridTableIcon,
  zap: ZapIcon,
  play: PlayIcon,
  book: Book02Icon,
  bookOpen: BookOpen02Icon,
  "alert-circle": AlertCircleIcon,
  "alert-triangle": Alert02Icon,
  check: Tick02Icon,
  "external-link": LinkSquare01Icon,
  spinner: Loading03Icon,
  copy: Copy02Icon,
  activity: Activity03Icon,
  close: Cancel01Icon,
  share: Share08Icon,
  barChart: WaterfallUp01Icon,
  "arrow-up-down": ArrowUpDownIcon,
  "arrow-up": ArrowUp01Icon,
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
  "chevron-right": ArrowRight01Icon,
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
  terminal: ComputerTerminal01Icon,
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
  palette: PaintBoardIcon,
  square: SquareIcon,
  "square-check": CheckmarkSquare02Icon,
  store: ShopSignIcon,
  marketplace: Store01Icon,
  undo: Undo03Icon,
  lineChart: ChartLineData01Icon,
  "help-circle": HelpCircleIcon,
};

export interface IconProps {
  name?: string;
  icon?: IconSvgElement;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

function getIconComponent(name: string): IconSvgElement | null {
  if (ICON_MAP[name]) {
    return ICON_MAP[name];
  }
  return null;
}

export function Icon({
  name,
  icon,
  size = 24,
  color = "currentColor",
  strokeWidth = 1.5,
  className,
  style,
}: IconProps) {
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

export { IconSvgElement };

export default Icon;
