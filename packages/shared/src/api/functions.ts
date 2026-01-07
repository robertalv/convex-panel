import { ROUTES, SYSTEM_QUERIES } from "./constants";
import { normalizeToken } from "./helpers";

// UDF type used across function APIs
export type UdfType = "query" | "mutation" | "action" | "httpAction";

export interface ModuleFunction {
  name: string;
  identifier: string;
  udfType: UdfType;
  visibility: {
    kind: "public" | "internal";
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
 * Fetch the API spec for all functions in the Convex deployment
 * Optionally scoped to a specific componentId.
 */
export async function fetchFunctionSpec(
  adminClient: any,
  useMockData = false,
  componentId?: string | null,
): Promise<any[]> {
  if (useMockData) {
    return [];
  }

  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const args: any = {};
    if (componentId !== undefined && componentId !== null) {
      args.componentId = componentId;
    }

    const results = (await adminClient.query(
      SYSTEM_QUERIES.FUNCTION_API_SPEC as any,
      args,
    )) as any[];

    if (!Array.isArray(results)) {
      return [];
    }

    return results;
  } catch {
    // Don't throw - return empty array so callers can continue
    return [];
  }
}

/**
 * Fetch the list of components from the Convex deployment.
 */
export async function fetchComponents(
  adminClient: any,
  useMockData = false,
): Promise<any[]> {
  if (useMockData) {
    return [];
  }

  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const results = (await adminClient.query(
      SYSTEM_QUERIES.LIST_COMPONENTS as any,
      {},
    )) as any[];

    if (!Array.isArray(results)) {
      return [];
    }

    return results;
  } catch {
    // Components might not be available in all deployments
    return [];
  }
}

/**
 * Fetch source code for a function module from the deployment's HTTP API.
 */
