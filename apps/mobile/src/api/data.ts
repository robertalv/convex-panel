/**
 * Data API Client
 * REST API client for Convex data operations (tables, documents, mutations)
 */

import type {
  TableDefinition,
  TableDocument,
  FilterExpression,
} from "../features/data/types";
import { buildConvexFilterString } from "../features/filters/factory";

export interface PaginatedDocumentsResponse {
  page: TableDocument[];
  hasMore: boolean;
  continueCursor: string | null;
}

// System query names
const SYSTEM_QUERIES = {
  GET_TABLE_MAPPING: "_system/frontend/getTableMapping",
  PAGINATED_TABLE_DOCUMENTS: "_system/frontend/paginatedTableDocuments:default",
  PATCH_DOCUMENTS_FIELDS: "_system/frontend/patchDocumentsFields:default",
  DELETE_DOCUMENTS: "_system/frontend/deleteDocuments:default",
  ADD_DOCUMENT: "_system/frontend/addDocument:default",
};

/**
 * Fetch table schemas from Convex deployment
 * Requires Convex admin token (from dashboard session, not Auth0 token)
 * Updated to properly parse /api/shapes2 response
 */
export async function fetchTables(
  deploymentUrl: string,
  accessToken?: string,
): Promise<TableDefinition> {
  try {
    console.log(
      "[Data API] Fetching tables from:",
      `${deploymentUrl}/api/shapes2`,
    );

    // Build headers with Convex admin authorization
    const headers: HeadersInit = {
      "convex-client": "dashboard-0.0.0",
    };

    // Add Convex admin token if available
    if (accessToken) {
      headers.authorization = `Convex ${accessToken}`;
    }

    const response = await fetch(`${deploymentUrl}/api/shapes2`, {
      headers,
    });

    console.log(
      "[Data API] Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Data API] Response error:", errorText);
      throw new Error(
        `Failed to fetch tables: ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log(
      "[Data API] Full response data (first 500 chars):",
      JSON.stringify(data).substring(0, 500),
    );

    // The /api/shapes2 response IS the tables object directly
    // Desktop behavior: Include all tables except system tables (starting with _)
    // Don't filter by type - show all tables even if type is "Never"
    const tables: TableDefinition = {};
    for (const [tableName, schema] of Object.entries(data)) {
      // Skip system tables only
      if (tableName.startsWith("_")) {
        continue;
      }
      // Include ALL other tables (Object, Never, Union, etc.)
      if (typeof schema === "object" && schema !== null) {
        tables[tableName] = schema as any;
      }
    }

    console.log("[Data API] Parsed tables:", {
      totalTablesInResponse: Object.keys(data).length,
      filteredTables: Object.keys(tables).length,
      tableNames: Object.keys(tables),
      sampleSchema:
        Object.keys(tables).length > 0
          ? {
              name: Object.keys(tables)[0],
              schema: tables[Object.keys(tables)[0]],
            }
          : null,
    });

    return tables;
  } catch (error) {
    console.error("[Data API] Error fetching tables:", error);
    throw error;
  }
}

/**
 * Fetch documents from a table with pagination and filtering
 */
export async function fetchDocuments(
  deploymentUrl: string,
  tableName: string,
  numItems: number = 50,
  cursor?: string,
  filters?: FilterExpression[],
  sort?: { field: string; direction: "asc" | "desc" } | null,
  accessToken?: string,
): Promise<PaginatedDocumentsResponse> {
  try {
    // Build filter string before constructing the request body to avoid TDZ issues
    const filterString = buildConvexFilterString(filters);
    const hasFilters = !!filterString;

    // Build request body
    const body: any = {
      paginationOpts: {
        cursor: cursor || null,
        numItems,
        id: Date.now(), // Unique request ID
      },
      table: tableName,
      filters: filterString,
    };

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers.authorization = `Convex ${accessToken}`;
    }

    // Call the paginatedTableDocuments system query
    const response = await fetch(`${deploymentUrl}/api/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        path: SYSTEM_QUERIES.PAGINATED_TABLE_DOCUMENTS,
        args: [body],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch documents: ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();

    // Parse response
    const data = result.value || result;
    const page = data.page || [];
    const hasMore = data.hasMore || false;
    const continueCursor = data.continueCursor || null;

    return {
      page,
      hasMore,
      continueCursor,
    };
  } catch (error) {
    console.error("[Data API] Error fetching documents:", error);
    throw error;
  }
}

/**
 * Add a new document to a table
 */
export async function addDocument(
  deploymentUrl: string,
  accessToken: string,
  tableName: string,
  document: Record<string, any>,
  componentId?: string | null,
): Promise<string> {
  try {
    const body: any = {
      table: tableName,
      document,
    };

    if (componentId) {
      body.componentId = componentId;
    }

    const response = await fetch(`${deploymentUrl}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Convex ${accessToken}`,
      },
      body: JSON.stringify({
        path: SYSTEM_QUERIES.ADD_DOCUMENT,
        args: [body],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to add document: ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    return result.value || result;
  } catch (error) {
    console.error("[Data API] Error adding document:", error);
    throw error;
  }
}

/**
 * Patch (update) specific fields of documents
 */
export async function patchDocumentFields(
  deploymentUrl: string,
  accessToken: string,
  tableName: string,
  documentIds: string[],
  fields: Record<string, any>,
  componentId?: string | null,
): Promise<void> {
  try {
    const body: any = {
      table: tableName,
      ids: documentIds,
      fields,
    };

    if (componentId) {
      body.componentId = componentId;
    }

    const response = await fetch(`${deploymentUrl}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Convex ${accessToken}`,
      },
      body: JSON.stringify({
        path: SYSTEM_QUERIES.PATCH_DOCUMENTS_FIELDS,
        args: [body],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to patch documents: ${response.statusText} - ${errorText}`,
      );
    }
  } catch (error) {
    console.error("[Data API] Error patching documents:", error);
    throw error;
  }
}

/**
 * Delete documents from a table
 */
export async function deleteDocuments(
  deploymentUrl: string,
  accessToken: string,
  tableName: string,
  documentIds: string[],
  componentId?: string | null,
): Promise<void> {
  try {
    const body: any = {
      table: tableName,
      ids: documentIds,
    };

    if (componentId) {
      body.componentId = componentId;
    }

    const response = await fetch(`${deploymentUrl}/api/mutation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Convex ${accessToken}`,
      },
      body: JSON.stringify({
        path: SYSTEM_QUERIES.DELETE_DOCUMENTS,
        args: [body],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete documents: ${response.statusText} - ${errorText}`,
      );
    }
  } catch (error) {
    console.error("[Data API] Error deleting documents:", error);
    throw error;
  }
}
