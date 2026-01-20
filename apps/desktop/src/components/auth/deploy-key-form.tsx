import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "../ui/icon";
import {
  buildDeployKeyConfig,
  validateDeployKey,
  validateDeployKeyFormat,
  validateDeploymentUrlFormat,
  type DeployKeyConfig,
} from "@/lib/deployKeyAuth";
import { isTauri } from "@/utils/desktop";

interface DeployKeyFormProps {
  onConnect: (config: DeployKeyConfig) => void;
  onCancel: () => void;
}

export function DeployKeyForm({ onConnect, onCancel }: DeployKeyFormProps) {
  const [deployKey, setDeployKey] = useState("");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [deployKeyError, setDeployKeyError] = useState<string | undefined>();
  const [deploymentUrlError, setDeploymentUrlError] = useState<
    string | undefined
  >();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const keyError = validateDeployKeyFormat(deployKey);
    const urlError = validateDeploymentUrlFormat(deploymentUrl);

    setDeployKeyError(keyError);
    setDeploymentUrlError(urlError);

    if (keyError || urlError) {
      return;
    }

    // Build config
    const config = buildDeployKeyConfig(deployKey, deploymentUrl);
    if (!config) {
      setValidationError("Could not extract deployment name from URL or key");
      return;
    }

    // Validate credentials with the server
    setIsValidating(true);
    setValidationError(null);

    try {
      // Get fetch function for Tauri
      const fetchFn = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        if (isTauri()) {
          const { fetch: tauriFetch } = await import(
            "@tauri-apps/plugin-http"
          );
          return tauriFetch(input, init);
        }
        return fetch(input, init);
      };

      const validation = await validateDeployKey(config, fetchFn);

      if (!validation.valid) {
        setValidationError(validation.error ?? "Invalid deploy key");
        return;
      }

      // Success! Pass config to parent
      onConnect(config);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "Validation failed",
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="text-center space-y-2">
        <p className="text-sm text-text-muted">
          Connect directly to a deployment using a deploy key.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Deploy Key Input */}
        <div className="space-y-2">
          <label
            htmlFor="deployKey"
            className="text-sm font-medium text-text-base"
          >
            Deploy Key
          </label>
          <input
            id="deployKey"
            type="password"
            value={deployKey}
            onChange={(e) => {
              setDeployKey(e.target.value);
              setDeployKeyError(undefined);
              setValidationError(null);
            }}
            placeholder="instance-name|0a1b2c3d4e5f..."
            className={cn(
              "w-full px-3 py-2.5 rounded-lg",
              "bg-surface-raised border text-sm text-text-base",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-brand-base/50",
              "transition-colors",
              deployKeyError
                ? "border-error-base focus:ring-error-base/50"
                : "border-border-base",
            )}
          />
          {deployKeyError && (
            <p className="text-xs text-error-base">{deployKeyError}</p>
          )}
          <p className="text-xs text-text-muted">
            Get from Dashboard → Settings → Deploy Key
          </p>
        </div>

        {/* Deployment URL Input */}
        <div className="space-y-2">
          <label
            htmlFor="deploymentUrl"
            className="text-sm font-medium text-text-base"
          >
            Deployment URL
          </label>
          <input
            id="deploymentUrl"
            type="text"
            value={deploymentUrl}
            onChange={(e) => {
              setDeploymentUrl(e.target.value);
              setDeploymentUrlError(undefined);
              setValidationError(null);
            }}
            placeholder="https://polite-condor-874.convex.cloud"
            className={cn(
              "w-full px-3 py-2.5 rounded-lg",
              "bg-surface-raised border text-sm text-text-base",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-brand-base/50",
              "transition-colors",
              deploymentUrlError
                ? "border-error-base focus:ring-error-base/50"
                : "border-border-base",
            )}
          />
          {deploymentUrlError && (
            <p className="text-xs text-error-base">{deploymentUrlError}</p>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-error-muted border border-error-base/20">
            <Icon
              name="alert-circle"
              className="h-4 w-4 text-error-base shrink-0 mt-0.5"
            />
            <p className="text-sm text-error-text">{validationError}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isValidating || !deployKey || !deploymentUrl}
          className="w-full cursor-pointer"
          size="lg"
          variant="secondary"
        >
          {isValidating ? (
            <>
              <Spinner size="sm" className="text-white" />
              Validating...
            </>
          ) : (
            <>
              <Icon name="link" className="h-5 w-5" />
              Connect
            </>
          )}
        </Button>
      </form>

      {/* Info Notice */}
      <div className="p-3 rounded-lg bg-surface-raised border border-border-base">
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-text-subtle">Note:</strong> Deploy key mode
          locks you to a single deployment. Some features like team management
          and billing are not available.
        </p>
      </div>

      {/* Cancel Link */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-fit text-text-muted"
        >
          Back to sign in options
        </Button>
      </div>
    </div>
  );
}

export default DeployKeyForm;
