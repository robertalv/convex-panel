import { Link2 } from "lucide-react";
import React from "react";

interface CopyLinkButtonProps {
  version: string;
}

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({ version }) => {
  const handleClick = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}#${version}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      // Also update the current hash so the URL reflects the section
      window.history.replaceState(null, "", `#${version}`);
    } catch {
      // Fallback: set location hash without copying
      window.location.hash = version;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Copy link to this version"
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] font-mono text-muted-foreground opacity-70 transition-all duration-150 group-hover:opacity-100 hover:border-[#34D399]/70 hover:text-foreground hover:bg-background"
    >
      <Link2 className="size-3" />
      <span>Copy link</span>
    </button>
  );
};


