import { ThemeClasses } from ".";

import { LogEntry } from ".";

import { ReactNode } from "react";
import { LogType } from ".";
import { ConvexReactClient } from "convex/react";

// Theme interface
export interface ThemeClasses {
  container?: string;
  header?: string;
  toolbar?: string;
  table?: string;
  tableHeader?: string;
  tableRow?: string;
  text?: string;
  button?: string;
  input?: string;
  successText?: string;
  errorText?: string;
  warningText?: string;
}

// Button props
export type ButtonProps = {
  children?: ReactNode;
  convexUrl?: string;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  onToggle?: (isOpen: boolean) => void;
  theme?: ThemeClasses | undefined;
  buttonIcon?: string;
  maxStoredLogs?: number;
  convex?: ConvexReactClient;
  DEPLOY_KEY: string; // Required
  CLOUD_URL?: string;
}