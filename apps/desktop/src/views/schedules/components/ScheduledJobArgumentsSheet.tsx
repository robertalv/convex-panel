/**
 * ScheduledJobArgumentsSheet
 * Sheet component for viewing scheduled job arguments
 */

import { useState, useEffect, useMemo } from "react";
import { ResizableSheet } from "@/views/data/components/ResizableSheet";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useDeployment } from "@/contexts/deployment-context";
import { fetchScheduledJobArguments } from "@convex-panel/shared/api";

interface ScheduledJobArgumentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
}

export function ScheduledJobArgumentsSheet({
  isOpen,
  onClose,
  job,
}: ScheduledJobArgumentsSheetProps) {
  const { adminClient } = useDeployment();
  const [fetchedArgs, setFetchedArgs] = useState<any>(null);

  // Fetch full job document when sheet opens to get complete arguments
  useEffect(() => {
    if (!isOpen || !job || !adminClient) {
      setFetchedArgs(null);
      return;
    }

    // If job has 'args' field directly (newer Convex versions), use that
    if (job.args !== null && job.args !== undefined) {
      console.log("Using job.args directly:", job.args);
      setFetchedArgs(job.args);
      return;
    }

    // If job has 'udfArgs' field (older Convex versions), use that
    if (job.udfArgs !== null && job.udfArgs !== undefined) {
      console.log("Using job.udfArgs directly:", job.udfArgs);
      setFetchedArgs(job.udfArgs);
      return;
    }

    // Otherwise, try fetching the full job document by ID
    // This might return the complete document with args/udfArgs populated
    if (job._id) {
      console.log("Fetching full job document for ID:", job._id);
      fetchScheduledJobArguments(adminClient, job._id, job.component || null)
        .then((args: any) => {
          console.log("Fetched args from full document:", args);
          console.log("Fetched args type:", typeof args);
          console.log("Fetched args constructor:", args?.constructor?.name);
          if (args && typeof args === "object" && "type" in args) {
            console.log("Fetched args.type:", args.type);
            console.log("Fetched args.data:", args.data);
          }
          setFetchedArgs(args);
        })
        .catch((error: any) => {
          console.error("Failed to fetch full job document:", error);
          setFetchedArgs(null);
        });
    }
  }, [isOpen, job, adminClient]);

  const argsJson = useMemo(() => {
    if (!job) return "[]";

    // Use fetched args if available, otherwise try job.args or job.udfArgs
    const jobArgs = fetchedArgs || job.args || job.udfArgs;

    if (!jobArgs) {
      return "[]";
    }

    try {
      // Parse arguments exactly like the official Convex dashboard does
      // They use: Buffer.from(udfArgs).toString("utf8")
      let jsonString: string;

      // Check if it's a Buffer-like object (has type and data properties)
      if (
        typeof jobArgs === "object" &&
        jobArgs.type === "Buffer" &&
        Array.isArray(jobArgs.data)
      ) {
        // Node.js Buffer serialized as { type: "Buffer", data: [...] }
        // Convert to Uint8Array and decode
        const uint8Array = new Uint8Array(jobArgs.data);
        const decoder = new TextDecoder("utf-8");
        jsonString = decoder.decode(uint8Array);
      } else if (
        jobArgs instanceof Uint8Array ||
        jobArgs instanceof ArrayBuffer ||
        ArrayBuffer.isView(jobArgs)
      ) {
        // Handle Uint8Array, ArrayBuffer, or other TypedArray views
        const decoder = new TextDecoder("utf-8");
        jsonString = decoder.decode(
          jobArgs instanceof ArrayBuffer ? new Uint8Array(jobArgs) : jobArgs,
        );
      } else if (typeof jobArgs === "string") {
        // Already a string
        jsonString = jobArgs;
      } else if (Array.isArray(jobArgs)) {
        // If it's already an array, stringify it directly
        return JSON.stringify(jobArgs, null, 2);
      } else {
        // Already parsed JSON object
        return JSON.stringify(jobArgs, null, 2);
      }

      // Parse the JSON string and pretty print
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      console.error("Error parsing scheduled job arguments:", error);
      console.log("jobArgs type:", typeof jobArgs);
      console.log("jobArgs value:", jobArgs);
      return "[]";
    }
  }, [job, fetchedArgs]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(argsJson);
      toast.success("Arguments copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy arguments");
    }
  };

  if (!isOpen || !job) return null;

  const jobId = job._id || "Unknown";
  const functionName =
    job.udfPath || job.component || job.name || "Unknown Function";

  return (
    <ResizableSheet
      id="scheduled-job-arguments"
      title="Scheduled Job Arguments"
      subtitle={functionName}
      onClose={onClose}
      side="right"
      defaultWidth={600}
      minWidth={400}
      maxWidth={1000}
      headerActions={
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          <Copy size={14} />
          Copy
        </Button>
      }
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Job Info */}
        <div className="shrink-0 border-b border-border-base bg-surface-base px-4 py-3">
          <div className="text-xs text-text-muted">
            Job ID: <span className="font-mono text-text-base">{jobId}</span>
          </div>
        </div>

        {/* Code Display */}
        <div className="flex-1 overflow-auto bg-surface-raised p-4">
          <pre className="font-mono text-xs text-text-base">
            <code>{argsJson}</code>
          </pre>
        </div>
      </div>
    </ResizableSheet>
  );
}
