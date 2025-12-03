import React, { useState, useEffect } from 'react';
import { OAuthSettings, getOAuthSettings, setOAuthSettings } from '../utils/storage';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: OAuthSettings) => void;
    currentSettings?: OAuthSettings;
}

export default function SettingsDialog({ isOpen, onClose, onSave, currentSettings }: SettingsDialogProps) {
    const [clientId, setClientId] = useState(currentSettings?.clientId || '');
    const [redirectUri, setRedirectUri] = useState(currentSettings?.redirectUri || 'http://localhost:14200');
    const [scope, setScope] = useState<'team' | 'project'>(currentSettings?.scope || 'project');

    useEffect(() => {
        if (currentSettings) {
            setClientId(currentSettings.clientId);
            setRedirectUri(currentSettings.redirectUri);
            setScope(currentSettings.scope);
        }
    }, [currentSettings]);

    const handleSave = () => {
        const settings: OAuthSettings = {
            clientId,
            redirectUri,
            scope,
        };
        setOAuthSettings(settings);
        onSave(settings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                color: '#fff',
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>OAuth Settings</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
                        Client ID
                    </label>
                    <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="Enter your Convex OAuth Client ID"
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.875rem',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
                        Redirect URI
                    </label>
                    <input
                        type="text"
                        value={redirectUri}
                        onChange={(e) => setRedirectUri(e.target.value)}
                        placeholder="http://localhost:14200"
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.875rem',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
                        Scope
                    </label>
                    <select
                        value={scope}
                        onChange={(e) => setScope(e.target.value as 'team' | 'project')}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="project">Project</option>
                        <option value="team">Team</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!clientId}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: clientId ? '#4a9eff' : '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: clientId ? 'pointer' : 'not-allowed',
                            fontSize: '0.875rem',
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
