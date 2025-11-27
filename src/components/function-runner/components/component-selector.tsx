import React, { useState, useRef, useEffect } from 'react';
import { Code as CodeIcon, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface ComponentSelectorProps {
  selectedComponent: string | null;
  onSelect: (component: string | null) => void;
  components?: string[];
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  selectedComponent,
  onSelect,
  components = ['app'],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredComponents = components.filter(comp =>
    comp.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayValue = selectedComponent || 'app';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '-webkit-fill-available',
          height: '36px',
          padding: '0 12px',
          backgroundColor: '#16181D',
          border: isOpen ? '1px solid #3B82F6' : '1px solid #2D313A',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#999';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#2D313A';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#e5e7eb' }}>
          <span style={{ color: '#999' }}>
            <CodeIcon style={{ width: '14px', height: '14px' }} />
          </span>
          <span>{displayValue}</span>
        </div>
        {isOpen ? (
          <ChevronUp style={{ width: '14px', height: '14px', color: '#999' }} />
        ) : (
          <ChevronDown style={{ width: '14px', height: '14px', color: '#999' }} />
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#0F1115',
            border: '1px solid #2D313A',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search */}
          <div style={{ padding: '8px', borderBottom: '1px solid #2D313A' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                    setSearchQuery('');
                  }
                }}
                autoFocus
                style={{
                  width: '-webkit-fill-available ',
                  backgroundColor: '#16181D',
                  border: '1px solid #2D313A',
                  borderRadius: '4px',
                  height: '28px',
                  paddingLeft: '28px',
                  paddingRight: '8px',
                  fontSize: '12px',
                  color: '#fff',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#2D313A';
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ 
            maxHeight: '250px', 
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
          }}>
            {filteredComponents.length > 0 ? (
              filteredComponents.map((component) => (
                <div
                  key={component}
                  onClick={() => {
                    onSelect(component);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: selectedComponent === component ? '#fff' : '#d1d5db',
                    backgroundColor: selectedComponent === component ? '#2D313A' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedComponent !== component) {
                      e.currentTarget.style.backgroundColor = '#1C1F26';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedComponent !== component) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <CodeIcon style={{ width: '14px', height: '14px', color: '#999' }} />
                  <span>{component}</span>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '12px',
                  fontSize: '12px',
                  color: '#9ca3af',
                  textAlign: 'center',
                }}
              >
                No components found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

