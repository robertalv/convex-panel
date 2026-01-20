import { cn } from "@/lib/utils";
import { Eye, Globe, Radio } from "lucide-react";

export function EnvironmentBadge({
  deploymentType,
}: {
  deploymentType: "prod" | "dev" | "preview";
}) {
  const isDev = deploymentType === "dev";
  const isPreview = deploymentType === "preview";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium",
        "border transition-colors",
        isDev
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : isPreview
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
            : "bg-violet-500/10 text-violet-400 border-violet-500/30",
      )}
    >
      {isDev ? (
        <Globe className="h-3 w-3" />
      ) : isPreview ? (
        <Eye className="h-3 w-3" />
      ) : (
        <Radio className="h-3 w-3" />
      )}
      <span>
        {isDev ? "Development" : isPreview ? "Preview" : "Production"}
      </span>
    </div>
  );
}
