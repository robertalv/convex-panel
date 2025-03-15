"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FilterMenuProps, FilterClause } from '../../types';
import { operatorOptions, typeOptions } from '../../utils/constants';
import { ChevronDownIcon } from '../../components/icons';

/**
 * Get portal container.
 */
const getPortalContainer = () => {
  let container = document.getElementById('portal-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'portal-root';
    container.className = 'convex-panel-container';
    document.body.appendChild(container);
  }
  return container;
};

/**
 * Filter menu.
 */
const FilterMenu: React.FC<FilterMenuProps> = ({ 
  /**
   * The field to which the filter is applied.
   * Used to identify the column or attribute being filtered.
   * @required
   */
  field, 

  /**
   * The position of the filter menu.
   * Determines where the filter menu is displayed on the screen.
   * @required
   */
  position, 

  /**
   * Callback function to apply the filter.
   * Called when the user applies the filter.
   * Receives the filter clause as a parameter.
   * @param filter FilterClause
   */
  onApply, 

  /**
   * Callback function to close the filter menu.
   * Called when the user closes the filter menu.
   */
  onClose, 

  /**
   * The existing filter clause, if any.
   * Used to pre-populate the filter menu with existing filter values.
   * @optional
   */
  existingFilter,

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * See ThemeClasses interface for available options.
   * @default {}
   */
  theme = {}
}) => {
  const isInternalClickRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [operator, setOperator] = useState<FilterClause['op']>(existingFilter?.op || 'eq');
  const [value, setValue] = useState<string>(existingFilter?.value !== undefined ? JSON.stringify(existingFilter.value) : '');
  const [isEditing, setIsEditing] = useState<boolean>(!!existingFilter);
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

  /**
   * Handle click outside to close the menu.
   */
  useEffect(() => {
    // Handle click outside to close the menu
    const handleClickOutside = (e: MouseEvent) => {
      // If this is an internal click that we're tracking, don't close
      if (isInternalClickRef.current) {
        isInternalClickRef.current = false;
        return;
      }
      
      // Only close if the click is outside the menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Handle escape key to close the menu
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Use mousedown for outside clicks (happens before mouseup/click)
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, field, position]);

  /**
   * Handle dropdown click outside.
   */
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutsideDropdown = (e: MouseEvent) => {
      // Don't close the dropdown if we're clicking inside the menu but outside the dropdown
      if (menuRef.current && menuRef.current.contains(e.target as Node) && 
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // Mark this as an internal click so the menu doesn't close
        isInternalClickRef.current = true;
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutsideDropdown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown);
    };
  }, [isOpen]);

  /**
   * Handle apply filter.
   */
  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Parse the value as JSON
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // If it's not valid JSON, use the raw string
        parsedValue = value;
      }
      
      const filter: FilterClause = {
        field,
        op: operator,
        value: parsedValue,
        enabled: true
      };
      
      onApply(filter);
      onClose();
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  };

  /**
   * Handle cancel.
   */
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  /**
   * Handle dropdown toggle.
   */
  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Mark this as an internal click
    isInternalClickRef.current = true;
    setIsOpen(!isOpen);
  };

  /**
   * Handle option select.
   */
  const handleOptionSelect = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Mark this as an internal click
    isInternalClickRef.current = true;
    setOperator(optionValue as FilterClause['op']);
    setIsOpen(false);
  };

  /**
   * Handle mousedown inside the menu to prevent it from closing.
   */
  const handleMenuMouseDown = (e: React.MouseEvent) => {
    // Mark this as an internal click
    isInternalClickRef.current = true;
    e.stopPropagation();
  };

  /**
   * Handle type filter toggle.
   */
  const handleTypeFilterToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isInternalClickRef.current = true;
    setIsTypeFilterOpen(!isTypeFilterOpen);
  };

  /**
   * Handle type select.
   */
  const handleTypeSelect = (typeValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isInternalClickRef.current = true;
    setValue(typeValue);
    setIsTypeFilterOpen(false);
  };

  /**
   * Update effect to handle type filter dropdown.
   */
  useEffect(() => {
    if (!isTypeFilterOpen) return;
    
    const handleClickOutsideTypeDropdown = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node) && 
          typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        isInternalClickRef.current = true;
        setIsTypeFilterOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutsideTypeDropdown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideTypeDropdown);
    };
  }, [isTypeFilterOpen]);

  return createPortal(
    <div 
      ref={menuRef}
      className="convex-panel-filter-menu"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999, // Make sure it's on top
        position: 'fixed', // Ensure fixed positioning
        background: '#171717',
        border: '2px solid #404040',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={handleMenuMouseDown}
    >
      <div className="convex-panel-filter-menu-group">
        <label className="convex-panel-filter-menu-label">Operator</label>
        <div 
          ref={dropdownRef}
          className="convex-panel-filter-menu-dropdown"
        >
          <button
            type="button"
            onClick={handleDropdownToggle}
            onMouseDown={(e) => e.stopPropagation()}
            className="convex-panel-filter-menu-dropdown-button"
          >
            <span>
              {operatorOptions.find(opt => opt.value === operator)?.label || 'Select operation'}
            </span>
            <ChevronDownIcon />
          </button>
          
          {isOpen && (
            <div 
              className="convex-panel-filter-menu-dropdown-content"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {operatorOptions.map(option => (
                <button
                  type="button"
                  key={option.value}
                  className={`convex-panel-filter-menu-option ${operator === option.value ? 'convex-panel-filter-menu-option-selected' : ''}`}
                  onClick={(e) => handleOptionSelect(option.value, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="convex-panel-filter-menu-group-value">
        <label className="convex-panel-filter-menu-label">Value</label>
        {(operator === 'isType' || operator === 'isNotType') ? (
          <div 
            ref={typeDropdownRef}
            className="convex-panel-filter-menu-dropdown"
          >
            <button
              type="button"
              onClick={handleTypeFilterToggle}
              onMouseDown={(e) => e.stopPropagation()}
              className="convex-panel-filter-menu-dropdown-button"
            >
              <span>
                {typeOptions.find(opt => opt.value === value)?.label || 'Select type'}
              </span>
              <ChevronDownIcon />
            </button>
            
            {isTypeFilterOpen && (
              <div 
                className="convex-panel-filter-menu-dropdown-content"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {typeOptions.map(option => (
                  <button
                    type="button"
                    key={option.value}
                    className={`convex-panel-filter-menu-option ${value === option.value ? 'convex-panel-filter-menu-option-selected' : ''}`}
                    onClick={(e) => handleTypeSelect(option.value, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="convex-panel-filter-menu-textarea"
              placeholder='Enter value (e.g. "text", 123, true)'
            />
            <p className="convex-panel-filter-menu-hint">
              For arrays or objects, use valid JSON format
            </p>
          </>
        )}
      </div>
      
      <div className="convex-panel-filter-menu-actions">
        <button
          type="button"
          onClick={handleCancel}
          onMouseDown={(e) => e.stopPropagation()}
          className="convex-panel-filter-menu-cancel-button"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          onMouseDown={(e) => e.stopPropagation()}
          className="convex-panel-filter-menu-apply-button"
        >
          {isEditing ? 'Update Filter' : 'Apply Filter'}
        </button>
      </div>
    </div>,
    getPortalContainer()
  );
};

export default FilterMenu;