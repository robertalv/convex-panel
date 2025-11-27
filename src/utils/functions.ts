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

  try {
    // Try using system mutation first
    try {
      const result = await adminClient.mutation(
        "_system/frontend/insertDocuments" as any,
        {
          table,
          documents,
          componentId
        }
      );
      return result;
    } catch (systemError: any) {
      // If system mutation doesn't exist, try using a generic mutation approach
      // This would require the user to have a mutation in their codebase
      console.warn("System insertDocuments mutation not available, trying alternative approach:", systemError);
      
      // Alternative: Use HTTP API if available
      // For now, throw the error so the user knows they need to implement a mutation
      throw new Error(
        "Insert documents mutation not available. Please create a mutation in your Convex functions: " +
        "export const insertDocuments = mutation({ args: { table: v.string(), documents: v.array(v.any()) }, " +
        "handler: async (ctx, { table, documents }) => { return await Promise.all(documents.map(doc => ctx.db.insert(table, doc))); } });"
      );
    }
  } catch (error) {
    console.error("Error inserting documents:", error);
    throw error;
  }
};
