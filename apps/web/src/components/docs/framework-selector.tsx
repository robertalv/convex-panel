import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Framework, frameworks } from "./constants";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function FrameworkSelector({
  current,
  onChange,
}: {
  current: Framework;
  onChange: (f: Framework) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 mb-10 p-1 bg-background-secondary/50 rounded-xl border border-border/60 inline-flex relative z-10 backdrop-blur-sm">
      {frameworks.map((f) => {
        const isActive = current === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={cn(
              "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive
                ? "text-content-primary"
                : "text-content-secondary hover:text-content-primary",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="framework-active"
                className="absolute inset-0 bg-background-tertiary shadow-sm rounded-lg border border-border/50"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            <span className="relative z-10 text-xs sm:text-sm flex items-center gap-1.5">
              <span className="opacity-80">{f.icon}</span>
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}


