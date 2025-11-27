import { fetchFunctionSpec } from './api';

export interface ModuleFunction {
  name: string;
  identifier: string;
  udfType: 'query' | 'mutation' | 'action' | 'httpAction';
  visibility: {
    kind: 'public' | 'internal';
  };
  args?: string; // JSON string of args validator
  returns?: string; // JSON string of return validator
  componentId?: string | null;
  componentPath?: string;
  file: {
    path: string;
  };
}

export interface FunctionGroup {
  path: string;
  functions: ModuleFunction[];
}

/**
 * Fetch and parse available functions from Convex
 */
export async function discoverFunctions(
  adminClient: any,
  useMockData = false
): Promise<ModuleFunction[]> {
  if (useMockData) {
    return [];
  }

  if (!adminClient) {
    return [];
  }

  try {
    // Get components list first
    let componentNames: string[] = [];
    let componentsList: any[] = [];
    let componentIdToNameMap: Record<string, string> = {};
    try {
      const components = await adminClient.query("_system/frontend/components:list" as any, {}).catch(() => []);
      if (Array.isArray(components)) {
        componentsList = components;
        // Only include component names (not IDs) - component functions use names in identifiers
        componentNames = components
          .map((c: any) => c.name)
          .filter((name: string | null) => name !== null && name !== undefined);
        
        // Create a map from component ID to name for fallback lookups
        components.forEach((c: any) => {
          if (c.id && c.name) {
            componentIdToNameMap[c.id] = c.name;
          }
        });
        
      }
    } catch (err) {
      // Components might not be available, continue without them
    }
    
    // Fetch functions for root app (no componentId)
    const rootApiSpec = await fetchFunctionSpec(adminClient, useMockData, null);
    // Mark root functions with null componentId
    rootApiSpec.forEach((fn: any) => {
      fn._fetchedComponentId = null;
    });
    
    // Try to fetch functions for each component
    const allApiSpecs: any[] = [...rootApiSpec];
    let componentQuerySupported = false;
    let componentQueryAttempts = 0;
    
    // Fetch component functions sequentially to avoid overwhelming the API
    for (const component of componentsList) {
      if (component.id && component.state === 'active' && component.name) {
        componentQueryAttempts++;
        try {
          const componentFunctions = await fetchFunctionSpec(adminClient, useMockData, component.id);
          
          if (componentFunctions.length > 0) {
            // Mark these functions with the component name (used in identifiers) and ID
            componentFunctions.forEach((fn: any) => {
              fn._fetchedComponentId = component.id;
              fn._fetchedComponentName = component.name;
            });
            allApiSpecs.push(...componentFunctions);
            componentQuerySupported = true;
          }
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          
          // If we get an error about unknown argument, the API doesn't support componentId
          if (errorMsg.includes('componentId') || errorMsg.includes('Unknown argument') || errorMsg.includes('Invalid argument')) {
            componentQuerySupported = false;
            break; // No need to try other components
          }
        }
      }
    }
    
    const apiSpec = allApiSpecs;
    const functions: ModuleFunction[] = [];
    
    // The API spec returns an array of function specifications directly
    // Each function has: identifier, functionType, visibility, args, returns
    // HTTP actions have method and path instead of standard identifier
    
    if (!Array.isArray(apiSpec)) {
      return [];
    }

    for (const fn of apiSpec) {
      // Skip if no identifier (unless it's an HTTP action)
      if (!fn.identifier && fn.functionType !== 'HttpAction') {
        continue;
      }
      
      // Normalize functionType to udfType
      let udfType: 'query' | 'mutation' | 'action' | 'httpAction' = 'query';
      const fnType = (fn.functionType || '').toLowerCase();
      if (fnType === 'query' || fnType === 'mutation' || fnType === 'action' || fnType === 'httpaction') {
        udfType = fnType === 'httpaction' ? 'httpAction' : fnType as 'query' | 'mutation' | 'action';
      }
      
      // Extract name from identifier (e.g., "module:functionName" -> "functionName")
      // For HTTP actions, use path as identifier
      let identifier = fn.identifier;
      let name = fn.name;
      
      if (fn.functionType === 'HttpAction') {
        // HTTP actions use method + path as identifier
        if (fn.method && fn.path) {
          identifier = `${fn.method} ${fn.path}`;
          name = `${fn.method} ${fn.path}`;
        } else {
          identifier = fn.path || fn.identifier || 'httpAction';
          name = fn.path || identifier;
        }
      } else if (identifier) {
        // Extract function name from identifier (everything after the last colon)
        const parts = identifier.split(':');
        name = name || parts[parts.length - 1] || identifier;
      } else {
        // Fallback if no identifier
        identifier = name || 'unknown';
        name = name || 'unknown';
      }
      
      // Extract module path from identifier (everything before the last colon)
      const modulePath = identifier.includes(':') 
        ? identifier.substring(0, identifier.lastIndexOf(':'))
        : '';
      
      // Extract componentId from API response or identifier pattern
      // Priority: 1) _fetchedComponentName (from component query), 2) componentId from API, 3) componentPath from API, 4) identifier prefix matching
      let componentId: string | null = null;
      
      // First priority: If this function was fetched via a component-specific query, use that component name
      if (fn._fetchedComponentName) {
        componentId = fn._fetchedComponentName;
      }
      // Second priority: Check if the API provided componentId or componentPath
      else if (fn.componentId) {
        // If it's a component ID (long string), map it to component name
        if (fn.componentId in componentIdToNameMap) {
          componentId = componentIdToNameMap[fn.componentId];
        } else if (fn.componentId.length <= 20 && componentNames.includes(fn.componentId)) {
          // If it's short and matches a component name, use it directly
          componentId = fn.componentId;
        } else {
          // Try to find component by ID in the list
          const component = componentsList.find((c: any) => c.id === fn.componentId);
          if (component && component.name) {
            componentId = component.name;
          }
        }
      } else if (fn.componentPath) {
        // Check if componentPath matches a component name
        const component = componentsList.find((c: any) => c.path === fn.componentPath || c.name === fn.componentPath);
        if (component && component.name) {
          componentId = component.name;
        } else if (componentNames.includes(fn.componentPath)) {
          componentId = fn.componentPath;
        }
      }
      
      // Fallback: Check if identifier starts with a component name prefix
      // Component functions: "betterAuth:adapter:create" or "autumn:check"
      // App functions: "auth.js:createUser" or "autumn.js:check"
      if (!componentId && identifier && identifier.includes(':')) {
        for (const componentName of componentNames) {
          if (identifier.startsWith(`${componentName}:`)) {
            componentId = componentName;
            break;
          }
        }
      }
      
      functions.push({
        name,
        identifier,
        udfType,
        visibility: fn.visibility || { kind: 'public' },
        args: fn.args ? (typeof fn.args === 'string' ? fn.args : JSON.stringify(fn.args)) : undefined,
        returns: fn.returns ? (typeof fn.returns === 'string' ? fn.returns : JSON.stringify(fn.returns)) : undefined,
        componentId,
        componentPath: fn.componentPath,
        file: {
          path: modulePath,
        },
      });
    }

    return functions;
  } catch (error) {
    return [];
  }
}

/**
 * Group functions by their file path
 */
export function groupFunctionsByPath(functions: ModuleFunction[]): FunctionGroup[] {
  const groups = new Map<string, ModuleFunction[]>();

  for (const fn of functions) {
    const path = fn.file?.path || 'root';
    if (!groups.has(path)) {
      groups.set(path, []);
    }
    groups.get(path)!.push(fn);
  }

  return Array.from(groups.entries()).map(([path, funcs]) => ({
    path,
    functions: funcs,
  }));
}

/**
 * Filter functions by UDF type
 */
export function filterFunctionsByType(
  functions: ModuleFunction[],
  udfType: 'query' | 'mutation' | 'action'
): ModuleFunction[] {
  return functions.filter(fn => fn.udfType === udfType);
}

/**
 * Find a function by identifier
 */
export function findFunctionByIdentifier(
  functions: ModuleFunction[],
  identifier: string,
  componentId?: string | null
): ModuleFunction | undefined {
  return functions.find(
    fn => fn.identifier === identifier && 
    (componentId === undefined || fn.componentId === componentId)
  );
}


