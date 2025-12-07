import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  getComponents,
  deleteComponent,
} from '../../../utils/api/components';
import { getAdminClientInfo } from '../../../utils/adminClient';
import type { Component } from '../../../utils/api/types';
import { usePortalTarget } from '../../../contexts/portal-context';
import { useThemeSafe } from '../../../hooks/useTheme';

const DeleteButtonWithTooltip: React.FC<{
  isActive: boolean;
  onDelete: () => void;
}> = ({ isActive, onDelete }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const portalTarget = usePortalTarget();
  const { theme } = useThemeSafe();

  useEffect(() => {
    if (showTooltip && triggerRef.current && isActive) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        const tooltipHeight = tooltipRect?.height || 60;
        const tooltipWidth = tooltipRect?.width || 280;
        const margin = 8;

        // Position tooltip above the button, centered
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;
        let top = rect.top - tooltipHeight - margin - 4; // 4px for arrow

        // Ensure tooltip doesn't go off screen horizontally
        if (left < margin) {
          left = margin;
        }
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = window.innerWidth - tooltipWidth - margin;
        }

        // Ensure tooltip doesn't go off top edge
        if (top < margin) {
          top = margin;
        }

        setTooltipPosition({
          top,
          left,
        });
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePosition();
          // Update again after tooltip renders to get accurate dimensions
          setTimeout(updatePosition, 10);
        });
      });

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setTooltipPosition(null);
    }
  }, [showTooltip, isActive]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => {
          if (isActive) {
            setShowTooltip(true);
          }
        }}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          display: 'inline-flex',
          marginLeft: 'auto',
        }}
      >
        <button
          type="button"
          onClick={onDelete}
          disabled={isActive}
          style={{
            cursor: isActive ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isActive
              ? 'var(--color-panel-text-muted)'
              : 'var(--color-panel-error)',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '4px 8px',
            fontSize: '12px',
            opacity: isActive ? 0.5 : 1,
          }}
        >
          <Trash2 size={12} />
          <span>Delete</span>
        </button>
      </div>
      {showTooltip && isActive && tooltipPosition && portalTarget && (
        createPortal(
          <div
            ref={tooltipRef}
            className={`cp-theme-${theme} cp-tooltip-action-tooltip`}
            data-placement="top"
            style={{
              position: 'fixed',
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              opacity: showTooltip ? 1 : 0,
              minWidth: '192px',
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            You must unmount your component before it can be deleted.
            <div
              className="cp-tooltip-action-arrow"
              style={{
                right: 'auto',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
              }}
            />
          </div>,
          portalTarget
        )
      )}
    </>
  );
};

export interface ComponentsProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
}

