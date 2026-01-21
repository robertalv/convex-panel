/**
 * AI Settings Component
 * Global AI configuration for the desktop app (stored locally)
 * Used for command palette AI features
 */

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Save,
  TestTube,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Local storage key for AI settings
const STORAGE_KEY = "convex-panel-ai-settings";

export interface AISettings {
  provider: "openai" | "anthropic" | "none";
  apiKey: string;
  model: string;
  temperature?: number;
}

const DEFAULT_SETTINGS: AISettings = {
  provider: "none",
  apiKey: "",
  model: "",
  temperature: 0.7,
};

export function AISettingsComponent() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error("Failed to load AI settings:", err);
    }
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaveSuccess(false);

    if (settings.provider !== "none") {
      if (!settings.apiKey.trim()) {
        setError("API key is required");
        return;
      }
      if (!settings.model.trim()) {
        setError("Model is required");
        return;
      }
    }

    setIsSaving(true);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setError(null);
    setTestResult(null);

    if (settings.provider === "none") {
      setError("Please select a provider first");
      return;
    }

    if (!settings.apiKey.trim()) {
      setError("API key is required");
      return;
    }

    if (!settings.model.trim()) {
      setError("Model is required");
      return;
    }

    setIsTesting(true);

    try {
      // Test the API connection
      const response = await fetch(
        settings.provider === "openai"
          ? "https://api.openai.com/v1/chat/completions"
          : "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey}`,
            ...(settings.provider === "anthropic" && {
              "anthropic-version": "2023-06-01",
            }),
          },
          body: JSON.stringify(
            settings.provider === "openai"
              ? {
                  model: settings.model,
                  messages: [{ role: "user", content: "Hello" }],
                  max_tokens: 5,
                }
              : {
                  model: settings.model,
                  messages: [{ role: "user", content: "Hello" }],
                  max_tokens: 5,
                },
          ),
        },
      );

      if (response.ok) {
        setTestResult({ success: true });
      } else {
        const errorData = await response.json();
        setTestResult({
          success: false,
          error:
            errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || "Connection test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const providerOptions = [
    { value: "none", label: "None (Disabled)" },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic (Claude)" },
  ];

  const getModelSuggestions = () => {
    if (settings.provider === "openai") {
      return ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", "gpt-4o-mini"];
    }
    if (settings.provider === "anthropic") {
      return [
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
      ];
    }
    return [];
  };

  return (
    <div className="flex flex-col h-full bg-background-base overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 shrink-0">
        <h2 className="text-sm font-semibold text-text-base">
          AI Configuration
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Description */}
          <p className="text-sm text-text-muted leading-relaxed">
            Configure AI provider for command palette AI features. Your API key
            is stored locally and never sent to Convex servers.
          </p>

          {/* Success Message */}
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success rounded-lg text-success text-sm">
              <CheckCircle2 size={16} />
              Settings saved successfully
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 border rounded-lg text-sm ${
                testResult.success
                  ? "bg-success/10 border-success text-success"
                  : "bg-error/10 border-error text-error"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {testResult.success
                ? "Connection test successful!"
                : testResult.error}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-base">
              AI Provider
            </label>
            <select
              value={settings.provider}
              onChange={(e) => {
                const provider = e.target.value as AISettings["provider"];
                setSettings({ ...settings, provider, model: "", apiKey: "" });
                setError(null);
                setTestResult(null);
              }}
              className="w-full h-10 px-3 bg-surface-base border border-border-base rounded-md text-sm text-text-base focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {providerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {settings.provider !== "none" && (
            <>
              {/* API Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-base">
                  API Key
                </label>
                <p className="text-xs text-text-muted">
                  Your API key is stored locally in your browser and never sent
                  to Convex servers.
                </p>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => {
                      setSettings({ ...settings, apiKey: e.target.value });
                      setError(null);
                      setTestResult(null);
                    }}
                    placeholder="Enter your API key"
                    className="w-full h-10 px-3 pr-10 bg-surface-base border border-border-base rounded-md text-sm font-mono text-text-base focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-base transition-colors"
                    title={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-base">
                  Model
                </label>
                <p className="text-xs text-text-muted">
                  Recommended:{" "}
                  {settings.provider === "openai"
                    ? "gpt-4o or gpt-4-turbo"
                    : "claude-3-5-sonnet"}{" "}
                  for best results
                </p>
                <select
                  value={settings.model}
                  onChange={(e) => {
                    setSettings({ ...settings, model: e.target.value });
                    setError(null);
                    setTestResult(null);
                  }}
                  className="w-full h-10 px-3 bg-surface-base border border-border-base rounded-md text-sm font-mono text-text-base focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select a model</option>
                  {getModelSuggestions().map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-base">
                    Temperature
                  </label>
                  <span className="text-xs font-mono text-text-muted bg-surface-raised px-2 py-1 rounded">
                    {settings.temperature?.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Lower values make responses more focused, higher values more
                  creative
                </p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature || 0.7}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-border-base rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>

              {/* Test Connection Button */}
              <button
                type="button"
                onClick={handleTest}
                disabled={
                  isTesting || !settings.apiKey.trim() || !settings.model.trim()
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border-base rounded-md text-sm font-medium text-text-base hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTesting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube size={16} />
                    Test Connection
                  </>
                )}
              </button>
            </>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-border-base">
            <button
              type="button"
              onClick={handleSave}
              disabled={
                isSaving ||
                (settings.provider !== "none" &&
                  (!settings.model.trim() || !settings.apiKey.trim()))
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export function to get AI settings from localStorage
export function getAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.error("Failed to load AI settings:", err);
  }
  return DEFAULT_SETTINGS;
}
