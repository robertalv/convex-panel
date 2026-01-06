import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { menuStructure } from "./data";
import type { DocSectionId } from "./types";

interface DocsSidebarProps {
  activeSection: DocSectionId;
  onSectionChange: (section: DocSectionId) => void;
}

export function DocsSidebar({ activeSection, onSectionChange }: DocsSidebarProps) {
  return (
    <nav className="w-full lg:w-64 shrink-0">
      <div className="sticky top-24 space-y-8">
        {menuStructure.map((category) => (
          <div key={category.category}>
            <h4 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-3 px-3">
              {category.category}
            </h4>
            <ul className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon;
                const isParentActive =
                  activeSection === item.id ||
                  item.subItems?.some((sub) => sub.id === activeSection);
                const isSelfActive = activeSection === item.id;

                return (
                  <li key={item.id}>
                    {/* Main Menu Item */}
                    <div className="relative">
                      <button
                        onClick={() => onSectionChange(item.id)}
                        className={cn(
                          "relative w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group",
                          isSelfActive
                            ? "bg-background-tertiary text-content-primary"
                            : "text-content-secondary hover:text-content-primary hover:bg-background-tertiary/50",
                        )}
                      >
                        {/* Active Indicator */}
                        {isSelfActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-content-accent rounded-r-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}

                        {Icon && (
                          <Icon
                            className={cn(
                              "w-4 h-4",
                              isSelfActive ? "text-content-accent" : "text-content-tertiary",
                            )}
                          />
                        )}
                        <span>{item.label}</span>
                        {isParentActive && item.subItems && (
                          <ChevronRight className="w-3.5 h-3.5 ml-auto text-content-tertiary rotate-90 transition-transform" />
                        )}
                      </button>
                    </div>

                    {/* Sub Items */}
                    <AnimatePresence>
                      {isParentActive && item.subItems && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-1 ml-4 pl-3 border-l border-border space-y-1 overflow-hidden"
                        >
                          {item.subItems.map((subItem) => {
                            const isSubActive = activeSection === subItem.id;
                            return (
                              <li key={subItem.id}>
                                <button
                                  onClick={() => onSectionChange(subItem.id)}
                                  className={cn(
                                    "relative w-full text-left px-3 py-1.5 text-sm transition-colors rounded-md",
                                    isSubActive
                                      ? "text-content-primary bg-background-tertiary/50 font-medium"
                                      : "text-content-secondary hover:text-content-primary",
                                  )}
                                >
                                  {/* Sub-item Active Indicator */}
                                  {isSubActive && (
                                    <motion.div
                                      layoutId="activeIndicatorSub"
                                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-content-accent rounded-r-full -ml-[13px]"
                                    />
                                  )}
                                  {subItem.label}
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="pt-6 mt-6 border-t border-border px-3">
          <a
            href="https://docs.convex.dev"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-content-tertiary hover:text-content-primary transition-colors"
          >
            Looking for Convex docs?
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </nav>
  );
}








