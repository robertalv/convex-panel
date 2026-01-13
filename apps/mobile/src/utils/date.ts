import { format, formatDistance, formatRelative } from 'date-fns';

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true });
}

/**
 * Format date for display (e.g., "Jan 1, 2024 at 12:00 PM")
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy \'at\' h:mm a');
}

/**
 * Format date relative to now (e.g., "today at 3:00 PM")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatRelative(d, new Date());
}

/**
 * Check if date is within the last 24 hours
 */
export function isRecent(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);
  return d > dayAgo;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`;
  }
  return `${(ms / 3600000).toFixed(1)}h`;
}
