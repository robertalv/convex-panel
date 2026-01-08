/**
 * Network-related types
 */

import React from 'react';
import type { ThemeClasses, ConvexPanelSettings } from './common';

export interface NetworkCall {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  size: string;
  time: number;
  type: string;
  initiator: string;
  timestamp: number;
  startTime: number;
  endTime: number;
  duration: number;
  isError: boolean;
  request: {
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    headers: Record<string, string>;
    body?: any;
  };
}

export interface NetworkRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    calls: NetworkCall[];
    isDetailPanelOpen: boolean;
    mergedTheme: any;
    handleCallSelect: (call: NetworkCall) => void;
    onRowMouseEnter?: (callId: string, event: React.MouseEvent) => void;
    onRowMouseLeave?: () => void;
  };
}

export interface NetworkTableProps {
  mergedTheme: ThemeClasses;
  filteredCalls: NetworkCall[];
  containerSize: { width: number; height: number };
  isDetailPanelOpen: boolean;
  selectedCall: NetworkCall | null;
  setIsDetailPanelOpen: (isOpen: boolean) => void;
  handleCallSelect: (call: NetworkCall) => void;
  onRowMouseEnter?: (callId: string, event: React.MouseEvent) => void;
  onRowMouseLeave?: () => void;
}

export interface NetworkPanelProps {
  mergedTheme: ThemeClasses;
  settings?: ConvexPanelSettings;
  containerSize: { width: number; height: number };
}

