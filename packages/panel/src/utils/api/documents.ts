import { ROUTES } from '../constants';

/**
 * Updates specified fields for given document IDs in a table
 * @param table - The table name
 * @param ids - Array of document IDs to update
 * @param fields - Record of field names and their new values
 * @param adminClient - The Convex admin client instance
 * @returns The result of the mutation
 */
export const patchDocumentFields = async (
  table: string,
  ids: string[],
  fields: Record<string, any>,
  adminClient: any
) => {
  if (!adminClient) {
    throw new Error("Admin client is not available");
  }

  try {
    const result = await adminClient.mutation(
      "_system/frontend/patchDocumentsFields" as any,
      {
        table,
        componentId: null,
        ids,
        fields
      }
    );

    return result;
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

/**
 * Deletes documents from a table
 * @param table - The table name
 * @param ids - Array of document IDs to delete
 * @param adminClient - The Convex admin client instance
 * @returns The result of the mutation
 */
export const deleteDocuments = async (
  table: string,
  ids: string[],
  adminClient: any,
  componentId: string | null = null
) => {
  if (!adminClient) {
    throw new Error("Admin client is not available");
  }

  try {
    const result = await adminClient.mutation(
      "_system/frontend/deleteDocuments" as any,
      {
        toDelete: ids.map(id => ({ tableName: table, id })),
        componentId
      }
    );

    return result;
  } catch (error) {
    console.error("Error deleting documents:", error);
    throw error;
  }
};

/**
 * Clears a page of documents from a table
 * @param adminClient - The Convex admin client instance
 * @param tableName - The table name
 * @param cursor - Optional cursor for pagination
 * @param componentId - Optional component ID
 * @returns Result with continueCursor, deleted count, and hasMore flag
 */
export const clearTablePage = async (
  adminClient: any,
  tableName: string,
  cursor: string | null = null,
  componentId: string | null = null
): Promise<{ continueCursor: string; deleted: number; hasMore: boolean }> => {
  if (!adminClient) {
    throw new Error("Admin client is not available");
  }

  try {
    const result = await adminClient.mutation(
      "_system/frontend/clearTablePage:default" as any,
      {
        tableName,
        cursor,
        componentId,
      }
    );

    return {
      continueCursor: result.continueCursor || null,
      deleted: result.deleted || 0,
      hasMore: result.hasMore || false,
    };
  } catch (error) {
    console.error("Error clearing table page:", error);
    throw error;
  }
};

/**
 * Deletes a table
 * @param deploymentUrl - The deployment URL
 * @param adminKey - The admin key
 * @param tableNames - Array of table names to delete
 * @param componentId - Optional component ID
 * @returns Success status
 */
export const deleteTable = async (
  deploymentUrl: string,
  adminKey: string,
  tableNames: string[],
  componentId: string | null = null
): Promise<{ success: boolean; error?: string }> => {
  if (!deploymentUrl || !adminKey) {
    return {
      success: false,
      error: 'Missing deployment URL or admin key',
    };
  }

  try {
    const body = JSON.stringify({ tableNames, componentId });
    const response = await fetch(`${deploymentUrl}${ROUTES.DELETE_TABLES}`, {
      method: 'POST',
      headers: {
        'Authorization': `Convex ${adminKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      return {
        success: false,
        error: error.message || `HTTP error! status: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to delete table',
    };
  }
};

/**
 * Inserts documents into a table
 * @param table - The table name
 * @param documents - Array of documents to insert
 * @param adminClient - The Convex admin client instance
 * @param componentId - Optional component ID
 * @returns The result of the mutation
 */
export const insertDocuments = async (
  table: string,
  documents: any[],
  adminClient: any,
  componentId: string | null = null
) => {
  if (!adminClient) {
    throw new Error("Admin client is not available");
  }

  if (!documents || documents.length === 0) {
    throw new Error("No documents to insert");
  }

  try {
    // Try using system mutation first (available on newer Convex versions/plans)
    try {
      const result = await adminClient.mutation(
        "_system/frontend/addDocument" as any,
        {
          table,
          documents,
          componentId
        }
      );
      return result;
    } catch (systemError: any) {
      console.warn("System addDocument mutation not available, trying user-defined mutation...", systemError);

      // Try calling a user-defined mutation as fallback
      try {
        const result = await adminClient.mutation(
          "panel:addDocument" as any,
          {
            table,
            documents,
          }
        );
        return result;
      } catch (userMutationError: any) {
        console.warn("User-defined panel:addDocument mutation not found", userMutationError);

        // Neither system nor user mutation exists - throw upgrade error
        const upgradeError: any = new Error(
          `Cannot add documents: The system mutation is unavailable on your plan.`
        );
        upgradeError.code = 'UPGRADE_REQUIRED';
        upgradeError.isUpgradeError = true;
        throw upgradeError;
      }
    }
  } catch (error: any) {
    console.error("Error inserting documents:", error);
    
    // Extract more detailed error message from Convex errors
    if (error?.data) {
      // ConvexError with data field
      throw new Error(error.data);
    } else if (error?.message) {
      // Standard Error object
      throw error;
    } else {
      // Unknown error format
      throw new Error(`Failed to insert documents: ${String(error)}`);
    }
  }
};