export const Components: React.FC<ComponentsProps> = ({
  adminClient,
  accessToken,
  deploymentUrl: providedDeploymentUrl,
}) => {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationText, setValidationText] = useState('');

  useEffect(() => {
    if (!adminClient) {
      setError('Admin client not available');
      setIsLoading(false);
      return;
    }

    loadComponents();
  }, [adminClient]);

  const loadComponents = async () => {
    if (!adminClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const comps = await getComponents(adminClient);
      setComponents(comps || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load components');
      console.error('Error loading components:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (componentId: string) => {
    setComponentToDelete(componentId);
  };

  const confirmDelete = async () => {
    if (!componentToDelete || !adminClient) {
      return;
    }

    const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);

    const { deploymentUrl, adminKey } = clientInfo;
    const finalAdminKey = accessToken || adminKey;

    if (!deploymentUrl || !finalAdminKey) {
      setError('Missing deployment URL or admin key');
      setComponentToDelete(null);
      return;
    }

    // Validate that user typed the path correctly
    if (validationText !== componentToDeleteData?.path) {
      return;
    }

    setIsDeleting(true);
    setError(null); // Clear any previous errors
    try {
      await deleteComponent(deploymentUrl, finalAdminKey, componentToDelete);
      await loadComponents();
      setComponentToDelete(null);
      setValidationText('');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete component');
      console.error('Error deleting component:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setComponentToDelete(null);
    setValidationText('');
  };

  const componentToDeleteData = componentToDelete
    ? components.find((c) => c.id === componentToDelete)
    : null;


  // Filter and sort components like Convex does
  const sortedComponents = [...components]
    .filter((component) => component.name !== null && component.name !== undefined && component.name !== '')
    .sort((a, b) => {
      if (a.state === 'active' && b.state !== 'active') {
        return 1;
      }
      if (a.state !== 'active' && b.state === 'active') {
        return -1;
      }
      return 0;
    });

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <div
          style={{
            height: '49px',
            borderBottom: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            backgroundColor: 'var(--color-panel-bg)',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Components
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-panel-text-secondary)',
            fontSize: '14px',
            padding: '32px',
          }}
        >
          Loading components...
        </div>
      </div>
    );
  }

  if (error && components.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <div
          style={{
            height: '49px',
            borderBottom: '1px solid var(--color-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            backgroundColor: 'var(--color-panel-bg)',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Components
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '32px',
          }}
        >
          <AlertCircle size={24} style={{ color: 'var(--color-panel-error)' }} />
          <div style={{ color: 'var(--color-panel-error)', fontSize: '14px' }}>
            {error}
          </div>
          <button
            type="button"
            onClick={loadComponents}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-panel-accent)',
              color: 'var(--color-panel-bg)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--color-panel-bg)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '49px',
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          backgroundColor: 'var(--color-panel-bg)',
        }}
      >
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-panel-text)',
            margin: 0,
          }}
        >
          Components
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '800px',
          }}
        >
          {/* Title */}
          {/* <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              margin: 0,
            }}
          >
            Components
          </h1> */}

          {/* Description paragraphs */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--color-panel-text-secondary)',
            }}
          >
            <p style={{ margin: 0 }}>
              This page lists all of the components that are configured in your project's{' '}
              <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>convex.config.ts</span> file. You may delete components that have been unmounted.{' '}
              <a
                href="https://docs.convex.dev/components"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--color-panel-info)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Learn more
              </a>
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
                border: '1px solid var(--color-panel-error)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-panel-error)',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Table */}
          {sortedComponents.length > 0 ? (
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {sortedComponents.map((component) => {
                  const isActive = component.state === 'active';
                  return (
                    <div
                      key={component.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--color-panel-border)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {/* Component Path - Always clickable */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          // color: 'var(--color-panel-text)',
                          // cursor: 'pointer',
                          flex: 1,
                        }}
                        onClick={() => {
                          // TODO: This is too add a bit more context about the components
                          // I was thinking of creating components where user can adjust settings on the panel
                          // openSheet({
                          //   title: component.path || component.name || 'Component Details',
                          //   width: '500px',
                          //   content: (
                          //     <ComponentDetailSheet
                          //       component={component}
                          //       adminClient={adminClient}
                          //     />
                          //   ),
                          // });
                        }}
                        // onMouseEnter={(e) => {
                        //   e.currentTarget.style.color = 'var(--color-panel-accent)';
                        // }}
                        // onMouseLeave={(e) => {
                        //   e.currentTarget.style.color = 'var(--color-panel-text)';
                        // }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {component.path}
                        </span>
                        {!isActive && (
                          <span
                            style={{
                              marginLeft: '4px',
                              color: 'var(--color-panel-text-secondary)',
                            }}
                          >
                            (unmounted)
                          </span>
                        )}
                      </div>

                      {/* Delete Button */}
                      <DeleteButtonWithTooltip
                        isActive={isActive}
                        onDelete={() => {
                          if (!isActive) {
                            handleDelete(component.id);
                            setValidationText('');
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: '16px',
                marginBottom: '16px',
                color: 'var(--color-panel-text-secondary)',
                fontSize: '14px',
              }}
            >
              There are no components installed in this deployment.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {componentToDelete && componentToDeleteData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={cancelDelete}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-panel-bg)',
              border: '1px solid var(--color-panel-border)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--color-panel-text)',
                marginBottom: '12px',
              }}
            >
              Delete Component
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-panel-text-secondary)',
                marginBottom: '8px',
              }}
            >
              Deleting this component will destroy all of its functions and data. It will also delete all subcomponents of this component.
            </p>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-panel-text-secondary)',
                marginBottom: '12px',
              }}
            >
              Type <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{componentToDeleteData.path}</span> to confirm:
            </p>
            <input
              type="text"
              value={validationText}
              onChange={(e) => setValidationText(e.target.value)}
              placeholder={componentToDeleteData.path}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--color-panel-border)',
                backgroundColor: 'var(--color-panel-bg)',
                color: 'var(--color-panel-text)',
                fontSize: '13px',
                fontFamily: 'monospace',
                marginBottom: '20px',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validationText === componentToDeleteData.path) {
                  confirmDelete();
                } else if (e.key === 'Escape') {
                  cancelDelete();
                }
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--color-panel-bg-secondary)',
                  border: '1px solid var(--color-panel-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-panel-text)',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting || validationText !== componentToDeleteData.path}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--color-panel-error)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: isDeleting || validationText !== componentToDeleteData.path ? 'not-allowed' : 'pointer',
                  opacity: isDeleting || validationText !== componentToDeleteData.path ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting && validationText === componentToDeleteData.path) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-error-hover, color-mix(in srgb, var(--color-panel-error) 90%, black))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting && validationText === componentToDeleteData.path) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-error)';
                  }
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
