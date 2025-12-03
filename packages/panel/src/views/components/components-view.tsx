import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ComponentCard } from './components/component-card';
import { ComponentDetailSheet } from './components/component-detail-sheet';
import { useSheetSafe } from '../../contexts/sheet-context';
import { ALL_COMPONENTS } from './data';
import { CATEGORIES } from './constants';
import type { ComponentCategory, ComponentInfo } from '../../types/components';
import { useNpmDownloads } from './hooks/useNpmDownloads';

export const ComponentsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'All'>('All');
  const { openSheet } = useSheetSafe();

  // Fetch npm downloads for components that have npm packages
  const { downloads: npmDownloads } = useNpmDownloads({
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
    }).map((component) => {
      // Use npm downloads if available, otherwise use the fallback value
      if (component.npmPackage && npmDownloads.has(component.npmPackage)) {
        return {
          ...component,
          weeklyDownloads: npmDownloads.get(component.npmPackage) || component.weeklyDownloads,
        };
      }
      return component;
    });
  }, [searchQuery, selectedCategory, npmDownloads]);

  return (
    <div className="cp-components-view">
      {/* Sidebar */}
      <div className="cp-components-sidebar">
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cp-search-input"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="cp-components-categories">
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 0 8px 0',
            gap: '8px',
          }}>
            {CATEGORIES.map((category) => (
              <div
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 12px',
                  margin: '0 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: selectedCategory === category ? 'var(--color-panel-bg-tertiary)' : 'transparent',
                  color: selectedCategory === category ? 'var(--color-panel-text)' : 'var(--color-panel-text-secondary)',
                  transition: 'background-color 0.15s ease, opacity 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {category}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cp-components-main">

        {/* Component Cards Grid */}
        <div className="cp-components-grid">
          {filteredComponents.length > 0 ? (
            filteredComponents.map((component) => (
              <ComponentCard
                key={component.id}
                title={component.title}
                description={component.description}
                icon={component.icon}
                gradientFrom={component.gradientFrom}
                gradientTo={component.gradientTo}
                weeklyDownloads={component.weeklyDownloads}
                developer={component.developer}
                imageUrl={component.imageUrl}
                onClick={() => handleComponentClick(component)}
              />
            ))
          ) : (
            <div className="cp-components-empty">
              <p>No components found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
