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
    throw error;
  }
};
