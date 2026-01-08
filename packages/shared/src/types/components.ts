/**
 * Component prop types and component catalog types
 */

import React from 'react';
import { ConvexReactClient } from "convex/react";
import { ConvexClient } from 'convex/browser';
import { LogType } from './logs';
import type { TabTypes } from './tabs';
import type { ThemeClasses, ButtonPosition } from './common';
import type { LogEntry } from './logs';
import type { OAuthConfig } from './panel';

// Component catalog types
export type ComponentCategory = 'Durable Functions' | 'Database' | 'Integrations' | 'Backend';

export interface ComponentInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  weeklyDownloads: number;
  developer: string;
  category: ComponentCategory;
  npmPackage?: string;
  imageUrl?: string;
  longDescription?: string;
  features?: string[];
  repoUrl?: string;
  packageUrl?: string;
  docsUrl?: string;
  docsLinks?: Array<{ label: string; url: string }>;
  stackPostUrl?: string;
  exampleCommands?: string[];
  bugReportUrl?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  documentationSections?: Array<{
    heading: string;
    subsections?: Array<{
      subheading?: string;
      paragraphs?: string[];
      code?: string;
    }>;
    paragraphs?: string[];
    code?: string;
    codeBlocks?: Array<{
      code?: string;
      note?: string;
    }>;
    language?: string;
  }>;
}

// Component prop types
export type ButtonProps = {
  convexUrl?: string;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  theme?: ThemeClasses | undefined;
  maxStoredLogs?: number;
  convex?: ConvexReactClient;
  oauthConfig?: OAuthConfig;
  deployKey?: string;
  accessToken?: string;
  deployUrl?: string;
  buttonPosition?: ButtonPosition;
  useMockData?: boolean;
}

export interface ContainerProps {
  isOpen: boolean;
  toggleOpen: () => void;
  onToggle?: (isOpen: boolean) => void;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  theme?: ThemeClasses;
  maxStoredLogs?: number;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  containerSize: { width: number; height: number };
  setContainerSize: (size: { width: number; height: number }) => void;
  dragControls: any;
  convex: ConvexReactClient;
  adminClient: ConvexClient | null;
  initialActiveTab: TabTypes;
  accessToken: string;
  deployUrl?: string;
  useMockData?: boolean;
}

export interface HealthContainerProps {
  deploymentUrl: string;
  authToken: string;
  convexVersion?: string;
  useMockData?: boolean;
}

export interface CacheHitData {
  timestamp: string;
  values: Record<string, number | null>;
}

export interface CacheHitRateChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
  useMockData?: boolean;
}

export interface TimeStamp {
  secs_since_epoch: number;
  nanos_since_epoch: number;
}

export interface FailureData {
  timestamp: string;
  values: Record<string, number | null>;
}

export interface FailureRateChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
  useMockData?: boolean;
}

export interface SchedulerLagChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
  showChart: boolean;
  useMockData?: boolean;
}

export interface SchedulerStatusProps {
  status: 'on_time' | 'delayed' | 'error';
  message: string;
}

export type TimeSeriesData = [TimeStamp, number | null][];
export type APIResponse = [string, TimeSeriesData][];
