import React, { useMemo, useState, useRef } from "react";
import { Code as CodeIcon, Check } from "lucide-react";
import { isCustomQueryValue } from "../../utils/api/functionDiscovery";
import type { ModuleFunction } from "../../utils/api/functionDiscovery";
import type { CustomQuery } from "../../types/functions";
import {
  DropdownShell,
  DropdownTrigger,
  DropdownPanel,
  DropdownSearch,
  DropdownList,
} from "../dropdowns";
import { useDropdownWidth, useFilteredOptions } from "../../hooks/dropdowns";
import { useThemeSafe } from "../../hooks/useTheme";

interface MultiSelectFunctionSelectorProps {
  selectedFunctions: (ModuleFunction | CustomQuery)[];
  onSelect: (functions: (ModuleFunction | CustomQuery)[]) => void;
  functions: ModuleFunction[];
  componentId?: string | null;
}

interface FunctionOption {
  key: string;
  label: string;
  value: ModuleFunction | CustomQuery;
  identifier?: string;
  searchValue: string;
  functionName: string;
  componentPart: string;
  identifierFunctionName: string;
  shouldShowFunctionName: boolean;
}

export const MultiSelectFunctionSelector: React.FC<
  MultiSelectFunctionSelectorProps
> = ({ selectedFunctions, onSelect, functions, componentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeSafe();

  const filteredFunctions = useMemo(() => {
    const normalizedComponentId = componentId === "app" ? null : componentId;

    return functions.filter((fn: ModuleFunction) => {
      let matchesComponent = false;

      if (!normalizedComponentId) {
        matchesComponent =
          fn.componentId === null || fn.componentId === undefined;
      } else {
        matchesComponent =
          (!!fn.identifier &&
            fn.identifier.startsWith(`${normalizedComponentId}:`)) ||
          fn.componentId === normalizedComponentId;
      }

      return matchesComponent;
    });
  }, [functions, componentId]);

  const allOptions = useMemo<FunctionOption[]>(() => {
    return filteredFunctions.map((fn, index) => {
      const filePath = fn.file?.path || "";
      let fileName = filePath.split("/").pop() || filePath;
      if (fileName.endsWith(".js")) {
        fileName = fileName.slice(0, -3);
      }

      const functionName = fn.name || fn.identifier || "Unnamed function";
      let identifier = fn.identifier || "";

      if (identifier) {
        identifier = identifier.replace(/\.js:/g, ":").replace(/\.js$/g, "");
      }

      let componentPart = "";
      let identifierFunctionName = "";
      if (identifier && identifier.includes(":")) {
        const parts = identifier.split(":");
        componentPart = parts[0];
        identifierFunctionName = parts.slice(1).join(":");
      } else {
        componentPart = identifier;
      }

      const shouldShowFunctionName = Boolean(
        functionName &&
        identifierFunctionName &&
        functionName !== identifierFunctionName,
      );

      return {
        key: fn.identifier || fn.name || `function-${index}`,
        label: functionName,
        value: fn as ModuleFunction | CustomQuery,
        identifier,
        searchValue:
          `${fn.name || ""} ${fn.identifier || ""} ${filePath || ""}`.toLowerCase(),
        functionName,
        componentPart,
        identifierFunctionName,
        shouldShowFunctionName,
      };
    });
  }, [filteredFunctions]);

  const { filteredOptions, searchQuery, setSearchQuery, clearSearch } =
    useFilteredOptions(allOptions, (option) => option.searchValue);

  const dropdownWidth = useDropdownWidth(
    triggerRef,
    isOpen,
    allOptions,
    (option) => option.identifier || option.label,
    {
      searchPlaceholder: "Search functions...",
      fontSize: "12px",
      fontFamily: "monospace",
      iconWidth: 14,
      checkboxWidth: 16,
    },
  );

  React.useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  const isFunctionSelected = (option: FunctionOption): boolean => {
    return selectedFunctions.some((selected) => {
      if (isCustomQueryValue(option.value) && isCustomQueryValue(selected)) {
        return true;
      }
      if (isCustomQueryValue(option.value) || isCustomQueryValue(selected)) {
        return false;
      }
      const optionIdentifier = (option.value as ModuleFunction).identifier;
      const selectedIdentifier = (selected as ModuleFunction).identifier;
      return (
        !!optionIdentifier &&
        !!selectedIdentifier &&
        optionIdentifier === selectedIdentifier
      );
    });
  };

  const allSelected = useMemo(() => {
    return (
      filteredOptions.length > 0 &&
      filteredOptions.every((option) => isFunctionSelected(option))
    );
  }, [filteredOptions, selectedFunctions]);

  const someSelected = useMemo(() => {
    return (
      filteredOptions.some((option) => isFunctionSelected(option)) &&
      !allSelected
    );
  }, [filteredOptions, selectedFunctions, allSelected]);

  const handleSelectAll = () => {
    if (allSelected) {
      onSelect([]);
    } else {
      onSelect(filteredOptions.map((opt) => opt.value));
    }
  };

  const handleToggleFunction = (option: FunctionOption) => {
    const isSelected = isFunctionSelected(option);
    if (isSelected) {
      onSelect(
        selectedFunctions.filter((selected) => {
          if (
            isCustomQueryValue(option.value) &&
            isCustomQueryValue(selected)
          ) {
            return false;
          }
          if (
            isCustomQueryValue(option.value) ||
            isCustomQueryValue(selected)
          ) {
            return true;
          }
          const optionIdentifier = (option.value as ModuleFunction).identifier;
          const selectedIdentifier = (selected as ModuleFunction).identifier;
          return !(
            !!optionIdentifier &&
            !!selectedIdentifier &&
            optionIdentifier === selectedIdentifier
          );
        }),
      );
    } else {
      onSelect([...selectedFunctions, option.value]);
    }
  };

  const handleSelectOnly = (option: FunctionOption, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect([option.value]);
  };

  const displayText =
    selectedFunctions.length === 0
      ? "All functions"
      : selectedFunctions.length === allOptions.length
        ? "All functions"
        : `${selectedFunctions.length} ${selectedFunctions.length === 1 ? "function" : "functions"}`;

  return (
    <DropdownShell isOpen={isOpen} onOpenChange={setIsOpen}>
      <div style={{ position: "relative" }}>
        <div
          ref={triggerRef}
          style={{
            position: "relative",
            display: "inline-block",
            width: "100%",
          }}
        >
          <DropdownTrigger isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
            <CodeIcon
              style={{
                width: "14px",
                height: "14px",
                color: "var(--color-panel-text-muted)",
              }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayText}
            </span>
          </DropdownTrigger>
        </div>

        <DropdownPanel
          isOpen={isOpen}
          width={dropdownWidth}
          maxHeight={350}
          triggerRef={triggerRef as React.RefObject<HTMLElement>}
          className={`cp-theme-${theme}`}
          style={{
            backgroundColor: "var(--color-panel-bg)",
          }}
        >
          <DropdownSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search functions..."
            onEscape={() => setIsOpen(false)}
          />

          {/* Select All Option */}
          <div
            onClick={handleSelectAll}
            style={{
              padding: "8px 12px",
              fontSize: "12px",
              color:
                allSelected || someSelected
                  ? "var(--color-panel-text)"
                  : "var(--color-panel-text-secondary)",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px solid var(--color-panel-border)",
            }}
          >
            {allSelected ? (
              <Check
                size={16}
                style={{
                  color: "var(--color-panel-accent)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{ width: "16px", flexShrink: 0 }} />
            )}
            <span>{allSelected ? "Deselect all" : "Select all"}</span>
          </div>

          {/* Function List with Virtualization */}
          <DropdownList
            items={filteredOptions}
            renderItem={(option) => {
              const isSelected = isFunctionSelected(option);
              return (
                <div
                  key={option.key}
                  onClick={() => handleToggleFunction(option)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: isSelected
                      ? "var(--color-panel-text)"
                      : "var(--color-panel-text-secondary)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: 0,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    const onlyButtonWrapper = e.currentTarget.querySelector(
                      ".only-button-wrapper",
                    ) as HTMLElement;
                    const onlyButtonBackdrop = e.currentTarget.querySelector(
                      ".only-button-backdrop",
                    ) as HTMLElement;
                    if (onlyButtonWrapper) {
                      onlyButtonWrapper.style.opacity = "1";
                      onlyButtonWrapper.style.transform = "translateX(0)";
                    }
                    if (onlyButtonBackdrop) {
                      onlyButtonBackdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    const onlyButtonWrapper = e.currentTarget.querySelector(
                      ".only-button-wrapper",
                    ) as HTMLElement;
                    const onlyButtonBackdrop = e.currentTarget.querySelector(
                      ".only-button-backdrop",
                    ) as HTMLElement;
                    if (onlyButtonWrapper) {
                      onlyButtonWrapper.style.opacity = "0";
                      onlyButtonWrapper.style.transform = "translateX(100%)";
                    }
                    if (onlyButtonBackdrop) {
                      onlyButtonBackdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                    }
                  }}
                >
                  {isSelected ? (
                    <Check
                      size={16}
                      style={{
                        color: "var(--color-panel-accent)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{ width: "16px", flexShrink: 0 }} />
                  )}
                  <CodeIcon
                    style={{
                      width: "14px",
                      height: "14px",
                      color: "var(--color-panel-text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                      flex: 1,
                      transition: "flex 0.15s ease",
                    }}
                  >
                    {option.componentPart && (
                      <span style={{ color: "var(--color-panel-text-muted)" }}>
                        {option.componentPart}
                      </span>
                    )}
                    {option.componentPart &&
                      (option.identifierFunctionName ||
                        option.functionName) && (
                        <span
                          style={{
                            color: "var(--color-panel-text-muted)",
                            opacity: 0.6,
                          }}
                        >
                          :
                        </span>
                      )}
                    {(option.identifierFunctionName || option.functionName) && (
                      <span
                        style={{
                          color: isSelected
                            ? "var(--color-panel-text)"
                            : "var(--color-panel-text-secondary)",
                        }}
                      >
                        {option.shouldShowFunctionName
                          ? option.functionName
                          : option.identifierFunctionName ||
                            option.functionName}
                      </span>
                    )}
                  </span>
                  <div
                    className="only-button-wrapper"
                    style={{
                      marginLeft: "auto",
                      flexShrink: 0,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      opacity: 0,
                      transform: "translateX(100%)",
                      transition: "opacity 0.15s ease, transform 0.15s ease",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      className="only-button-backdrop"
                      style={{
                        position: "absolute",
                        right: "-50px",
                        top: 0,
                        bottom: 0,
                        left: "-20px",
                        background: `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`,
                        pointerEvents: "none",
                        transition: "background 0.15s ease",
                        zIndex: 0,
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSelectOnly(option, e)}
                      className="only-button"
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-panel-text-secondary)",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        padding: 0,
                        lineHeight: 1,
                        position: "relative",
                        zIndex: 1,
                        pointerEvents: "auto",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--color-panel-text)";
                        e.currentTarget.style.textDecoration = "underline";
                        const backdrop =
                          e.currentTarget.parentElement?.querySelector(
                            ".only-button-backdrop",
                          ) as HTMLElement;
                        if (backdrop) {
                          backdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          "var(--color-panel-text-secondary)";
                        e.currentTarget.style.textDecoration = "none";
                        const backdrop =
                          e.currentTarget.parentElement?.querySelector(
                            ".only-button-backdrop",
                          ) as HTMLElement;
                        if (backdrop) {
                          backdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                        }
                      }}
                    >
                      only
                    </button>
                  </div>
                </div>
              );
            }}
            itemHeight={36}
            maxHeight={350}
            virtualized={true}
            emptyStateText="No functions found"
          />
        </DropdownPanel>
      </div>
    </DropdownShell>
  );
};
