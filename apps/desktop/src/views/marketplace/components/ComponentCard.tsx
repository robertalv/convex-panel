import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RegistryComponent } from "@convex-panel/registry";
import { Download, User } from "lucide-react";
import { useComponentImage } from "../hooks/useComponentImage";
import { useGitHubAvatar } from "../hooks/useGitHubAvatar";
import { resolveAuthorAvatar } from "../utils/avatars";

interface ComponentCardProps {
  component: RegistryComponent;
  onDetails: (component: RegistryComponent) => void;
  onInstall: (component: RegistryComponent) => void;
  className?: string;
}

/**
 * Get status badge configuration
 */
function getStatusBadge(status: RegistryComponent["status"]) {
  switch (status) {
    case "beta":
      return { label: "Beta", variant: "warning" as const };
    case "coming-soon":
      return { label: "Coming Soon", variant: "outline" as const };
    case "deprecated":
      return { label: "Deprecated", variant: "error" as const };
    default:
      return null;
  }
}

/**
 * Component card for the marketplace grid
 */
export function ComponentCard({
  component,
  onDetails,
  className,
}: ComponentCardProps) {
  const statusBadge = getStatusBadge(component.status);
  const isDisabled = component.status === "coming-soon";
  const { imageUrl } = useComponentImage(component);
  const githubAvatar = useGitHubAvatar(component.author.github);
  
  // Resolve author avatar with fallback logic
  const authorAvatar = resolveAuthorAvatar(
    component.author.avatar,
    component.author.name,
    component.author.github,
    githubAvatar,
  );

  return (
    <Card
      onClick={() => !isDisabled && onDetails(component)}
      className={cn(
        "group flex flex-col overflow-hidden transition-all duration-300",
        !isDisabled &&
          "cursor-pointer hover:border-brand-base/30 hover:shadow-md hover:-translate-y-0.5",
        isDisabled && "opacity-60 bg-surface-base/50",
        className,
      )}
    >
      {/* Image header */}
      <div className="relative h-32 w-full overflow-hidden bg-surface-raised/50 border-b border-border-muted group-hover:bg-surface-raised transition-colors">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={component.image?.alt || component.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-base">
            <span className="text-4xl font-bold text-text-muted/20 select-none">
              {component.name.charAt(0)}
            </span>
          </div>
        )}

        {statusBadge && (
          <div className="absolute right-2 top-2">
            <Badge
              variant={statusBadge.variant}
              className="shadow-sm backdrop-blur-sm bg-background/80"
            >
              {statusBadge.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-text-base line-clamp-1 group-hover:text-brand-base transition-colors">
            {component.name}
          </h3>
        </div>

        <p className="mb-4 text-sm text-text-muted line-clamp-2 leading-relaxed flex-1">
          {component.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-muted pt-3 mt-auto">
          <div className="flex items-center gap-2 min-w-0">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={component.author.name}
                className="h-5 w-5 rounded-full ring-1 ring-border-base"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-raised ring-1 ring-border-base">
                <User className="h-3 w-3 text-text-muted" />
              </div>
            )}
            <span className="truncate text-xs text-text-muted font-medium hover:text-text-base transition-colors">
              {component.author.name}
            </span>
          </div>

          {component.weeklyDownloads && (
            <div className="flex items-center gap-1 text-xs text-text-muted bg-surface-raised/50 px-1.5 py-0.5 rounded-md">
              <Download className="h-3 w-3" />
              <span>{component.weeklyDownloads.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ComponentCard;
