import type { Value } from 'convex/values';
import { getAdminClientInfo } from '../adminClient';
import type { UdfType } from '../../types/convex';
import { ROUTES } from '../constants';

export interface FunctionResult {
  success: boolean;
  value?: any;
  errorMessage?: string;
  errorData?: any;
  logLines?: LogLine[];
}

export interface LogLine {
  level: string;
  message: string;
  timestamp?: number;
}

/**
 * Execute a Convex function via adminClient
 */
export async function executeFunction(
  adminClient: any,
  functionPath: string,
  args: Record<string, Value> = {},
  udfType: UdfType,
  impersonatedUser?: any,
  componentId?: string | null
): Promise<FunctionResult> {
  if (!adminClient) {
    return {
      success: false,
      errorMessage: 'Admin client not available',
      logLines: [],
    };
  }

  try {
    let result: any;
    let logLines: LogLine[] = [];
    
    // Store original auth state to restore later
    // Get admin key using the centralized utility
    const { adminKey } = getAdminClientInfo(adminClient);
    
    // Set user impersonation if provided
    // According to examples: client.setAdminAuth(adminKey, identity)
    // When impersonating, we pass both adminKey and the user identity
    // NOTE: Admin clients don't support setAuth - only setAdminAuth
    if (impersonatedUser && adminKey) {
      if (typeof (adminClient as any).setAdminAuth === 'function') {
        // Set admin auth with user impersonation
        (adminClient as any).setAdminAuth(adminKey, impersonatedUser);
      }
      // Don't use setAuth on admin clients - it requires fetchToken which doesn't exist
    } else if (!impersonatedUser && adminKey) {
      // Clear impersonation if not provided - restore to just admin auth
      if (typeof (adminClient as any).setAdminAuth === 'function') {
        (adminClient as any).setAdminAuth(adminKey);
      }
      // Don't use setAuth on admin clients - it requires fetchToken which doesn't exist
    }

    try {
      // Execute the function based on type
      if (udfType === 'query') {
        // Check if componentId is supported
        if (componentId !== undefined && componentId !== null) {
          // Some clients support componentId as a third parameter
          result = await adminClient.query(functionPath as any, args, { componentId });
        } else {
          result = await adminClient.query(functionPath as any, args);
        }
      } else if (udfType === 'mutation') {
        if (componentId !== undefined && componentId !== null) {
          result = await adminClient.mutation(functionPath as any, args, { componentId });
        } else {
          result = await adminClient.mutation(functionPath as any, args);
        }
      } else if (udfType === 'action') {
        if (componentId !== undefined && componentId !== null) {
          result = await adminClient.action(functionPath as any, args, { componentId });
        } else {
          result = await adminClient.action(functionPath as any, args);
        }
      } else {
        return {
          success: false,
          errorMessage: `Unknown UDF type: ${udfType}`,
          logLines: [],
        };
      }
      
      // Extract log lines from result if available
      // Convex responses may include logLines in the result object
      if (result && typeof result === 'object') {
        if (Array.isArray(result.logLines)) {
          logLines = result.logLines.map((log: any) => ({
            level: log.level || 'info',
            message: log.message || String(log),
            timestamp: log.timestamp || Date.now(),
          }));
        } else if (result.logs && Array.isArray(result.logs)) {
          logLines = result.logs.map((log: any) => ({
            level: log.level || log.log_level || 'info',
            message: log.message || log.text || String(log),
            timestamp: log.timestamp || Date.now(),
          }));
        }
        
        // If result has a value property, use that as the actual result
        if ('value' in result) {
          result = result.value;
        }
      }
      
      return {
        success: true,
        value: result,
        logLines,
      };
    } finally {
      // Restore original auth state (admin only, no impersonation)
      // NOTE: Admin clients don't support setAuth - only setAdminAuth
      if (adminKey && typeof (adminClient as any).setAdminAuth === 'function') {
        (adminClient as any).setAdminAuth(adminKey);
      }
      // Don't use setAuth on admin clients - it requires fetchToken which doesn't exist
    }
  } catch (error: any) {
    // Extract log lines from error if available
    let logLines: LogLine[] = [];
    if (error.logLines && Array.isArray(error.logLines)) {
      logLines = error.logLines.map((log: any) => ({
        level: log.level || 'error',
        message: log.message || String(log),
        timestamp: log.timestamp || Date.now(),
      }));
    }
    
    return {
      success: false,
      errorMessage: error.message || 'An error occurred while executing the function',
      errorData: error,
      logLines,
    };
  }
}

/**
 * Execute a custom query from compiled code
 * Uses the /api/run_test_function HTTP endpoint
 */
export async function executeCustomQuery(
  adminClient: any,
  compiledCode: string,
  componentId?: string | null,
  args: Record<string, Value> = {},
  providedDeploymentUrl?: string
): Promise<FunctionResult> {
  if (!adminClient) {
    return {
      success: false,
      errorMessage: 'Admin client not available',
      logLines: [],
    };
  }

  try {
    // Get deployment URL and admin key using centralized utility
    const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);
    const { deploymentUrl, adminKey } = clientInfo;

    // Validate that we have both deploymentUrl and adminKey
    if (!deploymentUrl) {
      return {
        success: false,
        errorMessage: 'Deployment URL not available. Please ensure the admin client is properly configured.',
        logLines: [],
      };
    }

    if (!adminKey) {
      return {
        success: false,
        errorMessage: 'Admin key not available. Please ensure authentication is properly configured.',
        logLines: [],
      };
    }

    // Make HTTP POST request to /api/run_test_function
    const response = await fetch(`${deploymentUrl}${ROUTES.RUN_TEST_FUNCTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bundle: {
          path: 'testQuery.js',
          source: compiledCode,
        },
        adminKey: adminKey,
        args: args,
        format: 'convex_encoded_json',
        ...(componentId && { componentId }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        errorMessage: `HTTP ${response.status}: ${errorText}`,
        logLines: [],
      };
    }

    const result = await response.json();

    // Parse log lines - they come as strings like "[LOG] 'message'" or "[ERROR] 'message'"
    const parseLogLine = (logString: string): LogLine => {
      const logMatch = logString.match(/^\[(LOG|ERROR|WARN|INFO)\]\s*(.+)$/);
      if (logMatch) {
        const level = logMatch[1].toLowerCase();
        // Remove quotes from message if present
        let message = logMatch[2].trim();
        if ((message.startsWith("'") && message.endsWith("'")) || 
            (message.startsWith('"') && message.endsWith('"'))) {
          message = message.slice(1, -1);
        }
        return {
          level: level === 'log' ? 'info' : level,
          message,
          timestamp: Date.now(),
        };
      }
      // Fallback: treat as info log
      return {
        level: 'info',
        message: logString,
        timestamp: Date.now(),
      };
    };

    // The response should have status, value, errorMessage, errorData, and logLines
    if (result && result.status === 'success') {
      return {
        success: true,
        value: result.value,
        logLines: result.logLines ? result.logLines.map((log: string) => parseLogLine(log)) : [],
      };
    } else {
      return {
        success: false,
        errorMessage: result?.errorMessage || 'Function execution failed',
        errorData: result?.errorData,
        logLines: result?.logLines ? result.logLines.map((log: string) => parseLogLine(log)) : [],
      };
    }
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error.message || 'An error occurred while executing the custom query',
      errorData: error,
      logLines: [],
    };
  }
}

