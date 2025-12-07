import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Copy, Check, AlertCircle, Edit2, Trash2, Plus, ClipboardList, X } from 'lucide-react';
import {
  getAllEnvironmentVariables,
  setEnvironmentVariable,
  deleteEnvironmentVariable,
  batchUpdateEnvironmentVariables
} from '../../../utils/api/environment';
import type { EnvironmentVariable } from '../../../utils/api/types';
import { getAdminClientInfo } from '../../../utils/adminClient';

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
  const [newVars, setNewVars] = useState<Array<{ name: string; value: string; id: string }>>([]);
  const [varToDelete, setVarToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
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
    if (newVars.length > 0 && tableContentRef.current) {
      // Scroll to bottom when adding new rows
      setTimeout(() => {
        tableContentRef.current?.scrollTo({
          top: tableContentRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [newVars.length]);

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

  // Adapted from Convex's implementation
  // Regex pattern to match environment variable lines
  const LINE_REGEX = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

  const parseEnvFile = (content: string): Array<{ name: string; value: string }> => {
    const obj: Record<string, string> = {};

    // Convert line breaks to same format
    const lines = content.replace(/\r\n?/gm, '\n');
    let match = LINE_REGEX.exec(lines);

    while (match !== null) {
      const key = match[1];
      // Default undefined or null to empty string
      let value = match[2] || '';
      
      // Remove whitespace
      value = value.trim();
      
      // Check if double quoted
      const maybeQuote = value[0];
      
      // Remove surrounding quotes
      value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');
      
      // Expand newlines if double quoted
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, '\n');
        value = value.replace(/\\r/g, '\r');
      }
      
      // Add to object (this will handle duplicates by keeping the last one)
      if (key) {
        obj[key] = value;
      }
      
      match = LINE_REGEX.exec(lines);
    }

    // Convert to array format
    return Object.entries(obj).map(([name, value]) => ({ name, value }));
  };

  const validateDuplicateNames = (vars: Array<{ name: string; value: string; id: string }>): Record<string, string> => {
    const errors: Record<string, string> = {};
    const nameOccurrences = new Map<string, number>();
    
    // Count occurrences of each name
    vars.forEach(v => {
      if (v.name) {
        nameOccurrences.set(v.name, (nameOccurrences.get(v.name) || 0) + 1);
      }
    });
    
    // Check against existing environment variables
    envVars.forEach(envVar => {
      nameOccurrences.set(envVar.name, (nameOccurrences.get(envVar.name) || 0) + 1);
    });
    
    // Mark duplicates
    vars.forEach(v => {
      if (v.name && nameOccurrences.get(v.name)! > 1) {
        errors[v.id] = 'Environment variable name is not unique';
      }
    });
    
    return errors;
  };

  const handlePasteEnvFile = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const parsedVars = parseEnvFile(pastedText);
    
    if (parsedVars.length > 0) {
      const newVarsWithIds = parsedVars
        .filter(v => v.name) // Only keep variables with names
        .map(v => ({
          ...v,
          id: `${Date.now()}-${Math.random()}`
        }));
      
      if (newVarsWithIds.length > 0) {
        setNewVars(prev => {
          const combined = [...prev, ...newVarsWithIds];
          const errors = validateDuplicateNames(combined);
          setValidationErrors(prevErrors => ({ ...prevErrors, ...errors }));
          return combined;
        });
        setIsAddingNew(true);
      }
    }
  };

  const handleAddClick = () => {
    const newId = `${Date.now()}-${Math.random()}`;
    setNewVars(prev => [...prev, { name: '', value: '', id: newId }]);
    setIsAddingNew(true);
  };

  const handleRemoveNewVar = (id: string) => {
    setNewVars(prev => {
      const updated = prev.filter(v => v.id !== id);
      // Re-validate remaining variables
      const errors = validateDuplicateNames(updated);
      setValidationErrors(errors);
      
      if (updated.length === 0) {
        setIsAddingNew(false);
      }
      
      return updated;
    });
  };

  const handleUpdateNewVar = (id: string, field: 'name' | 'value', value: string) => {
    setNewVars(prev => {
      const updated = prev.map(v => 
        v.id === id ? { ...v, [field]: value } : v
      );
      
      // Validate for duplicates when name changes
      if (field === 'name') {
        const errors = validateDuplicateNames(updated);
        setValidationErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          // Remove error for this id if it's now valid
          if (!errors[id]) {
            delete newErrors[id];
          } else {
            newErrors[id] = errors[id];
          }
          return newErrors;
        });
      }
      
      return updated;
    });
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewVars([]);
    setValidationErrors({});
  };

  const handleSaveAll = async () => {
    const validVars = newVars.filter(v => v.name && v.value);
    
    if (validVars.length === 0) return;

    // Validate for duplicates before saving
    const errors = validateDuplicateNames(newVars);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix duplicate variable names before saving');
      return;
    }

    if (!adminClient) {
      setError('Admin client not available');
      return;
    }

    const clientInfo = getAdminClientInfo(adminClient, providedDeploymentUrl);
    const { deploymentUrl, adminKey } = clientInfo;
    const finalAdminKey = accessToken || adminKey;

    if (!deploymentUrl || !finalAdminKey) {
      setError('Missing deployment URL or admin key');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Use batch update if available, otherwise set them one by one
      const varsToSet: Record<string, string> = {};
      validVars.forEach(v => {
        varsToSet[v.name] = v.value;
      });
      
      await batchUpdateEnvironmentVariables(
        deploymentUrl,
        finalAdminKey,
        varsToSet,
        []
      );
      
      setIsAddingNew(false);
      setNewVars([]);
      setValidationErrors({});
      // Reload after add
      await loadEnvironmentVariables();
    } catch (err: any) {
      setError(err?.message || 'Failed to add environment variables');
      console.error('Error adding environment variables:', err);
    } finally {
      setIsSaving(false);
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
          Environment Variables
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                borderRadius: '8px',
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
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--color-panel-accent)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-panel-bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
            }}
          >
            <Plus size={12} /> Add Variable
          </button>
          {isAddingNew && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || newVars.filter(v => v.name && v.value).length === 0 || Object.keys(validationErrors).length > 0}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-panel-accent)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-panel-bg)',
                cursor: (isSaving || newVars.filter(v => v.name && v.value).length === 0 || Object.keys(validationErrors).length > 0) ? 'not-allowed' : 'pointer',
                opacity: (isSaving || newVars.filter(v => v.name && v.value).length === 0 || Object.keys(validationErrors).length > 0) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSaving && newVars.filter(v => v.name && v.value).length > 0 && Object.keys(validationErrors).length === 0) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving && newVars.filter(v => v.name && v.value).length > 0 && Object.keys(validationErrors).length === 0) {
                  e.currentTarget.style.backgroundColor = 'var(--color-panel-accent)';
                }
              }}
            >
              <Check size={12} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
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
          ) : envVars.length === 0 && newVars.length === 0 ? (
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

              {/* Paste .env File Area */}
              {isAddingNew && newVars.length === 0 && (
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--color-panel-border)',
                    backgroundColor: 'var(--color-panel-bg-secondary)',
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--color-panel-text)',
                    marginBottom: '8px',
                  }}>
                    Tip: Paste your .env file directly into here!
                  </div>
                  <textarea
                    placeholder="Paste .env file content here (KEY=VALUE format)..."
                    onPaste={handlePasteEnvFile}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-panel-border)',
                      backgroundColor: 'var(--color-panel-bg)',
                      color: 'var(--color-panel-text)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* New Variable Rows */}
              {newVars.map((newVar, index) => {
                const hasError = validationErrors[newVar.id];
                return (
                  <div
                    key={newVar.id}
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--color-panel-border)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--color-panel-text-secondary)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: '0 0 40%', paddingRight: '8px', position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Name"
                          value={newVar.name}
                          onChange={(e) => handleUpdateNewVar(newVar.id, 'name', e.target.value)}
                          onPaste={(e) => {
                            const pastedText = e.clipboardData.getData('text');
                            const parsedVars = parseEnvFile(pastedText);
                            
                            if (parsedVars.length > 0) {
                              e.preventDefault();
                              
                              const newVarsWithIds = parsedVars
                                .filter(v => v.name) // Only keep variables with names
                                .map(v => ({
                                  ...v,
                                  id: `${Date.now()}-${Math.random()}`
                                }));
                              
                              if (newVarsWithIds.length > 0) {
                                setNewVars(prev => {
                                  const combined = [...prev, ...newVarsWithIds];
                                  const errors = validateDuplicateNames(combined);
                                  setValidationErrors(prevErrors => ({ ...prevErrors, ...errors }));
                                  return combined;
                                });
                                setIsAddingNew(true);
                              }
                            }
                          }}
                          autoFocus={index === newVars.length - 1}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            paddingRight: hasError ? '32px' : '12px',
                            borderRadius: '4px',
                            border: (hasError && focusedInputId === newVar.id) 
                              ? '1px solid var(--color-background-errorSecondary)' 
                              : hasError 
                                ? '1px solid var(--color-background-error)' 
                                : '1px solid var(--color-panel-border)',
                            backgroundColor: 'var(--color-panel-bg)',
                            color: 'var(--color-panel-text)',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                          onFocus={() => setFocusedInputId(newVar.id)}
                          onBlur={() => setFocusedInputId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              handleCancelAdd();
                            }
                          }}
                        />
                        {hasError && (
                          <span
                            title={hasError}
                            style={{
                              position: 'absolute',
                              right: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              display: 'flex',
                              alignItems: 'center',
                              pointerEvents: 'none',
                            }}
                          >
                            <X
                              size={16}
                              style={{
                                color: 'var(--color-panel-error)',
                                flexShrink: 0,
                              }}
                            />
                          </span>
                        )}
                      </div>
                      <div style={{ flex: '0 0 40%', paddingRight: '8px' }}>
                        <input
                          type="text"
                          placeholder="Value"
                          value={newVar.value}
                          onChange={(e) => handleUpdateNewVar(newVar.id, 'value', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-panel-border)',
                            backgroundColor: 'var(--color-panel-bg)',
                            color: 'var(--color-panel-text)',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              handleCancelAdd();
                            }
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveNewVar(newVar.id);
                            setValidationErrors(prev => {
                              const updated = { ...prev };
                              delete updated[newVar.id];
                              return updated;
                            });
                          }}
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
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
