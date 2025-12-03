import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Search } from "lucide-react";
import type { DocsNavSection, DocsPath } from "./constants";

type CommandPaletteProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  docsNav: DocsNavSection[];
  onNavigate: (href: DocsPath) => void;
};

export function CommandPalette({
  open,
  setOpen,
  docsNav,
  onNavigate,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery("");
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!query) return [];
    const lower = query.toLowerCase();
    return docsNav.flatMap((section) =>
      section.items
        .filter(
          (item) =>
            item.label.toLowerCase().includes(lower) ||
            item.description?.toLowerCase().includes(lower),
        )
        .map((item) => ({ ...item, section: section.title })),
    );
  }, [docsNav, query]);

  const topHits = useMemo(() => {
    if (query) return [];
    return docsNav.flatMap((s) => s.items).slice(0, 3);
  }, [docsNav, query]);

  const visibleItems = query === "" ? topHits : filteredItems;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="w-full max-w-xl bg-[#1e2024] border border-white/10 rounded-xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
          >
            <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/5">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm h-6"
              />
              <div className="text-[10px] font-mono bg-white/10 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                ESC
              </div>
            </div>

            <div className="overflow-y-auto p-2 custom-scrollbar">
              {query === "" && (
                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Suggested
                </div>
              )}

              {visibleItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    onNavigate(item.href);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 group transition-colors text-left"
                >
                  <div className="p-2 rounded-md bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 group-hover:text-primary transition-colors">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                </button>
              ))}

              {query && filteredItems.length === 0 && (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


