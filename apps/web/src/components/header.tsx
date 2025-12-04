import { useQuery } from "convex/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Star, Menu, X } from "lucide-react";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { formatCompactNumber } from "../lib/utils";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Visit Convex", href: "https://convex.link/cpanel" },
  // { label: "Docs", href: "/docs" },
  // { label: "Changelog", href: "/changelog" },
];

export function Header() {
  const stars = useQuery(api.stats.getConvexPanelStars) ?? 0;
  const { location } = useRouterState();
  const currentPath = location.pathname || "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="relative flex h-12 items-center justify-between gap-4 w-full max-w-2xl rounded-full border border-border/40 bg-background-primary/60 dark:bg-background-secondary/60 backdrop-blur-xl shadow-sm px-2 pl-4 transition-all duration-300">
        <Link to="/" className="flex items-center gap-2 group z-50">
          <Logo width={24} height={24} />
          <span className="hidden sm:inline text-md font-medium tracking-tight text-content-primary">
            Convex Panel
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1 text-[11px] md:text-xs font-medium mx-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1.5 rounded-full border transition-all duration-200 ${link.href === currentPath
                  ? "bg-background-tertiary text-content-primary border-border"
                  : "border-transparent text-content-secondary hover:text-content-primary hover:bg-background-secondary/50"
                  }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 z-50">
          <a
            href="https://github.com/robertalv/convex-panel"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-secondary/50 border border-border/50 text-[11px] font-medium text-content-primary hover:bg-background-tertiary transition-colors group"
          >
            <Star className="w-3 h-3 fill-current text-content-tertiary group-hover:text-yellow-500 transition-colors" />
            <span className="hidden sm:inline">Star</span>
            <span className="ml-0.5 border-l border-border/50 pl-1.5 text-[10px] font-mono tabular-nums text-content-secondary">
              {formatCompactNumber(stars)}
            </span>
          </a>
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-content-secondary hover:text-content-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-14 left-0 right-0 p-2 bg-background-primary/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl flex flex-col gap-2 md:hidden overflow-hidden"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-background-secondary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-border/50 mx-2 my-1" />
              <a
                href="https://github.com/robertalv/convex-panel"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-xl text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-background-secondary transition-colors flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Star on GitHub
                <span className="ml-auto text-xs text-content-tertiary font-mono">
                  {formatCompactNumber(stars)}
                </span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}