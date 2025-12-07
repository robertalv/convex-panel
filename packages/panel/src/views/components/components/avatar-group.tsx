import React, { useState, useEffect, useRef } from 'react';
import type { NpmMaintainer } from '../utils/npm';
import { getGravatarUrl } from '../utils/gravatar';
import { useSheetSafe } from '../../../contexts/sheet-context';
import { MaintainersSheet } from './maintainers-sheet';

export interface AvatarGroupProps {
  maintainers: NpmMaintainer[];
  size?: number;
  maxVisible?: number;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  maintainers,
  size = 20,
  maxVisible = 3,
}) => {
  const [avatarUrls, setAvatarUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const avatarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { openSheet } = useSheetSafe();

  useEffect(() => {
    if (maintainers.length === 0) {
      setLoading(false);
      return;
    }

    const loadAvatars = async () => {
      try {
        setLoading(true);

        const finalUrls = new Map<string, string>();
        
        maintainers.forEach((maintainer) => {
          if (!maintainer.email) return;
          
          const gravatarUrl = getGravatarUrl(maintainer.email, size);
          if (gravatarUrl) {
            finalUrls.set(maintainer.email, gravatarUrl);
          }
        });
        
        setAvatarUrls(finalUrls);
      } catch (error) {
        console.error('[AvatarGroup] Failed to load avatars:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvatars();
  }, [maintainers, size]);

  const checkTooltipPosition = (index: number) => {
    const avatarElement = avatarRefs.current[index];
    if (!avatarElement) return 'top';
    
    const rect = avatarElement.getBoundingClientRect();
    const spaceAbove = rect.top;
    
    return spaceAbove < 100 ? 'bottom' : 'top';
  };

  if (maintainers.length === 0) {
    return null;
  }

  const visibleMaintainers = maintainers.slice(0, maxVisible);
  const remainingCount = maintainers.length - maxVisible;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      {visibleMaintainers.map((maintainer, index) => {
        const avatarUrl = maintainer.email ? avatarUrls.get(maintainer.email) : null;
        const isHovered = hoveredIndex === index;
        const tooltipPos = isHovered ? checkTooltipPosition(index) : 'top';
        
        const npmProfileUrl = `https://www.npmjs.com/~${maintainer.name}`;
        
        return (
          <a
            key={`${maintainer.name}-${index}`}
            href={npmProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'block',
              width: size,
              height: size,
              borderRadius: '50%',
              overflow: 'visible',
              border: '1px solid var(--color-panel-border)',
              flexShrink: 0,
              position: 'relative',
              marginLeft: index > 0 ? `-${size * 0.75}px` : '0',
              transform: isHovered ? `translateY(-${size * 0.2}px)` : 'translateY(0)',
              transition: 'transform 0.2s ease',
              zIndex: isHovered ? 10 : 1,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={() => {
              setHoveredIndex(index);
              setTooltipPosition(checkTooltipPosition(index));
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
            }}>
              {loading ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '60%',
                    height: '60%',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-panel-border)',
                  }} />
                </div>
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={maintainer.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '';
                      const avatar = document.createElement('div');
                      avatar.style.cssText = `
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background-color: var(--color-panel-bg-tertiary);
                        font-size: ${size * 0.4}px;
                        font-weight: 500;
                        color: var(--color-panel-text);
                      `;
                      avatar.textContent = maintainer.name
                        .split(' ')
                        .map(word => word[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      parent.appendChild(avatar);
                    }
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  fontSize: size * 0.4,
                  fontWeight: 500,
                  color: 'var(--color-panel-text)',
                }}>
                  {maintainer.name
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
            </div>
            {/* Tooltip */}
            {isHovered && (() => {
              const tooltipStyle: React.CSSProperties = {
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 10px',
                backgroundColor: 'var(--color-panel-bg)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--color-panel-text)',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                pointerEvents: 'none',
              };
              
              if (tooltipPos === 'top') {
                tooltipStyle.bottom = '100%';
                tooltipStyle.marginBottom = '8px';
              } else {
                tooltipStyle.top = '100%';
                tooltipStyle.marginTop = '8px';
              }
              
              const arrowStyle: React.CSSProperties = {
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
              };
              
              if (tooltipPos === 'top') {
                arrowStyle.bottom = '-4px';
                arrowStyle.borderTop = '4px solid var(--color-panel-border)';
              } else {
                arrowStyle.top = '-4px';
                arrowStyle.borderBottom = '4px solid var(--color-panel-border)';
              }
              
              return (
                <div style={tooltipStyle}>
                  <div style={{
                    fontWeight: 500,
                    marginBottom: maintainer.email ? '2px' : '0',
                  }}>
                    {maintainer.name}
                  </div>
                  {maintainer.email && (
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--color-panel-text-secondary)',
                    }}>
                      {maintainer.email}
                    </div>
                  )}
                  {/* Tooltip arrow */}
                  <div style={arrowStyle} />
                </div>
              );
            })()}
          </a>
        );
      })}
      {remainingCount > 0 && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            openSheet({
              title: `All Maintainers (${maintainers.length})`,
              width: '500px',
              content: <MaintainersSheet maintainers={maintainers} />,
            });
          }}
          style={{
            position: 'relative',
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            border: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.35,
            fontWeight: 500,
            color: 'var(--color-panel-text-secondary)',
            flexShrink: 0,
            marginLeft: `-${size * 0.3}px`,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
