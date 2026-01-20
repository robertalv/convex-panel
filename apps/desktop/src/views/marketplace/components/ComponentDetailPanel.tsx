/**
 * Component Detail Panel
 *
 * A slide-in panel from the right showing component details.
 * Matches Midday's app store design.
 */

import {
  X,
  ExternalLink,
  Github,
  Package,
  Download,
  ChevronDown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RegistryComponent } from "@convex-panel/registry";
import { getCategoryLabel, useComponentReadme } from "@convex-panel/registry";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useComponentImage } from "../hooks/useComponentImage";
import { useGitHubAvatar } from "../hooks/useGitHubAvatar";
import { resolveAuthorAvatar } from "../utils/avatars";

interface ComponentDetailPanelProps {
  component: RegistryComponent;
  isInstalled: boolean;
  onClose: () => void;
  onInstall: () => void;
  onOpenExternal: (url: string) => void;
}

/**
 * Format download count for display
 */
function formatDownloads(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Get status badge configuration
 */
function getStatusBadge(status: RegistryComponent["status"]) {
  switch (status) {
    case "beta":
      return { label: "Beta", className: "bg-amber-500/20 text-amber-400" };
    case "coming-soon":
      return {
        label: "Coming soon",
        className: "bg-zinc-500/20 text-zinc-400",
      };
    case "deprecated":
      return { label: "Deprecated", className: "bg-red-500/20 text-red-400" };
    default:
      return null;
  }
}

/**
 * Collapsible section component
 */
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border-muted">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-text-base">{title}</span>
        <ChevronDown
          size={16}
          className={cn(
            "text-text-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function ComponentDetailPanel({
  component,
  isInstalled,
  onClose,
  onInstall,
  onOpenExternal,
}: ComponentDetailPanelProps) {
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
  
  // Fetch README
  const { readme, source, isLoading: isReadmeLoading, error: readmeError, clearCacheAndRefetch } = useComponentReadme(component);

  return (
    <div
      className={cn(
        "fixed top-10 right-0 bottom-0 w-[400px]",
        "bg-surface-base border-l border-border-muted",
        "flex flex-col overflow-hidden",
        "animate-slide-in-right z-50",
      )}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          "absolute top-4 right-4 p-1.5 rounded-lg z-10",
          "text-text-muted hover:text-text-base",
          "hover:bg-surface-overlay transition-colors",
        )}
      >
        <X size={16} />
      </button>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        {/* Header with logo */}
        <div className="w-full aspect-video border-b border-border-muted bg-gradient-to-br from-surface-raised to-surface-base overflow-hidden relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={component.image?.alt || component.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-base/30 to-brand-base/10">
              <span className="text-6xl font-bold text-brand-base">
                {component.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Title and author */}
        <div className="px-6 py-4 border-b border-border-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={component.author.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-overlay flex items-center justify-center">
                <span className="text-xs font-medium text-text-muted">
                  {component.author.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-text-base">
                  {component.name}
                </h2>
                {statusBadge && (
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      statusBadge.className,
                    )}
                  >
                    {statusBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {getCategoryLabel(component.category)} • By{" "}
                {component.author.name}
              </p>
            </div>
          </div>
          <Button
            onClick={onInstall}
            disabled={isDisabled || isInstalled}
            variant={isInstalled ? "secondary" : "default"}
            size="sm"
            className="h-8"
          >
            {isInstalled ? "Installed" : "Install"}
          </Button>
        </div>

        {/* Sections */}
        <div className="px-6">
          {/* How it works */}
          <Section title="How it works" defaultOpen={true}>
            <p className="text-sm text-text-muted leading-relaxed">
              {component.longDescription || component.description}
            </p>
          </Section>

          {/* Documentation (README) */}
          <Section title="Documentation" defaultOpen={false}>
            {isReadmeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                <span className="ml-2 text-sm text-text-muted">
                  Loading documentation...
                </span>
              </div>
            ) : readmeError ? (
              <div className="flex flex-col gap-3 py-4">
                <p className="text-sm text-error-base">
                  Failed to load documentation: {readmeError}
                </p>
                <Button
                  onClick={clearCacheAndRefetch}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Retry
                </Button>
              </div>
            ) : readme ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-text-muted">
                    Source: {source === "github" ? "GitHub" : "npm"}
                  </span>
                  <button
                    onClick={clearCacheAndRefetch}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-text-base transition-colors"
                    title="Refresh documentation"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-lg font-semibold text-text-base mt-4 mb-2"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-base font-semibold text-text-base mt-4 mb-2"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-sm font-semibold text-text-base mt-3 mb-2"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="text-sm text-text-muted leading-relaxed mb-2"
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-base hover:underline"
                          onClick={(e) => {
                            if (props.href) {
                              e.stopPropagation();
                              onOpenExternal(props.href);
                            }
                          }}
                        />
                      ),
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = !match;
                        return isInline ? (
                          <code
                            {...props}
                            className="bg-surface-raised px-1.5 py-0.5 rounded text-xs text-text-base font-mono"
                          >
                            {children}
                          </code>
                        ) : (
                          <pre
                            className="p-3 rounded-lg bg-surface-raised border border-border-muted overflow-x-auto mb-3"
                          >
                            <code
                              {...props}
                              className="text-xs text-text-base font-mono block"
                            >
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-disc list-inside text-sm text-text-muted mb-2 ml-2"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="list-decimal list-inside text-sm text-text-muted mb-2 ml-2"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="mb-1" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-border-muted pl-4 italic text-sm text-text-muted mb-2"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-text-base" {...props} />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic" {...props} />
                      ),
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="max-w-full h-auto rounded-lg my-2 object-contain"
                          alt={props.alt || ""}
                        />
                      ),
                    }}
                  >
                    {readme}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                No documentation available for this component.
              </p>
            )}
          </Section>

          {/* Stats */}
          {component.weeklyDownloads && (
            <Section title="Stats" defaultOpen={false}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Download size={14} className="text-text-muted" />
                  <span className="text-sm text-text-base">
                    {formatDownloads(component.weeklyDownloads)}
                  </span>
                  <span className="text-xs text-text-muted">
                    weekly downloads
                  </span>
                </div>
              </div>
            </Section>
          )}

          {/* Links */}
          <Section title="Links" defaultOpen={false}>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onOpenExternal(component.repoUrl)}
                className="flex items-center gap-2 text-sm text-text-base hover:text-brand-base transition-colors"
              >
                <Github size={14} />
                <span>View on GitHub</span>
                <ExternalLink size={12} className="ml-auto text-text-muted" />
              </button>
              <button
                onClick={() =>
                  onOpenExternal(
                    `https://www.npmjs.com/package/${component.npmPackage}`,
                  )
                }
                className="flex items-center gap-2 text-sm text-text-base hover:text-brand-base transition-colors"
              >
                <Package size={14} />
                <span>View on npm</span>
                <ExternalLink size={12} className="ml-auto text-text-muted" />
              </button>
              {component.docsUrl && (
                <button
                  onClick={() => onOpenExternal(component.docsUrl!)}
                  className="flex items-center gap-2 text-sm text-text-base hover:text-brand-base transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Documentation</span>
                  <ExternalLink size={12} className="ml-auto text-text-muted" />
                </button>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 p-4 border-t border-border-muted bg-surface-base">
        <p className="text-[10px] text-text-muted leading-relaxed">
          All components are open-source and maintained by the Convex community.
          Review the source code before installing.
        </p>
        <button
          onClick={() =>
            onOpenExternal(
              component.repoUrl
                ? `${component.repoUrl.replace(/\/tree\/.*$/, "")}/issues`
                : "https://github.com/get-convex/convex-helpers/issues",
            )
          }
          className="text-[10px] text-error-base hover:underline mt-1"
        >
          Report an issue
        </button>
      </div>
    </div>
  );
}

export default ComponentDetailPanel;
