import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useThemeSafe } from '../../../hooks/useTheme';
import { usePortalTarget } from '../../../contexts/portal-context';

export interface DateFilter {
  type: 'any' | 'last24h' | 'last7d' | 'last30d' | 'last90d' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

interface DateFilterDropdownProps {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
  triggerButton: React.ReactNode;
}

const PRESET_OPTIONS = [
  { type: 'any' as const, label: 'Any time', description: 'Show all results' },
  { type: 'last24h' as const, label: 'Last 24 hours' },
  { type: 'last7d' as const, label: 'Last 7 days' },
  { type: 'last30d' as const, label: 'Last 30 days' },
  { type: 'last90d' as const, label: 'Last 90 days' },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDateRange(type: DateFilter['type']): { start: Date; end: Date } | null {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (type) {
    case 'any':
      return null;
    case 'last24h':
      return {
        start: new Date(end.getTime() - 24 * 60 * 60 * 1000),
        end,
      };
    case 'last7d':
      return {
        start: new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000),
        end,
      };
    case 'last30d':
      return {
        start: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000),
        end,
      };
    case 'last90d':
      return {
        start: new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000),
        end,
      };
    default:
      return null;
  }
}

function formatDateRange(start: Date, end: Date): string {
  const formatDate = (date: Date) => {
    const month = date.toLocaleString('default', { month: 'short' });
    return `${month} ${date.getDate()}, ${date.getFullYear()}`;
  };
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export const DateFilterDropdown: React.FC<DateFilterDropdownProps> = ({
  value,
  onChange,
  triggerButton,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    value.type === 'custom' && value.startDate ? new Date(value.startDate) : null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    value.type === 'custom' && value.endDate ? new Date(value.endDate) : null
  );
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const { theme } = useThemeSafe();
  const portalTarget = usePortalTarget();
  
  // Sync state when value changes
  useEffect(() => {
    if (value.type === 'custom') {
      setSelectedStartDate(value.startDate ? new Date(value.startDate) : null);
      setSelectedEndDate(value.endDate ? new Date(value.endDate) : null);
    } else {
      setSelectedStartDate(null);
      setSelectedEndDate(null);
    }
  }, [value]);
  
  // Calculate second month (next month)
  const getSecondMonth = () => {
    if (currentMonth === 11) {
      return { month: 0, year: currentYear + 1 };
    }
    return { month: currentMonth + 1, year: currentYear };
  };
  
  const secondMonthData = getSecondMonth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 900),
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Use a small delay to avoid immediate closure when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const handlePresetSelect = (type: DateFilter['type']) => {
    if (type === 'any') {
      onChange({ type: 'any' });
    } else {
      const range = getDateRange(type);
      if (range) {
        onChange({
          type,
          startDate: range.start,
          endDate: range.end,
        });
      }
    }
    setIsOpen(false);
  };

  const handleCustomDateSelect = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      setSelectedStartDate(normalizedDate);
      setSelectedEndDate(null);
    } else if (selectedStartDate && !selectedEndDate) {
      // Complete the range
      const normalizedStart = normalizeDate(selectedStartDate);
      if (normalizedDate < normalizedStart) {
        setSelectedEndDate(normalizedStart);
        setSelectedStartDate(normalizedDate);
      } else {
        setSelectedEndDate(normalizedDate);
      }
    }
  };

  const applyCustomRange = () => {
    if (selectedStartDate && selectedEndDate) {
      onChange({
        type: 'custom',
        startDate: selectedStartDate,
        endDate: selectedEndDate,
      });
      setIsOpen(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = (month: number, year: number, isFirst: boolean) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const isDateInRange = (day: number | null, month: number, year: number) => {
      if (!day || !selectedStartDate) return false;
      const date = normalizeDate(new Date(year, month, day));
      const normalizedStart = normalizeDate(selectedStartDate);
      if (selectedEndDate) {
        const normalizedEnd = normalizeDate(selectedEndDate);
        return date >= normalizedStart && date <= normalizedEnd;
      }
      return date.getTime() === normalizedStart.getTime();
    };

    const isDateSelected = (day: number | null, month: number, year: number) => {
      if (!day || !selectedStartDate) return false;
      const date = normalizeDate(new Date(year, month, day));
      const normalizedStart = normalizeDate(selectedStartDate);
      if (selectedEndDate) {
        const normalizedEnd = normalizeDate(selectedEndDate);
        return date.getTime() === normalizedStart.getTime() || 
               date.getTime() === normalizedEnd.getTime();
      }
      return date.getTime() === normalizedStart.getTime();
    };

    const isToday = (day: number | null, month: number, year: number) => {
      if (!day) return false;
      const today = new Date();
      return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <button
            onClick={() => {
              if (isFirst) {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-panel-text)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-panel-text)',
          }}>
            {MONTHS[month]} {year}
          </div>
          <button
            onClick={() => {
              if (isFirst) {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-panel-text)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '8px',
        }}>
          {DAYS.map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-panel-text-muted)',
                padding: '4px',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
        }}>
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} />;
            }

            const date = new Date(year, month, day);
            const inRange = isDateInRange(day, month, year);
            const selected = isDateSelected(day, month, year);
            const today = isToday(day, month, year);

            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCustomDateSelect(date);
                }}
                style={{
                  aspectRatio: '1',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: selected
                    ? 'var(--color-panel-accent)'
                    : inRange
                    ? 'color-mix(in srgb, var(--color-panel-accent) 20%, transparent)'
                    : 'transparent',
                  color: selected
                    ? 'white'
                    : today
                    ? 'var(--color-panel-accent)'
                    : 'var(--color-panel-text)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: selected || today ? 600 : 400,
                  position: 'relative',
                  transition: 'all 0.15s',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    e.currentTarget.style.backgroundColor = inRange
                      ? 'color-mix(in srgb, var(--color-panel-accent) 30%, transparent)'
                      : 'var(--color-panel-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    e.currentTarget.style.backgroundColor = inRange
                      ? 'color-mix(in srgb, var(--color-panel-accent) 20%, transparent)'
                      : 'transparent';
                  }
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {triggerButton}
      </div>

      {isOpen && position && portalTarget && createPortal(
        <div
          ref={dropdownRef}
          className={`cp-theme-${theme}`}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            backgroundColor: 'var(--color-panel-bg)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px var(--color-panel-shadow)',
            zIndex: 100000,
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Main Content Row */}
          <div style={{
            display: 'flex',
            gap: '16px',
          }}>
            {/* Preset Options */}
            <div style={{
              minWidth: '300px',
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
            {PRESET_OPTIONS.map((option) => {
              const isSelected = value.type === option.type;
              const range = option.type !== 'any' ? getDateRange(option.type) : null;
              const rangeText = range ? formatDateRange(range.start, range.end) : null;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePresetSelect(option.type);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    backgroundColor: isSelected ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background-color 0.15s',
                    pointerEvents: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                  }}>
                    {isSelected && (
                      <Check size={14} style={{ color: 'var(--color-panel-accent)', flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 500 : 400,
                      color: 'var(--color-panel-text)',
                    }}>
                      {option.label}
                    </span>
                  </div>
                  {(option.description || rangeText) && (
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-panel-text-muted)',
                      marginTop: '2px',
                      marginLeft: isSelected ? '22px' : '0',
                    }}>
                      {option.description || rangeText}
                    </span>
                  )}
                </button>
              );
            })}
            </div>

            {/* Calendar View */}
            <div style={{
              flex: 1,
              display: 'flex',
              gap: '24px',
              padding: '8px',
              minWidth: 0,
            }}>
              {renderCalendar(currentMonth, currentYear, true)}
              {renderCalendar(secondMonthData.month, secondMonthData.year, false)}
            </div>
          </div>

          {/* Custom Range Actions */}
          {(selectedStartDate || selectedEndDate || value.type === 'custom') && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '8px',
              borderTop: '1px solid var(--color-panel-border)',
              marginTop: '8px',
              width: '100%',
            }}>
              {selectedStartDate && (
                <div style={{
                  fontSize: '12px',
                  color: 'var(--color-panel-text-muted)',
                  marginBottom: '4px',
                }}>
                  {selectedEndDate 
                    ? `Selected: ${formatDateRange(selectedStartDate, selectedEndDate)}`
                    : `Start: ${formatDateRange(selectedStartDate, selectedStartDate).split(' – ')[0]}`
                  }
                </div>
              )}
              {selectedStartDate && !selectedEndDate && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--color-panel-text-muted)',
                  fontStyle: 'italic',
                  marginBottom: '8px',
                }}>
                  Click another date to set the end date
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyCustomRange();
                }}
                disabled={!selectedStartDate || !selectedEndDate}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-panel-accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: (!selectedStartDate || !selectedEndDate) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedStartDate || !selectedEndDate) ? 0.5 : 1,
                  pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                  if (selectedStartDate && selectedEndDate) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedStartDate && selectedEndDate) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                  }
                }}
              >
                Apply Custom Range
              </button>
            </div>
          )}
        </div>,
        portalTarget
      )}
    </>
  );
};

