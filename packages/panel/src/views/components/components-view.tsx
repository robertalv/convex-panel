import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ComponentTable } from './components/component-table';
import { ComponentDetailSheet } from './components/component-detail-sheet';
import { useSheetSafe } from '../../contexts/sheet-context';
import { ALL_COMPONENTS } from './data';
import { CATEGORIES } from './constants';
import type { ComponentCategory, ComponentInfo } from '../../types/components';
import { useNpmPackageData } from './hooks/useNpmDownloads';

export const ComponentsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'All'>('All');
  const { openSheet } = useSheetSafe();

  const { packageData: npmPackageData } = useNpmPackageData({
    components: ALL_COMPONENTS,
    enabled: true,
  });

  const handleComponentClick = (component: ComponentInfo) => {
    openSheet({
      title: component.title,
      width: '600px',
      content: <ComponentDetailSheet component={component} />,
    });
  };

  const filteredComponents = useMemo(() => {
    return ALL_COMPONENTS.filter((component) => {
      const matchesSearch = 
        component.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'All' || component.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="cp-components-view">
      {/* Sidebar */}
      <div style={{
        width: '240px',
        borderRight: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Search Bar */}
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid var(--color-panel-border)',
            backgroundColor: 'var(--color-panel-bg)',
          }}
        >
          <div className="cp-search-wrapper">
            <Search size={14} className="cp-search-icon" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cp-search-input"
            />
          </div>
        </div>

        {/* Categories */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}>
          <div style={{ gap: '4px', display: 'flex', flexDirection: 'column', color: 'var(--color-panel-text-secondary)', fontSize: '12px' }}>
            {CATEGORIES.map((category) => (
              <div
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 12px',
                  margin: '0 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: selectedCategory === category ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                  color: selectedCategory === category ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                    e.currentTarget.style.opacity = '0.5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                <span style={{ fontSize: '12px' }}>{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cp-components-main" style={{ padding: '0px' }}>
        {filteredComponents.length > 0 ? (
          <ComponentTable
            components={filteredComponents}
            npmPackageData={npmPackageData}
            onComponentClick={handleComponentClick}
          />
        ) : (
          <div className="cp-components-empty" style={{
            padding: '48px',
            textAlign: 'center',
            color: 'var(--color-panel-text-secondary)',
          }}>
            <p>No components found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
