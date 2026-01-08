import React from 'react';
import type { ComponentInfo } from '../../../types/components';
import type { NpmPackageExtendedInfo } from "../utils/npm";
import { AvatarGroup } from './avatar-group';

export interface ComponentTableProps {
  components: ComponentInfo[];
  npmPackageData: Map<string, NpmPackageExtendedInfo>;
  onComponentClick: (component: ComponentInfo) => void;
}

export const ComponentTable: React.FC<ComponentTableProps> = ({
  components,
  npmPackageData,
  onComponentClick,
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--color-panel-bg)' }}>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        borderBottom: '1px solid var(--cp-data-row-border)',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--color-panel-text-muted)',
        backgroundColor: 'var(--color-panel-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ width: '20%', display: 'flex', alignItems: 'center' }}>Title</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>Description</div>
        <div style={{ width: '180px', display: 'flex', alignItems: 'center' }}>Category</div>
        <div style={{ width: '140px', display: 'flex', alignItems: 'center' }}>Maintainers</div>
        <div style={{ width: '200px', display: 'flex', alignItems: 'center' }}>NPM Package</div>
        <div style={{ width: '140px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '24px' }}>Downloads</div>
        <div style={{ width: '100px', display: 'flex', alignItems: 'center', paddingLeft: '24px' }}>Version</div>
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-panel-bg)' }}>
        {components.map((component) => {
          const npmData = component.npmPackage
            ? npmPackageData.get(component.npmPackage)
            : undefined;

          const weeklyDownloads =
            npmData?.weeklyDownloads ||
            npmData?.downloads ||
            component.weeklyDownloads ||
            0;

          return (
            <div
              key={component.id}
              onClick={() => onComponentClick(component)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onComponentClick(component);
                }
              }}
              tabIndex={0}
              role="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid var(--cp-data-row-border)',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--color-panel-text-secondary)',
                backgroundColor: '',
                cursor: 'pointer',
                transition: 'background-color 0.35s ease',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              {/* Title */}
              <div style={{
                width: '20%',
                fontWeight: 400,
                color: 'var(--color-panel-text)',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}>
                {component.title}
              </div>

              {/* Description */}
              <div style={{
                flex: 1,
                color: 'var(--color-panel-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
              title={component.description}
              >
                {component.description.length > 60
                  ? `${component.description.substring(0, 60)}...`
                  : component.description}
              </div>

              {/* Category */}
              <div style={{
                width: '180px',
                color: 'var(--color-panel-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'inherit',
              }}>
                {component.category}
              </div>

              {/* Maintainers */}
              <div style={{
                width: '140px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'inherit',
              }}>
                {npmData?.maintainers && npmData.maintainers.length > 0 ? (
                  <AvatarGroup
                    maintainers={npmData.maintainers}
                    size={20}
                    maxVisible={3}
                  />
                ) : component.developer ? (
                  <span style={{
                    color: 'var(--color-panel-text-secondary)',
                    fontSize: '12px',
                  }}>
                    {component.developer}
                  </span>
                ) : null}
              </div>

              {/* NPM Package */}
              <div style={{
                width: '200px',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'monospace',
              }}>
                {component.npmPackage ? (
                  <a
                    href={
                      component.packageUrl ||
                      `https://www.npmjs.com/package/${component.npmPackage}`
                    }
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-panel-accent)',
                      textDecoration: 'none',
                      fontSize: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'text-decoration 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {component.npmPackage}
                  </a>
                ) : (
                  <span style={{
                    color: 'var(--color-panel-text-muted)',
                    fontSize: '12px',
                  }}>
                    —
                  </span>
                )}
              </div>

              {/* Downloads */}
              <div style={{
                width: '140px',
                color: 'var(--color-panel-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                fontFamily: 'monospace',
                paddingRight: '24px',
              }}>
                {typeof weeklyDownloads === 'number'
                  ? weeklyDownloads.toLocaleString()
                  : weeklyDownloads || '—'}
              </div>

              {/* Version */}
              <div style={{
                width: '100px',
                color: 'var(--color-panel-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'monospace',
                paddingLeft: '24px',
              }}>
                {npmData?.version || '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
