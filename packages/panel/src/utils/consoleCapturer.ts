import { LogEntry } from '../types';

// Type for console methods
type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

// Type for console log handlers
type ConsoleLogHandler = (entry: LogEntry) => void;

// Store original console methods
const originalConsoleMethods: Record<ConsoleMethod, any> = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Store registered handlers
const handlers: ConsoleLogHandler[] = [];

// Flag to track if console is already overridden
let isConsoleOverridden = false;

/**
 * Override console methods to capture logs
 */
const overrideConsoleMethods = () => {
  if (isConsoleOverridden) return;

  // Debug: Log when console methods are being overridden
  originalConsoleMethods.log('Console methods are being overridden for capturing');

  // Override each console method
  Object.keys(originalConsoleMethods).forEach((method) => {
    const consoleMethod = method as ConsoleMethod;
    
    console[consoleMethod] = (...args: any[]) => {
      // Call original method
      originalConsoleMethods[consoleMethod](...args);
      
      // Create log entry
      const logEntry: LogEntry = {
        timestamp: Date.now(),
        topic: 'frontend',
        message: args.map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return String(arg);
          }
        }).join(' '),
        log_level: mapConsoleMethodToLogLevel(consoleMethod),
        raw: args
      };
      
      // Debug: Log when a handler is called (only for non-debug logs to avoid infinite loop)
      if (consoleMethod !== 'debug') {
        originalConsoleMethods.debug('Console log captured:', logEntry);
      }
      
      // Notify handlers
      handlers.forEach(handler => handler(logEntry));
    };
  });
  
  isConsoleOverridden = true;
};

/**
 * Restore original console methods
 */
const restoreConsoleMethods = () => {
  if (!isConsoleOverridden) return;
  
  // Debug: Log when console methods are being restored
  originalConsoleMethods.log('Console methods are being restored');
  
  Object.keys(originalConsoleMethods).forEach((method) => {
    const consoleMethod = method as ConsoleMethod;
    console[consoleMethod] = originalConsoleMethods[consoleMethod];
  });
  
  isConsoleOverridden = false;
};

/**
 * Map console method to log level
 */
const mapConsoleMethodToLogLevel = (method: ConsoleMethod): string => {
  switch (method) {
    case 'error': return 'error';
    case 'warn': return 'warn';
    case 'info': return 'info';
    case 'debug': return 'debug';
    default: return 'info';
  }
};

/**
 * Register a handler for console logs
 * @param handler Function to call with captured log entries
 */
export const registerConsoleLogHandler = (handler: ConsoleLogHandler) => {
  handlers.push(handler);
  
  // Debug: Log when a handler is registered
  originalConsoleMethods.log('Console log handler registered, total handlers:', handlers.length);
  
  // Override console methods if not already done
  if (!isConsoleOverridden) {
    overrideConsoleMethods();
  }
  
  // Return unregister function
  return () => {
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      
      // Debug: Log when a handler is unregistered
      originalConsoleMethods.log('Console log handler unregistered, remaining handlers:', handlers.length);
    }
    
    // Restore original console methods if no handlers left
    if (handlers.length === 0) {
      restoreConsoleMethods();
    }
  };
};

export default {
  registerConsoleLogHandler
}; 