export const fetchSourceCode = async (
  deploymentUrl: string,
  authToken: string,
  modulePath: string,
  componentId?: string | null,
) => {
  const params = new URLSearchParams({ path: modulePath });

  if (componentId) {
    params.append("component", componentId);
  }

  const normalizedToken = normalizeToken(authToken);
  const url = `${deploymentUrl}${ROUTES.GET_SOURCE_CODE}?${params}`;

  const response = await fetch(url, {
    headers: {
      Authorization: normalizedToken,
      "Content-Type": "application/json",
      "Convex-Client": "dashboard-0.0.0",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Failed to fetch source code: HTTP ${response.status} - ${responseText}`,
    );
  }

  const text = await response.text();

  if (text === "null" || text.trim() === "") {
    return null;
  }

  try {
    const json = JSON.parse(text);

    if (json === null || json === undefined) {
      return null;
    }
    if (typeof json === "object" && "code" in json) {
      return (json as any).code || null;
    }
    if (typeof json === "object" && "source" in json) {
      return (json as any).source || null;
    }
    if (typeof json === "string") {
      return json;
    }
  } catch {
    // Not JSON, fall through and return raw text
  }

  return text;
};

/**
 * Discover all functions from a Convex deployment.
 * Mirrors the dashboard/panel behavior, including component-aware discovery.
 */
export async function discoverFunctions(
  adminClient: any,
  useMockData = false,
): Promise<ModuleFunction[]> {
  if (useMockData || !adminClient) {
    return [];
  }

  try {
    let componentNames: string[] = [];
    let componentsList: any[] = [];
    const componentIdToNameMap: Record<string, string> = {};

    try {
      const components = await fetchComponents(adminClient, useMockData);
      if (Array.isArray(components)) {
        componentsList = components;
        componentNames = components
          .map((c: any) => c.name)
          .filter((name: string | null) => name !== null && name !== undefined);

        components.forEach((c: any) => {
          if (c.id && c.name) {
            componentIdToNameMap[c.id] = c.name;
          }
        });
      }
    } catch {
      // Components might not be available; continue without them
    }

    // Root app functions (no componentId)
    const rootApiSpec = await fetchFunctionSpec(adminClient, useMockData, null);
    rootApiSpec.forEach((fn: any) => {
      fn._fetchedComponentId = null;
    });

    const allApiSpecs: any[] = [...rootApiSpec];

    // Component functions (sequential to avoid overwhelming the API)
    for (const component of componentsList) {
      if (component.id && component.state === "active" && component.name) {
        try {
          const componentFunctions = await fetchFunctionSpec(
            adminClient,
            useMockData,
            component.id,
          );

          if (componentFunctions.length > 0) {
            componentFunctions.forEach((fn: any) => {
              fn._fetchedComponentId = component.id;
              fn._fetchedComponentName = component.name;
            });
            allApiSpecs.push(...componentFunctions);
          }
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          if (
            errorMsg.includes("componentId") ||
            errorMsg.includes("Unknown argument") ||
            errorMsg.includes("Invalid argument")
          ) {
            break;
          }
        }
      }
    }

    const apiSpec = allApiSpecs;
    const functions: ModuleFunction[] = [];

    if (!Array.isArray(apiSpec)) {
      return [];
    }

    for (const fn of apiSpec) {
      if (!fn.identifier && fn.functionType !== "HttpAction") {
        continue;
      }

      // Normalize functionType to udfType
      let udfType: UdfType = "query";
      const fnType = (fn.functionType || "").toLowerCase();
      if (
        fnType === "query" ||
        fnType === "mutation" ||
        fnType === "action" ||
        fnType === "httpaction"
      ) {
        udfType = fnType === "httpaction" ? "httpAction" : (fnType as UdfType);
      }

      // Extract name / identifier
      let identifier = fn.identifier;
      let name = fn.name as string | undefined;

      if (fn.functionType === "HttpAction") {
        if (fn.method && fn.path) {
          identifier = `${fn.method} ${fn.path}`;
          name = `${fn.method} ${fn.path}`;
        } else {
          identifier = fn.path || fn.identifier || "httpAction";
          name = fn.path || identifier;
        }
      } else if (identifier) {
        const parts = identifier.split(":");
        name = name || parts[parts.length - 1] || identifier;
      } else {
        identifier = name || "unknown";
        name = name || "unknown";
      }

      const modulePath = identifier.includes(":")
        ? identifier.substring(0, identifier.lastIndexOf(":"))
        : "";

      // Resolve componentId (prefer component name)
      let componentId: string | null = null;

      if (fn._fetchedComponentName) {
        componentId = fn._fetchedComponentName;
      } else if (fn.componentId) {
        if (fn.componentId in componentIdToNameMap) {
          componentId = componentIdToNameMap[fn.componentId];
        } else if (
          fn.componentId.length <= 20 &&
          componentNames.includes(fn.componentId)
        ) {
          componentId = fn.componentId;
        } else {
          const component = componentsList.find(
            (c: any) => c.id === fn.componentId,
          );
          if (component && component.name) {
            componentId = component.name;
          }
        }
      } else if (fn.componentPath) {
        const component = componentsList.find(
          (c: any) => c.path === fn.componentPath || c.name === fn.componentPath,
        );
        if (component && component.name) {
          componentId = component.name;
        } else if (componentNames.includes(fn.componentPath)) {
          componentId = fn.componentPath;
        }
      }

      // Fallback: infer component from identifier prefix
      if (!componentId && identifier && identifier.includes(":")) {
        for (const componentName of componentNames) {
          if (identifier.startsWith(`${componentName}:`)) {
            componentId = componentName;
            break;
          }
        }
      }

      functions.push({
        name: name || "",
        identifier,
        udfType,
        visibility: fn.visibility || { kind: "public" },
        args: fn.args
          ? typeof fn.args === "string"
            ? fn.args
            : JSON.stringify(fn.args)
          : undefined,
        returns: fn.returns
          ? typeof fn.returns === "string"
            ? fn.returns
            : JSON.stringify(fn.returns)
          : undefined,
        componentId,
        componentPath: fn.componentPath,
        file: {
          path: modulePath,
        },
      });
    }

    return functions;
  } catch {
    return [];
  }
}

/**
 * Group functions by their file path.
 */
export function groupFunctionsByPath(
  functions: ModuleFunction[],
): FunctionGroup[] {
  const groups = new Map<string, ModuleFunction[]>();

  for (const fn of functions) {
    const path = fn.file?.path || "root";
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
 * Filter functions by UDF type.
 */
export function filterFunctionsByType(
  functions: ModuleFunction[],
  udfType: Exclude<UdfType, "httpAction">,
): ModuleFunction[] {
  return functions.filter((fn) => fn.udfType === udfType);
}

/**
 * Find a function by identifier (and optional componentId).
 */
export function findFunctionByIdentifier(
  functions: ModuleFunction[],
  identifier: string,
  componentId?: string | null,
): ModuleFunction | undefined {
  return functions.find(
    (fn) =>
      fn.identifier === identifier &&
      (componentId === undefined || fn.componentId === componentId),
  );
}


