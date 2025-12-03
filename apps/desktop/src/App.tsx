import { useState, useEffect, useCallback } from "react";
import ConvexPanel from "convex-panel/react";
import { useTauriAuth } from "./hooks/useTauriAuth";
import SettingsDialog from "./components/SettingsDialog";
import { OAuthSettings, getOAuthSettings } from "./utils/storage";

function App() {
    const [showSettings, setShowSettings] = useState(false);
    const [oauthConfig, setOauthConfig] = useState<OAuthSettings>(() => {
        // Try to load from storage first
        const stored = getOAuthSettings();
        if (stored) {
            return stored;
        }
        // Default config
        return {
            clientId: "",
            redirectUri: "http://localhost:14200",
            scope: "project" as const,
        };
    });

    const auth = useTauriAuth(oauthConfig);

    // Show settings dialog if no client ID is configured
    useEffect(() => {
        if (!oauthConfig.clientId) {
            setShowSettings(true);
        }
    }, [oauthConfig.clientId]);

    const handleSaveSettings = useCallback((settings: OAuthSettings) => {
        setOauthConfig(settings);
    }, []);

    // Keyboard shortcut for settings (Cmd/Ctrl + ,)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                setShowSettings(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <div className="container" style={{ height: "100vh", width: "100vw", padding: 0 }}>
                <ConvexPanel
                    oauthConfig={oauthConfig.clientId ? oauthConfig : undefined}
                    auth={auth}
                    defaultTheme="dark"
                    forceDisplay={true}
                />
            </div>

            <SettingsDialog
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={handleSaveSettings}
                currentSettings={oauthConfig}
            />

            {/* Settings button - floating in bottom right */}
            <button
                onClick={() => setShowSettings(true)}
                style={{
                    position: 'fixed',
                    bottom: '1rem',
                    right: '1rem',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    zIndex: 1000,
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
                title="Settings (Cmd/Ctrl + ,)"
            >
                ⚙️
            </button>
        </>
    );
}

export default App;
