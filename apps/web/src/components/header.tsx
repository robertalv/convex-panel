import { useQuery } from "convex/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { label: "Visit Convex", href: "https://convex.link/cpanel" },
  // { label: "Docs", href: "/docs" },
  // { label: "Changelog", href: "/changelog" },
];

export function Header() {
  const stars = useQuery(api.stats.getConvexPanelStars) ?? 0;
  const { location } = useRouterState();
  const currentPath = location.pathname || "/";

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="flex h-12 items-center justify-between gap-4 w-full max-w-2xl rounded-full border border-border bg-background/70 dark:bg-background-secondary/70 backdrop-blur-xl shadow-2xl shadow-black/40 px-2 pl-2 transition-all duration-300">
          <Link to="/" className="ml-1 flex items-center gap-2 group">
          <Logo width={24} height={24} />
          <span className="hidden sm:inline text-md font-medium tracking-tight text-content-primary">
            Convex Panel
          </span>
          </Link>

        <ul className="hidden md:flex items-center gap-1 text-[11px] md:text-xs font-medium mx-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  link.href === currentPath
                    ? "bg-white/5 text-content-primary border-white/10"
                    : "border-transparent text-[#9ca3af] hover:text-content-primary hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/robertalv/convex-panel"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-secondary/90 border border-border text-[11px] font-medium text-content-primary hover:bg-background-secondary transition-colors"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-3 w-3 fill-current"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.62 7.62 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span className="hidden sm:inline">Star</span>
            <span className="ml-0.5 border-l border-border pl-1.5 text-[10px] font-mono tabular-nums text-[#6b7280]">
              {stars.toLocaleString()}
            </span>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}


