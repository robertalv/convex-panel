import React from 'react';
import {
  Activity,
  Database,
  Code2,
  FileCode,
  CalendarClock,
  ScrollText,
  Puzzle,
  Settings,
} from 'lucide-react';
import type { TabId } from '../../types/tabs';

export interface TabDefinition {
  id: TabId;
  icon: React.ReactNode;
  label: string;
}

export const TAB_DEFINITIONS: TabDefinition[] = [
  { id: 'health', icon: <Activity size={14} />, label: 'Health' },
  { id: 'data', icon: <Database size={14} />, label: 'Data' },
  { id: 'functions', icon: <Code2 size={14} />, label: 'Functions' },
  { id: 'files', icon: <FileCode size={14} />, label: 'Files' },
  { id: 'schedules', icon: <CalendarClock size={14} />, label: 'Schedules' },
  { id: 'logs', icon: <ScrollText size={14} />, label: 'Logs' },
  { id: 'components', icon: <Puzzle size={14} />, label: 'Components' },
  { id: 'settings', icon: <Settings size={14} />, label: 'Settings' },
];
