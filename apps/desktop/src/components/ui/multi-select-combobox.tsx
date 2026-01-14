/**
 * MultiSelectCombobox Component
 * Ported from dashboard-common (@convex-dev/design-system)
 * A multi-select dropdown with search functionality
 */

import {
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton as HeadlessComboboxButton,
  ComboboxOptions as HeadlessComboboxOptions,
  ComboboxOption as HeadlessComboboxOption,
  ComboboxInput as HeadlessComboboxInput,
  Label,
} from "@headlessui/react";
import React, { useRef, useState, useEffect } from "react";
import classNames from "classnames";
import { cn } from "@/lib/utils";
import { useHoverDirty } from "react-use";
import { test } from "fuzzy";
import { Button } from "./button";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";

const MAX_DISPLAYED_OPTIONS = 100;

export type MultiSelectValue = string[] | "all";

export function MultiSelectCombobox({
  options,
  selectedOptions,
  setSelectedOptions,
  unit,
  unitPlural,
  label,
  labelHidden = false,
  Option,
  disableSearch = false,
  processFilterOption = (option) => option,
}: {
  options: string[];
  selectedOptions: MultiSelectValue;
  setSelectedOptions(newValue: MultiSelectValue): void;
  unit: string;
  unitPlural: string;
  label: string;
  labelHidden?: boolean;
  Option?: React.ComponentType<{ label: string; inButton: boolean }>;
  disableSearch?: boolean;
  processFilterOption?: (option: string) => string;
}) {
  const [query, setQuery] = useState("");
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );

  // Force tabindex to 0
  useEffect(() => {
    if (referenceElement?.children[0]) {
      (referenceElement.children[0] as HTMLElement).tabIndex = 0;
    }
  }, [referenceElement]);

  const [isOpen, setIsOpen] = useState(false);

  const { styles, attributes, update } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: "bottom-start",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 4],
          },
        },
      ],
    },
  );

  // Get the width for the dropdown
  const getOptionsWidth = () => {
    if (!referenceElement) return undefined;
    return `${referenceElement.offsetWidth}px`;
  };

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => test(query, processFilterOption(option)));

  const hasMoreThanMax = filteredOptions.length > MAX_DISPLAYED_OPTIONS;
  const displayedOptions = hasMoreThanMax
    ? filteredOptions.slice(0, MAX_DISPLAYED_OPTIONS)
    : filteredOptions;

  // Convert to internal array representation for Combobox
  const selectedArray = selectedOptions === "all" ? options : selectedOptions;

  const count =
    selectedOptions === "all"
      ? options.length
      : selectedOptions.filter((name) => name !== "_other").length;

  const displayValue =
    selectedOptions === "all"
      ? `All ${unitPlural}`
      : `${count} ${count !== 1 ? unitPlural : unit}`;

  // Update popper position when dropdown opens
  useEffect(() => {
    if (isOpen && update) {
      void update();
    }
  }, [isOpen, update]);

  const handleSelectAll = () => {
    if (selectedOptions === "all") {
      setSelectedOptions([]);
    } else {
      setSelectedOptions("all");
    }
  };

  return (
    <HeadlessCombobox
      value={selectedArray}
      onChange={(newSelection) => {
        // Check if all options are selected and convert to "all" state
        if (newSelection.length === options.length) {
          setSelectedOptions("all");
        } else {
          setSelectedOptions(newSelection);
        }
      }}
      multiple
    >
      {({ open }) => {
        // Update isOpen state when open changes
        if (open !== isOpen) {
          setIsOpen(open);
        }

        return (
          <>
            <Label
              className={classNames(
                "flex gap-1 text-sm font-semibold",
                labelHidden ? "hidden" : "mb-2",
              )}
              hidden={labelHidden}
            >
              {label}
            </Label>

            <div className="relative">
              <div
                ref={setReferenceElement}
                className={cn("relative flex items-center")}
              >
                <HeadlessComboboxButton
                  className={classNames(
                    "flex gap-2 w-full justify-between",
                    "truncate relative rounded-md py-1.5 px-1.5 text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed",
                    "border border-input",
                    "focus:border-ring focus:outline-none bg-background hover:bg-accent/10",
                    open && "border-ring",
                  )}
                  style={{
                    color: "var(--color-text-primary)",
                  }}
                >
                  {displayValue}
                  <ChevronDownIcon
                    className={cn(
                      "relative z-30 -ml-6 h-5 w-5 transition-all",
                      open && "rotate-180",
                    )}
                  />
                </HeadlessComboboxButton>
              </div>

              {open &&
                createPortal(
                  <div
                    ref={setPopperElement}
                    style={{
                      ...styles.popper,
                      width: getOptionsWidth(),
                    }}
                    {...attributes.popper}
                    className="z-50"
                  >
                    <HeadlessComboboxOptions
                      modal={false}
                      static
                      className="scrollbar max-h-60 w-fit max-w-80 min-w-full overflow-auto rounded-md border bg-popover pb-1 text-xs shadow-md focus:outline-none"
                    >
                      <div className="min-w-fit">
                        {!disableSearch && (
                          <div className="sticky top-0 left-0 z-20 flex w-full items-center gap-1 border-b bg-popover px-2 pt-1">
                            <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
                            <HeadlessComboboxInput
                              onChange={(event) => setQuery(event.target.value)}
                              value={query}
                              autoFocus
                              placeholder={`Search ${unitPlural}...`}
                              className={classNames(
                                "placeholder:text-muted-foreground relative w-full py-1.5 text-left text-xs disabled:cursor-not-allowed",
                                "focus:outline-none bg-transparent",
                              )}
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          className="w-full cursor-pointer p-2 pl-7 text-left hover:bg-accent"
                          onClick={handleSelectAll}
                        >
                          {selectedOptions === "all"
                            ? "Deselect all"
                            : "Select all"}
                        </button>

                        {displayedOptions.map((option) => (
                          <ComboboxOption
                            key={option}
                            value={option}
                            label={
                              Option ? (
                                <Option label={option} inButton={false} />
                              ) : (
                                option
                              )
                            }
                            onOnly={() => {
                              setSelectedOptions([option]);
                            }}
                          />
                        ))}

                        {hasMoreThanMax && (
                          <div className="w-fit min-w-full cursor-default px-2 py-1.5 text-muted-foreground select-none">
                            Too many items to display, use the searchbar to
                            filter {unitPlural}.
                          </div>
                        )}
                      </div>
                    </HeadlessComboboxOptions>
                  </div>,
                  document.body,
                )}
            </div>
          </>
        );
      }}
    </HeadlessCombobox>
  );
}

function ComboboxOption({
  value,
  label,
  onOnly,
}: {
  value: string;
  label: React.ReactNode | string;
  onOnly: () => void;
}) {
  const onlyRefs = useRef<HTMLButtonElement>(null);
  const isHoveringOnly = useHoverDirty(onlyRefs as React.RefObject<Element>);
  return (
    <HeadlessComboboxOption
      value={value}
      className={({ focus }) =>
        classNames(
          "w-fit min-w-full flex gap-1 cursor-pointer select-none p-2 group",
          focus && "bg-accent",
        )
      }
      disabled={isHoveringOnly}
    >
      {({ selected }) => (
        <>
          {selected ? (
            <CheckIcon className="h-4 min-w-[1rem]" aria-hidden="true" />
          ) : (
            <span className="min-w-[1rem]" />
          )}
          <span
            className={classNames(
              "flex gap-2 w-full whitespace-nowrap",
              selected && "font-semibold",
            )}
          >
            {label}
            <Button
              ref={onlyRefs}
              className="invisible text-xs font-normal text-muted-foreground group-hover:visible hover:underline"
              variant="ghost"
              size="sm"
              onClick={onOnly}
            >
              only
            </Button>
          </span>
        </>
      )}
    </HeadlessComboboxOption>
  );
}
