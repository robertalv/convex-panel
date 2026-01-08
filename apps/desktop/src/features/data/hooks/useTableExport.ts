/**
 * useTableExport Hook
 * Handles exporting table data to JSON or CSV formats
 */

import { useState, useCallback } from "react";
import type { TableDocument, ExportFormat } from "@convex-panel/shared";
import { documentsToCSV, downloadFile } from "../utils/formatters";

interface UseTableExportProps {
  adminClient: any;
  componentId?: string | null;
}

interface UseTableExportReturn {
  isExporting: boolean;
  exportError: string | null;
  exportCurrentResults: (
    documents: TableDocument[],
    tableName: string,
    format: ExportFormat,
  ) => void;
  exportFullTable: (tableName: string, format: ExportFormat) => Promise<void>;
}

export function useTableExport({
  adminClient,
  componentId,
}: UseTableExportProps): UseTableExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const normalizedComponentId = componentId === "app" ? null : componentId;

  /**
   * Export current query results
   */
  const exportCurrentResults = useCallback(
    (documents: TableDocument[], tableName: string, format: ExportFormat) => {
      try {
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `${tableName}_export_${timestamp}`;

        if (format === "json") {
          const jsonContent = JSON.stringify(documents, null, 2);
          downloadFile(jsonContent, `${filename}.json`, "application/json");
        } else {
          const csvContent = documentsToCSV(documents);
          downloadFile(csvContent, `${filename}.csv`, "text/csv");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setExportError(message);
      }
    },
    [],
  );

  /**
   * Export full table by fetching all documents
   */
  const exportFullTable = useCallback(
    async (tableName: string, format: ExportFormat) => {
      if (!adminClient) {
        setExportError("Admin client not available");
        return;
      }

      setIsExporting(true);
      setExportError(null);

      try {
        const allDocuments: TableDocument[] = [];
        let cursor: string | null = null;
        let hasMore = true;
        const batchSize = 100;

        // Fetch all documents with pagination
        while (hasMore) {
          const result: any = await adminClient.query(
            "_system/frontend/paginatedTableDocuments:default" as any,
            {
              table: tableName,
              componentId: normalizedComponentId,
              filters: null,
              order: null,
              paginationOpts: {
                numItems: batchSize,
                cursor: cursor,
                id: Date.now(),
              },
            },
          );

          const documents: TableDocument[] = result?.page || [];
          allDocuments.push(...documents);

          cursor = result?.continueCursor || null;
          hasMore = !result?.isDone && cursor !== null;

          // Safety limit to prevent infinite loops
          if (allDocuments.length > 100000) {
            console.warn("Export limit reached: 100,000 documents");
            break;
          }
        }

        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `${tableName}_full_export_${timestamp}`;

        if (format === "json") {
          const jsonContent = JSON.stringify(allDocuments, null, 2);
          downloadFile(jsonContent, `${filename}.json`, "application/json");
        } else {
          const csvContent = documentsToCSV(allDocuments);
          downloadFile(csvContent, `${filename}.csv`, "text/csv");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setExportError(message);
      } finally {
        setIsExporting(false);
      }
    },
    [adminClient, normalizedComponentId],
  );

  return {
    isExporting,
    exportError,
    exportCurrentResults,
    exportFullTable,
  };
}
