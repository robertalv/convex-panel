import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  DropdownShell,
  DropdownTrigger,
  DropdownPanel,
  DropdownSearch,
} from '../dropdowns';
import { useDropdownWidth } from '../../hooks/dropdowns';
import { useThemeSafe } from '../../hooks/useTheme';
import type { MultiSelectValue } from '../../types/common';

function fuzzyMatch(query: string, text: string): boolean {
  const normalizedQuery = query.toLowerCase();
  const normalizedText = text.toLowerCase();
  return normalizedText.includes(normalizedQuery);
}

export interface MultiSelectComboboxProps {
  options: string[];
  selectedOptions: MultiSelectValue;
  setSelectedOptions: (newValue: MultiSelectValue) => void;
  unit: string;
  unitPlural: string;
  label?: string;
  labelHidden?: boolean;
  Option?: React.ComponentType<{ label: string; inButton: boolean }>;
  disableSearch?: boolean;
  processFilterOption?: (option: string) => string;
  triggerIcon?: ReactNode;
}

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
  triggerIcon,
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeSafe();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const uniqueOptions = Array.from(new Set(options));
    if (query === '') {
      return uniqueOptions;
    }
    return uniqueOptions.filter((option) => {
      const processedOption = processFilterOption(option);
      return fuzzyMatch(query, processedOption);
    });
  }, [query, options, processFilterOption]);

  const dropdownWidth = useDropdownWidth(
    triggerRef,
    isOpen,
    filteredOptions,
    (option) => processFilterOption(option),
    {
      searchPlaceholder: `Search ${unitPlural}...`,
      checkboxWidth: 16,
      iconWidth: 0,
      minWidth: 200,
    }
  );

  const count =
    selectedOptions === 'all'
      ? options.length
      : selectedOptions.filter((name) => name !== '_other').length;

  const displayValue =
    selectedOptions === 'all'
      ? `All ${unitPlural}`
      : `${count} ${count !== 1 ? unitPlural : unit}`;

  const handleSelectAll = () => {
    if (selectedOptions === 'all') {
      setSelectedOptions([]);
    } else {
      setSelectedOptions('all');
    }
  };

  const handleToggleOption = (option: string) => {
    if (selectedOptions === 'all') {
      setSelectedOptions([option]);
    } else {
      const currentSelection = selectedOptions as string[];
      if (currentSelection.includes(option)) {
        const newSelection = currentSelection.filter((o) => o !== option);
        if (newSelection.length === options.length) {
          setSelectedOptions('all');
        } else {
          setSelectedOptions(newSelection);
        }
      } else {
        const newSelection = [...currentSelection, option];
        if (newSelection.length === options.length) {
          setSelectedOptions('all');
        } else {
          setSelectedOptions(newSelection);
        }
      }
    }
  };

  const handleSelectOnly = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOptions([option]);
  };

  const isOptionSelected = (option: string): boolean => {
    if (selectedOptions === 'all') {
      return true;
    }
    return selectedOptions.includes(option);
  };

  const allSelected = selectedOptions === 'all';
  const someSelected = selectedOptions !== 'all' && selectedOptions.length > 0;

  return (
    <DropdownShell isOpen={isOpen} onOpenChange={setIsOpen}>
      {label && !labelHidden && (
        <label
          style={{
            display: 'flex',
            gap: '4px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--color-panel-text)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <div ref={triggerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <DropdownTrigger
            isOpen={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            {triggerIcon}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayValue}
            </span>
          </DropdownTrigger>
        </div>

        <DropdownPanel
          isOpen={isOpen}
          width={dropdownWidth}
          maxHeight={240}
          triggerRef={triggerRef as React.RefObject<HTMLElement>}
          className={`cp-theme-${theme}`}
          // style={{
          //   backgroundColor: 'var(--color-panel-bg)',
          // }}
        >
          {!disableSearch && (
            <DropdownSearch
              value={query}
              onChange={setQuery}
              placeholder={`Search ${unitPlural}...`}
              onEscape={() => setIsOpen(false)}
              autoFocus
            />
          )}

          {/* Select All Option */}
          <div
            onClick={handleSelectAll}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              color:
                allSelected || someSelected
                  ? 'var(--color-panel-text)'
                  : 'var(--color-panel-text-secondary)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--color-panel-border)',
            }}
          >
            {allSelected ? (
              <Check
                size={16}
                style={{
                  color: 'var(--color-panel-accent)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{ width: '16px', flexShrink: 0 }} />
            )}
            <span>
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--color-panel-text-muted)',
                  fontSize: '12px',
                }}
              >
                No {unitPlural} found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = isOptionSelected(option);
                const optionLabel = Option ? (
                  <Option label={option} inButton={false} />
                ) : (
                  option
                );

                return (
                  <div
                    key={option}
                    onClick={() => handleToggleOption(option)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: isSelected
                        ? 'var(--color-panel-text)'
                        : 'var(--color-panel-text-secondary)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      const onlyButtonWrapper = e.currentTarget.querySelector(
                        '.only-button-wrapper'
                      ) as HTMLElement;
                      const onlyButtonBackdrop = e.currentTarget.querySelector(
                        '.only-button-backdrop'
                      ) as HTMLElement;
                      if (onlyButtonWrapper) {
                        onlyButtonWrapper.style.opacity = '1';
                        onlyButtonWrapper.style.transform = 'translateX(0)';
                      }
                      if (onlyButtonBackdrop) {
                        onlyButtonBackdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      const onlyButtonWrapper = e.currentTarget.querySelector(
                        '.only-button-wrapper'
                      ) as HTMLElement;
                      const onlyButtonBackdrop = e.currentTarget.querySelector(
                        '.only-button-backdrop'
                      ) as HTMLElement;
                      if (onlyButtonWrapper) {
                        onlyButtonWrapper.style.opacity = '0';
                        onlyButtonWrapper.style.transform = 'translateX(100%)';
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
                          color: 'var(--color-panel-accent)',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{ width: '16px', flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: isSelected ? 600 : 400,
                        minWidth: 0,
                        transition: 'flex 0.15s ease',
                      }}
                    >
                      {optionLabel}
                    </span>
                    <div
                      className="only-button-wrapper"
                      style={{
                        marginLeft: 'auto',
                        flexShrink: 0,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0,
                        transform: 'translateX(100%)',
                        transition: 'opacity 0.15s ease, transform 0.15s ease',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        className="only-button-backdrop"
                        style={{
                          position: 'absolute',
                          right: '-50px',
                          top: 0,
                          bottom: 0,
                          left: '-20px',
                      background: `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`,
                          pointerEvents: 'none',
                          transition: 'background 0.15s ease',
                          zIndex: 0,
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSelectOnly(option, e)}
                        className="only-button"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-panel-text-secondary)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          padding: 0,
                          lineHeight: 1,
                          position: 'relative',
                          zIndex: 1,
                          pointerEvents: 'auto',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text)';
                          e.currentTarget.style.textDecoration = 'underline';
                          const backdrop = e.currentTarget.parentElement?.querySelector(
                            '.only-button-backdrop'
                          ) as HTMLElement;
                          if (backdrop) {
                        backdrop.style.background = `linear-gradient(to right, transparent, transparent 10px, transparent 15px, transparent 20px, transparent calc(100% - 30px), transparent)`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
                          e.currentTarget.style.textDecoration = 'none';
                          const backdrop = e.currentTarget.parentElement?.querySelector(
                            '.only-button-backdrop'
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
              })
            )}
          </div>
        </DropdownPanel>
      </div>
    </DropdownShell>
  );
}
