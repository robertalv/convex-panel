import { LogEntry } from "../types";

/**
 * Format JSON for display
 */
export const formatJson = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
};

/**
 * Function to generate a unique ID for each log entry
 * @param log - The log entry to generate an ID for
 * @returns A unique ID for the log entry
 */
export const getLogId = (log: LogEntry) => {
  // For mock data, use a more unique identifier
  if (log.raw && log.raw.mockData) {
    return `mock-${log.timestamp}-${log.raw.mockId || Math.random().toString(36).substring(2, 10)}`;
  }
  
  // For real logs, use the existing logic
  return `${log.timestamp}-${log.function?.request_id || ''}-${log.message || ''}`;
};


/**
 * Generate a color for a function name
 * @param name - The name of the function to generate a color for
 * @returns A color for the function name
 */
export const generateColor = (name: string): string => {
  if (name === '_rest') return '#2196F3'; // Blue for "All other queries"
  
  // Hash the function name to get a consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Format a function name for display
 * @param name - The name of the function to format
 * @returns The formatted function name
 */
export const formatFunctionName = (name: string) => {
  if (name === '_rest') return 'All other queries';
  return name.replace('.js:', ':');
};

/**
 * Get the next minute
 * @param timeStr - The time string to get the next minute for
 * @returns The next minute
 */
export const getNextMinute = (timeStr: string): string => {
  const date = new Date(`1970/01/01 ${timeStr}`);
  date.setMinutes(date.getMinutes() + 1);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};