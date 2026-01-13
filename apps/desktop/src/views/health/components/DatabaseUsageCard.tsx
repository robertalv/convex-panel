import {
  Database,
  HardDrive,
  ArrowDown,
  ArrowUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthCard } from "@/components/ui";
import { formatBytes } from "../hooks/useUsageMetrics";

interface DatabaseUsageCardProps {
  /** Database read bytes */
  databaseReadBytes: number;
  /** Database write bytes */
  databaseWriteBytes: number;
  /** Database documents read */
  databaseReadDocuments: number;
  /** Storage read bytes */
  storageReadBytes: number;
  /** Storage write bytes */
  storageWriteBytes: number;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

interface MetricRowProps {
  icon: React.ReactNode;
  label: string;
  readValue: string;
  writeValue: string;
  highlight?: boolean;
}

function MetricRow({
  icon,
  label,
  readValue,
  writeValue,
  highlight,
}: MetricRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "transition-colors duration-150",
        highlight ? "bg-accent-bg/50" : "bg-surface-alt/50",
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-alt text-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowDown size={12} className="text-success" />
          <span className="font-mono text-foreground">{readValue}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUp size={12} className="text-warning" />
          <span className="font-mono text-foreground">{writeValue}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Card displaying database and storage usage metrics.
 * Shows read/write bytes for database and storage.
 */
export function DatabaseUsageCard({
  databaseReadBytes,
  databaseWriteBytes,
  databaseReadDocuments,
  storageReadBytes,
  storageWriteBytes,
  isLoading = false,
  error = null,
  className,
}: DatabaseUsageCardProps) {
  const hasData =
    databaseReadBytes > 0 ||
    databaseWriteBytes > 0 ||
    storageReadBytes > 0 ||
    storageWriteBytes > 0;

  return (
    <HealthCard
      title="Database & Storage I/O"
      tip="Total bytes read and written to database and storage in the last hour."
      loading={isLoading}
      error={error}
      className={className}
    >
      {hasData ? (
        <div className="flex flex-col gap-2">
          <MetricRow
            icon={<Database size={16} />}
            label="Database"
            readValue={formatBytes(databaseReadBytes)}
            writeValue={formatBytes(databaseWriteBytes)}
            highlight
          />
          <MetricRow
            icon={<HardDrive size={16} />}
            label="Storage"
            readValue={formatBytes(storageReadBytes)}
            writeValue={formatBytes(storageWriteBytes)}
          />
          <div className="flex items-center justify-between px-3 pt-2 border-t border-border-base">
            <div className="flex items-center gap-2 text-xs text-muted">
              <FileText size={12} />
              <span>Documents read</span>
            </div>
            <span className="text-sm font-mono font-medium text-foreground">
              {databaseReadDocuments.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted">
          No database activity in the last hour
        </div>
      )}
    </HealthCard>
  );
}
