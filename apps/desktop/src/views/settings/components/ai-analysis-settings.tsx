import React, { useState, useEffect } from "react";
import {
  Settings,
  TestTube,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import {
  getAIConfig,
  setAIConfig,
  testAIConnection,
  type AIConfig,
} from "../../../utils/api/aiAnalysis";
import {
  Dropdown,
  type DropdownOption,
} from "../../../components/shared/dropdown";
import { Checkbox } from "../../../components/shared/checkbox";

export interface AIAnalysisSettingsProps {
  adminClient?: any;
  accessToken?: string;
  deploymentUrl?: string;
}

export const AIAnalysisSettings: React.FC<AIAnalysisSettingsProps> = ({
  adminClient,
}) => {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  // Form state
  const [provider, setProvider] = useState<"openai" | "anthropic" | "none">(
    "none",
  );
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [enabled, setEnabled] = useState(false);
  const [automaticAnalysis, setAutomaticAnalysis] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCredentialsExpanded, setIsCredentialsExpanded] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClient) {
      setIsLoading(false);
      return;
    }

    loadConfig();
  }, [adminClient]);

  const loadConfig = async () => {
    if (!adminClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentConfig = await getAIConfig(adminClient);
      if (currentConfig) {
        setConfig(currentConfig);
        setProvider(currentConfig.provider);
        setModel(currentConfig.model);
        setEmbeddingModel(currentConfig.embeddingModel || "");
        setTemperature(currentConfig.temperature ?? 0.7);
        setMaxTokens(currentConfig.maxTokens ?? 2000);
        setEnabled(currentConfig.enabled);
        setAutomaticAnalysis(currentConfig.automaticAnalysis);
        // Don't load API key for security
        setApiKey("");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load AI configuration");
      console.error("Error loading AI config:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!adminClient) {
      setError("Admin client not available");
      return;
    }

    if (provider !== "none" && !apiKey.trim()) {
      setError('API key is required when provider is not "none"');
      return;
    }

    if (provider !== "none" && !model.trim()) {
      setError("Model is required");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await setAIConfig(adminClient, {
        provider,
        apiKey: apiKey.trim(),
        model: model.trim(),
        embeddingModel: embeddingModel.trim() || undefined,
        temperature,
        maxTokens,
        enabled,
        automaticAnalysis,
      });

      setSuccessMessage("Configuration saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadConfig();
    } catch (err: any) {
      setError(err?.message || "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!adminClient) {
      setError("Admin client not available");
      return;
    }

    if (provider === "none") {
      setError("Please select a provider first");
      return;
    }

    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    if (!model.trim()) {
      setError("Model is required");
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await testAIConnection(
        adminClient,
        provider,
        apiKey.trim(),
        model.trim(),
      );
      setTestResult(result);
      if (result.success) {
        setSuccessMessage("Connection test successful!");
        setTimeout(() => setSuccessMessage(null), 3000);
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

  const getModelSuggestions = (): DropdownOption<string>[] => {
    if (provider === "openai") {
      // Models that support JSON mode (recommended)
      return [
        { value: "gpt-4o", label: "gpt-4o" },
        { value: "gpt-4-turbo", label: "gpt-4-turbo" },
        { value: "gpt-4", label: "gpt-4" },
        { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
        { value: "gpt-4o-mini", label: "gpt-4o-mini" },
      ];
    }
    if (provider === "anthropic") {
      return [
        { value: "claude-3-opus", label: "claude-3-opus" },
        { value: "claude-3-sonnet", label: "claude-3-sonnet" },
        { value: "claude-3-haiku", label: "claude-3-haiku" },
      ];
    }
    return [];
  };

  const getEmbeddingModelSuggestions = (): DropdownOption<string>[] => {
    if (provider === "openai") {
      // Embedding models that support v2 spec in AI SDK 5
      return [
        {
          value: "text-embedding-3-large",
          label: "text-embedding-3-large (3072 dim, recommended)",
        },
        {
          value: "text-embedding-3-small",
          label: "text-embedding-3-small (1536 dim)",
        },
      ];
    }
    // Anthropic doesn't have embeddings
    return [];
  };

  const providerOptions: DropdownOption<"openai" | "anthropic" | "none">[] = [
    { value: "none", label: "None (Disabled)" },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic (Claude)" },
  ];

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(identifier);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return "••••••••";
    return (
      key.substring(0, 4) +
      "•".repeat(Math.max(8, key.length - 8)) +
      key.substring(key.length - 4)
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <div
          style={{
            height: "49px",
            borderBottom: "1px solid var(--color-panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px",
            backgroundColor: "var(--color-panel-bg)",
          }}
        >
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-panel-text)",
              margin: 0,
            }}
          >
            AI Analysis Configuration
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-panel-text-secondary)",
            fontSize: "14px",
            padding: "32px",
          }}
        >
          Loading configuration...
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <div
          style={{
            height: "49px",
            borderBottom: "1px solid var(--color-panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px",
            backgroundColor: "var(--color-panel-bg)",
          }}
        >
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-panel-text)",
              margin: 0,
            }}
          >
            AI Analysis Configuration
          </h2>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "32px",
          }}
        >
          <AlertCircle
            size={24}
            style={{ color: "var(--color-panel-error)" }}
          />
          <div style={{ color: "var(--color-panel-error)", fontSize: "14px" }}>
            {error}
          </div>
          <button
            type="button"
            onClick={loadConfig}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: "var(--color-panel-accent)",
              color: "var(--color-panel-bg)",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
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
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-panel-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "49px",
          borderBottom: "1px solid var(--color-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-panel-text)",
            margin: 0,
          }}
        >
          AI Analysis Configuration
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "800px",
          }}
        >
          {/* Description */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            <p style={{ margin: 0 }}>
              Configure AI-powered log and error analysis. Enable automatic
              analysis or use on-demand analysis.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div
              style={{
                padding: "12px",
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-success) 10%, transparent)",
                border: "1px solid var(--color-panel-success)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--color-panel-success)",
                fontSize: "13px",
              }}
            >
              <CheckCircle2 size={16} />
              {successMessage}
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div
              style={{
                padding: "12px",
                backgroundColor: testResult.success
                  ? "color-mix(in srgb, var(--color-panel-success) 10%, transparent)"
                  : "color-mix(in srgb, var(--color-panel-error) 10%, transparent)",
                border: `1px solid ${testResult.success ? "var(--color-panel-success)" : "var(--color-panel-error)"}`,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: testResult.success
                  ? "var(--color-panel-success)"
                  : "var(--color-panel-error)",
                fontSize: "13px",
              }}
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

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-error) 10%, transparent)",
                border: "1px solid var(--color-panel-error)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--color-panel-error)",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Collapsible Current Configuration Section */}
          {config && config.provider !== "none" && (
            <div
              style={{
                border: "1px solid var(--color-panel-border)",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "var(--color-panel-bg-secondary)",
              }}
            >
              {/* Collapsible Header */}
              <button
                onClick={() => setIsCredentialsExpanded(!isCredentialsExpanded)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-panel-text)",
                  fontSize: "14px",
                  textAlign: "left",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {isCredentialsExpanded ? (
                  <ChevronUp
                    size={16}
                    style={{ color: "var(--color-panel-text-muted)" }}
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    style={{ color: "var(--color-panel-text-muted)" }}
                  />
                )}
                <span style={{ fontWeight: 500 }}>
                  Show current configuration
                </span>
              </button>

              {/* Collapsible Content */}
              {isCredentialsExpanded && (
                <div
                  style={{
                    padding: "16px",
                    borderTop: "1px solid var(--color-panel-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {/* Provider */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-panel-text)",
                        margin: 0,
                      }}
                    >
                      Provider
                    </h3>
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "var(--color-panel-bg)",
                        border: "1px solid var(--color-panel-border)",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "var(--color-panel-text)",
                      }}
                    >
                      {config.provider === "openai"
                        ? "OpenAI"
                        : config.provider === "anthropic"
                          ? "Anthropic (Claude)"
                          : "None"}
                    </div>
                  </div>

                  {/* Model */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-panel-text)",
                        margin: 0,
                      }}
                    >
                      Model
                    </h3>
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "var(--color-panel-bg)",
                        border: "1px solid var(--color-panel-border)",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "monospace",
                        color: "var(--color-panel-text)",
                      }}
                    >
                      {config.model}
                    </div>
                  </div>

                  {/* Embedding Model */}
                  {config.provider === "openai" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--color-panel-text)",
                          margin: 0,
                        }}
                      >
                        Embedding Model
                      </h3>
                      <div
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "var(--color-panel-bg)",
                          border: "1px solid var(--color-panel-border)",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontFamily: "monospace",
                          color: "var(--color-panel-text)",
                        }}
                      >
                        {config.embeddingModel ||
                          "text-embedding-3-large (default)"}
                      </div>
                    </div>
                  )}

                  {/* API Key */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-panel-text)",
                        margin: 0,
                      }}
                    >
                      API Key
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--color-panel-text-secondary)",
                        margin: 0,
                      }}
                    >
                      Your API key is stored securely. You can view it here or
                      copy it to clipboard.
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "var(--color-panel-bg)",
                          border: "1px solid var(--color-panel-border)",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontFamily: "monospace",
                          color: "var(--color-panel-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {apiKey.trim()
                          ? maskApiKey(apiKey)
                          : "••••••••••••••••"}
                      </div>
                      <button
                        onClick={() => {
                          // Only copy if user has entered a key in the form
                          if (apiKey.trim()) {
                            copyToClipboard(apiKey.trim(), "api-key");
                          } else {
                            // Show message that key is stored securely and can't be retrieved
                            setSuccessMessage(
                              "API key is stored securely and cannot be retrieved. Enter a new key to update it.",
                            );
                            setTimeout(() => setSuccessMessage(null), 3000);
                          }
                        }}
                        style={{
                          padding: "8px",
                          backgroundColor: "transparent",
                          border: "1px solid var(--color-panel-border)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color:
                            copiedValue === "api-key"
                              ? "var(--color-panel-accent)"
                              : "var(--color-panel-text-muted)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (copiedValue !== "api-key") {
                            e.currentTarget.style.color =
                              "var(--color-panel-text)";
                            e.currentTarget.style.borderColor =
                              "var(--color-panel-accent)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (copiedValue !== "api-key") {
                            e.currentTarget.style.color =
                              "var(--color-panel-text-muted)";
                            e.currentTarget.style.borderColor =
                              "var(--color-panel-border)";
                          }
                        }}
                        title="Copy API key"
                      >
                        {copiedValue === "api-key" ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-panel-text)",
                        margin: 0,
                      }}
                    >
                      Settings
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        fontSize: "13px",
                        color: "var(--color-panel-text-secondary)",
                      }}
                    >
                      <div>Temperature: {config.temperature ?? 0.7}</div>
                      <div>Max Tokens: {config.maxTokens ?? 2000}</div>
                      <div>
                        AI Analysis: {config.enabled ? "Enabled" : "Disabled"}
                      </div>
                      <div>
                        Automatic Analysis:{" "}
                        {config.automaticAnalysis ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Provider Selection */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                margin: 0,
              }}
            >
              AI Provider
            </label>
            <div style={{ width: "100%", height: "38px" }}>
              <Dropdown
                value={provider}
                options={providerOptions}
                onChange={(value) => {
                  setProvider(value);
                  setModel("");
                  setEmbeddingModel("");
                  setApiKey("");
                }}
                placeholder="Select provider"
                triggerStyle={{
                  height: "38px",
                }}
              />
            </div>
          </div>

          {provider !== "none" && (
            <>
              {/* API Key */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                    margin: 0,
                  }}
                >
                  API Key
                </label>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-panel-text-secondary)",
                    margin: 0,
                  }}
                >
                  {config
                    ? "Enter a new API key to update, or leave blank to keep the current key."
                    : "Enter your API key for the selected provider."}
                </p>
                <div
                  style={{
                    width: "100%",
                    height: "38px",
                    position: "relative",
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-panel-bg)",
                    overflow: "hidden",
                  }}
                >
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      config ? "Enter new API key to update" : "Enter API key"
                    }
                    style={{
                      width: "100%",
                      height: "100%",
                      padding: "8px 12px",
                      paddingRight: "40px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--color-panel-text)",
                      outline: "none",
                      transition: "border-color 0.15s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.parentElement!.style.borderColor =
                        "var(--color-panel-accent)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.parentElement!.style.borderColor =
                        "var(--color-panel-border)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowApiKey(!showApiKey);
                    }}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-panel-text-muted)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-panel-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color =
                        "var(--color-panel-text-muted)";
                    }}
                    title={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                    margin: 0,
                  }}
                >
                  Model
                </label>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-panel-text-secondary)",
                    margin: 0,
                  }}
                >
                  Recommended:{" "}
                  {provider === "openai"
                    ? "gpt-4o or gpt-4-turbo (supports JSON mode)"
                    : "claude-3-opus"}{" "}
                  for best results
                </p>
                <div style={{ width: "100%", height: "38px" }}>
                  <Dropdown
                    value={model}
                    options={getModelSuggestions()}
                    onChange={(value) => setModel(value)}
                    placeholder="Select a model"
                    disabled={getModelSuggestions().length === 0}
                    triggerStyle={{
                      height: "38px",
                    }}
                  />
                </div>
              </div>

              {/* Embedding Model Selection (OpenAI only) */}
              {provider === "openai" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-panel-text)",
                      margin: 0,
                    }}
                  >
                    Embedding Model (for vector search)
                  </label>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--color-panel-text-secondary)",
                      margin: 0,
                    }}
                  >
                    Optional: Used for semantic search in chat. If not set,
                    defaults to text-embedding-3-large.
                  </p>
                  <div style={{ width: "100%", height: "38px" }}>
                    <Dropdown
                      value={embeddingModel}
                      options={getEmbeddingModelSuggestions()}
                      onChange={(value) => setEmbeddingModel(value)}
                      placeholder="Select embedding model (optional)"
                      disabled={getEmbeddingModelSuggestions().length === 0}
                      triggerStyle={{
                        height: "38px",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Temperature */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-panel-text)",
                      margin: 0,
                    }}
                  >
                    Temperature
                  </label>
                  <div
                    style={{
                      fontSize: "13px",
                      fontFamily: "monospace",
                      color: "var(--color-panel-text-secondary)",
                      backgroundColor: "var(--color-panel-bg-secondary)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      minWidth: "50px",
                      textAlign: "center",
                    }}
                  >
                    {temperature.toFixed(1)}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-panel-text-secondary)",
                    margin: 0,
                  }}
                >
                  Lower values make responses more focused, higher values more
                  creative
                </p>
                <div
                  style={{
                    position: "relative",
                    padding: "8px 0",
                  }}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                      height: "6px",
                      borderRadius: "3px",
                      background: `linear-gradient(to right, var(--color-panel-accent) 0%, var(--color-panel-accent) ${(temperature / 1) * 100}%, var(--color-panel-border) ${(temperature / 1) * 100}%, var(--color-panel-border) 100%)`,
                      outline: "none",
                      WebkitAppearance: "none",
                      appearance: "none",
                      cursor: "pointer",
                    }}
                    onMouseDown={(e) => {
                      const slider = e.currentTarget;
                      slider.style.opacity = "0.8";
                    }}
                    onMouseUp={(e) => {
                      const slider = e.currentTarget;
                      slider.style.opacity = "1";
                    }}
                  />
                  <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: var(--color-panel-accent);
                      border: 2px solid var(--color-panel-bg);
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                      transition: transform 0.15s ease, box-shadow 0.15s ease;
                    }
                    input[type="range"]::-webkit-slider-thumb:hover {
                      transform: scale(1.1);
                      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 18px;
                      height: 18px;
                      border-radius: 50%;
                      background: var(--color-panel-accent);
                      border: 2px solid var(--color-panel-bg);
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                      transition: transform 0.15s ease, box-shadow 0.15s ease;
                    }
                    input[type="range"]::-moz-range-thumb:hover {
                      transform: scale(1.1);
                      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                    }
                    input[type="range"]::-moz-range-track {
                      height: 6px;
                      border-radius: 3px;
                      background: var(--color-panel-border);
                    }
                  `}</style>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "4px",
                      fontSize: "11px",
                      color: "var(--color-panel-text-muted)",
                    }}
                  >
                    <span>0.0</span>
                    <span>0.5</span>
                    <span>1.0</span>
                  </div>
                </div>
              </div>

              {/* Max Tokens */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                    margin: 0,
                  }}
                >
                  Max Tokens
                </label>
                <div
                  style={{
                    width: "100%",
                    height: "38px",
                    position: "relative",
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-panel-bg)",
                    overflow: "hidden",
                  }}
                >
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={maxTokens}
                    onChange={(e) =>
                      setMaxTokens(parseInt(e.target.value) || 2000)
                    }
                    style={{
                      width: "100%",
                      height: "100%",
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--color-panel-text)",
                      outline: "none",
                      transition: "border-color 0.15s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.parentElement!.style.borderColor =
                        "var(--color-panel-accent)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.parentElement!.style.borderColor =
                        "var(--color-panel-border)";
                    }}
                  />
                </div>
              </div>

              {/* Enable/Disable */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Checkbox
                    id="enabled"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    size={18}
                  />
                  <label
                    htmlFor="enabled"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-panel-text)",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    Enable AI Analysis
                  </label>
                </div>
              </div>

              {/* Automatic Analysis */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Checkbox
                    id="automaticAnalysis"
                    checked={automaticAnalysis}
                    onChange={(e) => setAutomaticAnalysis(e.target.checked)}
                    disabled={!enabled}
                    size={18}
                  />
                  <label
                    htmlFor="automaticAnalysis"
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: enabled
                        ? "var(--color-panel-text)"
                        : "var(--color-panel-text-muted)",
                      cursor: enabled ? "pointer" : "not-allowed",
                      margin: 0,
                    }}
                  >
                    Enable Automatic Background Analysis
                  </label>
                </div>
                {automaticAnalysis && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--color-panel-text-secondary)",
                      margin: 0,
                      marginLeft: "30px",
                    }}
                  >
                    Automatically analyze errors hourly and summarize logs daily
                  </p>
                )}
              </div>

              {/* Test Connection Button */}
              <div>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !apiKey.trim() || !model.trim()}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    color: "var(--color-panel-text)",
                    cursor:
                      isTesting || !apiKey.trim() || !model.trim()
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      isTesting || !apiKey.trim() || !model.trim() ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isTesting && apiKey.trim() && model.trim()) {
                      e.currentTarget.style.borderColor =
                        "var(--color-panel-accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isTesting && apiKey.trim() && model.trim()) {
                      e.currentTarget.style.borderColor =
                        "var(--color-panel-border)";
                    }
                  }}
                >
                  {isTesting ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube size={16} />
                      Test Connection
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Save Button */}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                isSaving ||
                (provider !== "none" &&
                  (!model.trim() || (!apiKey.trim() && !config)))
              }
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 500,
                border: "none",
                borderRadius: "6px",
                backgroundColor: "var(--color-panel-accent)",
                color: "var(--color-panel-bg)",
                cursor:
                  isSaving ||
                  (provider !== "none" &&
                    (!model.trim() || (!apiKey.trim() && !config)))
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  isSaving ||
                  (provider !== "none" &&
                    (!model.trim() || (!apiKey.trim() && !config)))
                    ? 0.5
                    : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (
                  !isSaving &&
                  !(
                    provider !== "none" &&
                    (!model.trim() || (!apiKey.trim() && !config))
                  )
                ) {
                  e.currentTarget.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !isSaving &&
                  !(
                    provider !== "none" &&
                    (!model.trim() || (!apiKey.trim() && !config))
                  )
                ) {
                  e.currentTarget.style.opacity = "1";
                }
              }}
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Settings size={16} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
