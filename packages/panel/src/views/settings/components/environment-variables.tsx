import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Copy, Check, AlertCircle, Edit2, Trash2, Plus, ClipboardList, X } from 'lucide-react';
import {
  getAllEnvironmentVariables,
  getEnvironmentVariable,
  setEnvironmentVariable,
  deleteEnvironmentVariable,
  batchUpdateEnvironmentVariables,
  EnvironmentVariable,
} from '../../../utils/api';
import { getAdminClientInfo, validateAdminClientInfo } from '../../../utils/adminClient';

export interface EnvironmentVariablesProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
}

export const EnvironmentVariables: React.FC<EnvironmentVariablesProps> = ({
  adminClient,
  accessToken,
  deploymentUrl: providedDeploymentUrl,
}) => {
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [originalEditName, setOriginalEditName] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [varToDelete, setVarToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tableContentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminClient) {
      setError('Admin client not available');
      setIsLoading(false);
      return;
    }

    loadEnvironmentVariables();
  }, [adminClient]);

  useEffect(() => {
    if (isAddingNew && tableContentRef.current) {
      // Scroll to bottom when adding new row
      setTimeout(() => {
        tableContentRef.current?.scrollTo({
          top: tableContentRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [isAddingNew]);

  const loadEnvironmentVariables = async () => {
    if (!adminClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const variables = await getAllEnvironmentVariables(adminClient);
      setEnvVars(variables);
    } catch (err: any) {
      setError(err?.message || 'Failed to load environment variables');
      console.error('Error loading environment variables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleValueVisibility = (name: string) => {
    setVisibleValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedName(identifier);
      setTimeout(() => setCopiedName(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllToClipboard = async () => {
    try {
      const allVars = envVars.map((v) => `${v.name}=${v.value}`).join('\n');
      await navigator.clipboard.writeText(allVars);
      setCopiedName('all');
      setTimeout(() => setCopiedName(null), 2000);
    } catch (err) {
      console.error('Failed to copy all:', err);
    }
  };

  const handleEdit = (envVar: EnvironmentVariable) => {
    setEditingVar(envVar.name);
    setOriginalEditName(envVar.name);
    setEditName(envVar.name);
    setEditValue(envVar.value);
  };

  const handleSaveEdit = async () => {
    if (!adminClient) {
      setError('Admin client not available');
      return;
    }

    const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);
    const validationError = validateAdminClientInfo(clientInfo);

    if (validationError) {
      setError(validationError);
      return;
    }

    const { deploymentUrl, adminKey } = clientInfo;
    const finalAdminKey = accessToken || adminKey;

    if (!deploymentUrl || !finalAdminKey) {
      setError('Missing deployment URL or admin key');
      return;
    }

    try {
      // If name changed, use batch update to atomically delete old and create new
      if (originalEditName !== editName) {
        await batchUpdateEnvironmentVariables(
          deploymentUrl,
          finalAdminKey,
          { [editName]: editValue }, // Create new variable
          [originalEditName] // Delete old variable
        );
      } else {
        // Just update the value
        await setEnvironmentVariable(deploymentUrl, finalAdminKey, editName, editValue);
      }

      setEditingVar(null);
      setOriginalEditName('');
      setEditName('');
      setEditValue('');
      // Reload after save
      await loadEnvironmentVariables();
    } catch (err: any) {
      setError(err?.message || 'Failed to update environment variable');
      console.error('Error updating environment variable:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingVar(null);
    setOriginalEditName('');
    setEditName('');
    setEditValue('');
  };

  const handleDelete = (name: string) => {
    setVarToDelete(name);
  };

  const cancelDelete = () => {
    setVarToDelete(null);
  };

  const confirmDelete = async () => {
    if (!varToDelete || !adminClient) {
      return;
    }

    const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);
    const validationError = validateAdminClientInfo(clientInfo);

    if (validationError) {
      setError(validationError);
      setVarToDelete(null);
      return;
    }

    const { deploymentUrl, adminKey } = clientInfo;
    const finalAdminKey = accessToken || adminKey;

    if (!deploymentUrl || !finalAdminKey) {
      setError('Missing deployment URL or admin key');
      setVarToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEnvironmentVariable(deploymentUrl, finalAdminKey, varToDelete);
      // Reload after delete
      await loadEnvironmentVariables();
      setVarToDelete(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete environment variable');
      console.error('Error deleting environment variable:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddClick = () => {
    setIsAddingNew(true);
    setNewVarName('');
    setNewVarValue('');
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewVarName('');
    setNewVarValue('');
  };

  const handleSaveAdd = async () => {
    if (!newVarName || !newVarValue) return;

    if (!adminClient) {
      setError('Admin client not available');
      return;
    }

    const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);
    const validationError = validateAdminClientInfo(clientInfo);

    if (validationError) {
      setError(validationError);
      return;
    }

    const { deploymentUrl, adminKey } = clientInfo;
    const finalAdminKey = accessToken || adminKey;

    if (!deploymentUrl || !finalAdminKey) {
      setError('Missing deployment URL or admin key');
      return;
    }

    try {
      await setEnvironmentVariable(deploymentUrl, finalAdminKey, newVarName, newVarValue);
      setIsAddingNew(false);
      setNewVarName('');
      setNewVarValue('');
      // Reload after add
      await loadEnvironmentVariables();
    } catch (err: any) {
      setError(err?.message || 'Failed to add environment variable');
      console.error('Error adding environment variable:', err);
    }
  };

  const maskValue = (value: string, isVisible: boolean): string => {
    if (isVisible) return value;
    return '•'.repeat(Math.min(value.length, 20));
  };

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
            padding: '0 16px',
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
            Environment Variables
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
          Loading environment variables...
        </div>
      </div>
    );
  }

  if (error) {
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
            padding: '0 16px',
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
            Environment Variables
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
            onClick={loadEnvironmentVariables}
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
          padding: '0 16px',
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
          Environment Variables
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-panel-text-muted)' }}>
            Total {envVars.length}
          </span>
          {envVars.length > 0 && (
            <button
              onClick={copyAllToClipboard}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                border: '1px solid var(--color-panel-border)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-panel-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                e.currentTarget.style.color = 'var(--color-panel-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
                e.currentTarget.style.color = 'var(--color-panel-text-secondary)';
              }}
            >
              <ClipboardList size={12} />
              Copy All
              {copiedName === 'all' && <Check size={12} />}
            </button>
          )}
          <button
            onClick={handleAddClick}
            className="cp-btn"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
            }}
          >
            <Plus size={14} /> Add Variable
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          borderBottom: '1px solid var(--color-panel-border)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-panel-text-muted)',
          backgroundColor: 'var(--color-panel-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ width: '40%' }}>Name</div>
          <div style={{ flex: 1 }}>Value</div>
          <div style={{ width: '120px' }}></div>
        </div>

        {/* Table Content */}
        <div ref={tableContentRef} style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--color-panel-bg)' }}>
          {isLoading ? (
            <div style={{
              color: 'var(--color-panel-text-muted)',
              fontSize: '14px',
              padding: '32px',
              textAlign: 'center',
            }}>
              Loading environment variables...
            </div>
          ) : envVars.length === 0 && !isAddingNew ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '32px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'color-mix(in srgb, var(--color-panel-accent) 10%, transparent)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <Key size={24} style={{ color: 'var(--color-panel-accent)' }} />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--color-panel-text)',
                marginBottom: '8px',
              }}>
                No environment variables yet.
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-panel-text-muted)',
                marginBottom: '24px',
              }}>
                Add environment variables to configure your deployment.
              </p>
            </div>
          ) : (
            <>
              {/* Table Rows */}
              {envVars.map((envVar) => {
              const isVisible = visibleValues.has(envVar.name);
              const isEditing = editingVar === envVar.name;
              const isCopied = copiedName === `${envVar.name}-value`;

              if (isEditing) {
                return (
                  <div
                    key={envVar.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderBottom: '1px solid var(--color-panel-border)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <div style={{ width: '40%', paddingRight: '8px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-panel-border)',
                          backgroundColor: 'var(--color-panel-bg)',
                          color: 'var(--color-panel-text)',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-panel-border)',
                          backgroundColor: 'var(--color-panel-bg)',
                          color: 'var(--color-panel-text)',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                    </div>
                    <div style={{ width: '120px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-panel-text)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: '4px',
                        }}
                        title="Save"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-panel-text-muted)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-error)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                        }}
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={envVar.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid var(--color-panel-border)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Name */}
                  <div
                    style={{
                      width: '40%',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-panel-text)',
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {envVar.name}
                  </div>

                  {/* Value */}
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleValueVisibility(envVar.name)}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--color-panel-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                      }}
                      title={isVisible ? 'Hide value' : 'Show value'}
                    >
                      {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <div
                      style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'var(--color-panel-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {maskValue(envVar.value, isVisible)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      width: '120px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleEdit(envVar)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-panel-text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                      }}
                      title="Edit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(envVar.value, `${envVar.name}-value`)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCopied ? 'var(--color-panel-accent)' : 'var(--color-panel-text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCopied) {
                          e.currentTarget.style.color = 'var(--color-panel-text)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCopied) {
                          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                        }
                      }}
                      title="Copy value"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(envVar.name)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-panel-text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-error)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                      }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

              {/* New Variable Row */}
              {isAddingNew && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid var(--color-panel-border)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <div style={{ width: '40%', paddingRight: '8px' }}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-panel-border)',
                        backgroundColor: 'var(--color-panel-bg)',
                        color: 'var(--color-panel-text)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveAdd();
                        } else if (e.key === 'Escape') {
                          handleCancelAdd();
                        }
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <input
                      type="text"
                      placeholder="Value"
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-panel-border)',
                        backgroundColor: 'var(--color-panel-bg)',
                        color: 'var(--color-panel-text)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveAdd();
                        } else if (e.key === 'Escape') {
                          handleCancelAdd();
                        }
                      }}
                    />
                  </div>
                  <div style={{ width: '120px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleSaveAdd}
                      disabled={!newVarName || !newVarValue}
                      style={{
                        cursor: newVarName && newVarValue ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: newVarName && newVarValue ? 'var(--color-panel-text)' : 'var(--color-panel-text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                      }}
                      title="Save"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAdd}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-panel-text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-error)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-panel-text-muted)';
                      }}
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {varToDelete && (
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
              Delete Environment Variable
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-panel-text-secondary)',
                marginBottom: '8px',
              }}
            >
              Are you sure you want to delete this environment variable?
            </p>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--color-panel-text-muted)',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '20px',
                wordBreak: 'break-all',
              }}
            >
              {varToDelete}
            </div>
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
                disabled={isDeleting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'var(--color-panel-error)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-panel-error-hover, color-mix(in srgb, var(--color-panel-error) 90%, black))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
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