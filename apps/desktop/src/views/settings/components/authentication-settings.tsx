import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useDeployment } from "../../../contexts/deployment-context";

/**
 * Authentication provider types
 */
interface OIDCProvider {
  domain: string;
  applicationID: string;
}

interface CustomJWTProvider {
  type: string;
  issuer: string;
  jwks: string;
  algorithm: string;
  applicationID?: string;
}

type AuthProvider = OIDCProvider | CustomJWTProvider;

const isOIDCProvider = (provider: AuthProvider): provider is OIDCProvider => {
  return "domain" in provider && !("type" in provider);
};

const isCustomJWTProvider = (
  provider: AuthProvider,
): provider is CustomJWTProvider => {
  return "type" in provider;
};

/**
 * Get authentication providers for a deployment
 */
async function getAuthProviders(adminClient: any): Promise<AuthProvider[]> {
  if (!adminClient) {
    throw new Error("Admin client not available");
  }

  try {
    const result = await adminClient.query(
      "_system/frontend/listAuthProviders:default",
      {},
    );

    // The result might be directly an array, or wrapped in a status object
    if (Array.isArray(result)) {
      return result;
    }

    if (result && typeof result === "object") {
      if (result.status === "success" && result.value) {
        return Array.isArray(result.value) ? result.value : [];
      }
      // If it's already an object with providers, try to return it directly
      if (Array.isArray(result.providers)) {
        return result.providers;
      }
    }

    return [];
  } catch (error: any) {
    throw new Error(
      `Failed to get auth providers: ${error?.message || "Unknown error"}`,
    );
  }
}

export function AuthenticationSettings() {
  const deployment = useDeployment();
  const [authProviders, setAuthProviders] = useState<AuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deployment.adminClient) {
      setError("Admin client not available");
      setIsLoading(false);
      return;
    }

    loadAuthProviders();
  }, [deployment.adminClient]);

  const loadAuthProviders = async () => {
    if (!deployment.adminClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const providers = await getAuthProviders(deployment.adminClient);
      setAuthProviders(providers || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load authentication providers");
      console.error("Error loading authentication providers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
        <div className="flex h-[49px] items-center justify-between border-b border-border-base bg-background-base px-2">
          <h2 className="m-0 text-sm font-bold text-text-base">
            Authentication Configuration
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-text-muted">
          Loading authentication providers...
        </div>
      </div>
    );
  }

  if (error && authProviders.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
        <div className="flex h-[49px] items-center justify-between border-b border-border-base bg-background-base px-2">
          <h2 className="m-0 text-sm font-bold text-text-base">
            Authentication Configuration
          </h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <AlertCircle size={24} className="text-error-base" />
          <div className="text-sm text-error-base">{error}</div>
          <button
            type="button"
            onClick={loadAuthProviders}
            className="cursor-pointer rounded-md border-none bg-brand-base px-4 py-2 text-[13px] font-medium text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      {/* Header */}
      <div className="flex h-[49px] items-center justify-between border-b border-border-base bg-background-base px-2">
        <h2 className="m-0 text-sm font-bold text-text-base">
          Authentication Configuration
        </h2>
      </div>

      {/* Content */}
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="flex w-full max-w-3xl flex-col gap-4">
          {/* Description paragraphs */}
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-muted">
            <p className="m-0">
              These are the authentication providers configured for this
              deployment.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-error-base bg-error-base/10 p-3 text-[13px] text-error-base">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Table */}
          {authProviders.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-border-base bg-surface-raised">
              {/* Table Header */}
              <div className="sticky top-0 z-[1] flex items-center border-b border-border-base bg-surface-base px-4 py-2">
                <div className="flex-1 text-xs font-medium text-text-muted">
                  Domain
                </div>
                <div className="flex-1 text-xs font-medium text-text-muted">
                  Application ID
                </div>
                <div className="w-[200px] text-xs font-medium text-text-muted">
                  Type
                </div>
              </div>

              {/* Table Rows */}
              <div>
                {authProviders.map((provider, index) => {
                  const isOIDC = isOIDCProvider(provider);
                  const isJWT = isCustomJWTProvider(provider);

                  return (
                    <div
                      key={index}
                      className={`flex items-center px-4 py-3 transition-colors hover:bg-surface-overlay ${
                        index < authProviders.length - 1
                          ? "border-b border-border-base"
                          : ""
                      }`}
                    >
                      {/* Domain */}
                      <div className="flex-1 pr-4">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-border-base bg-surface-base px-3 py-2 font-mono text-[13px] text-text-base">
                          {isOIDC
                            ? provider.domain
                            : isJWT
                              ? provider.issuer
                              : "-"}
                        </div>
                      </div>

                      {/* Application ID */}
                      <div className="flex-1 pr-4">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-border-base bg-surface-base px-3 py-2 font-mono text-[13px] text-text-base">
                          {isOIDC
                            ? provider.applicationID
                            : isJWT
                              ? provider.applicationID || "-"
                              : "-"}
                        </div>
                      </div>

                      {/* Type */}
                      <div className="w-[200px] text-[13px] text-text-muted">
                        {isOIDC ? (
                          <a
                            href="https://docs.convex.dev/auth/advanced/custom-auth"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer text-brand-base no-underline hover:underline"
                          >
                            OIDC provider
                          </a>
                        ) : isJWT ? (
                          "Custom JWT provider"
                        ) : (
                          "Unknown"
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border-base bg-surface-raised px-6 py-12 text-center text-sm text-text-muted">
              No authentication providers configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
