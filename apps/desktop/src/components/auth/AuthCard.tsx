import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConvexLogo } from "convex-panel";
import { AlertCircle } from "lucide-react";
import { DeviceAuthFlow } from "./DeviceAuthFlow";
import { DeployKeyForm } from "./DeployKeyForm";

type AuthMethod = "device" | "manual";

interface AuthCardProps {
  authMethod: AuthMethod;
  isAuthenticating: boolean;
  userCode: string | null;
  onStartDeviceAuth: () => void;
  onCancelDeviceAuth: () => void;
  deployUrl: string;
  deployKey: string;
  onDeployUrlChange: (value: string) => void;
  onDeployKeyChange: (value: string) => void;
  onManualConnect: () => void;
  authError: string | null;
}

export function AuthCard({
  authMethod,
  isAuthenticating,
  userCode,
  onStartDeviceAuth,
  onCancelDeviceAuth,
  deployUrl,
  deployKey,
  onDeployUrlChange,
  onDeployKeyChange,
  onManualConnect,
  authError,
}: AuthCardProps) {
  const isDeviceAuthPending = isAuthenticating && userCode;

  return (
    <>
      {/* TODO: later when we start working on self-hosted */}
      {/* <div className="flex gap-1 p-1 bg-surface-raised rounded-lg mb-6">
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md",
              "text-sm font-medium transition-all duration-normal",
              authMethod === "device"
                ? "bg-surface-base text-text-base shadow-sm"
                : "text-text-muted hover:text-text-base hover:bg-surface-base/50",
            )}
            onClick={() => {
              onAuthMethodChange("device");
              onCancelDeviceAuth();
            }}
          >
            <User className="h-4 w-4" />
            <span>Convex Account</span>
          </button>
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md",
              "text-sm font-medium transition-all duration-normal",
              authMethod === "manual"
                ? "bg-surface-base text-text-base shadow-sm"
                : "text-text-muted hover:text-text-base hover:bg-surface-base/50",
            )}
            onClick={() => {
              onAuthMethodChange("manual");
              onCancelDeviceAuth();
            }}
          >
            <Key className="h-4 w-4" />
            <span>Deploy Key</span>
          </button>
        </div> */}

      {authError && (
        <div className="flex items-start gap-3 p-3 mb-6 rounded-lg bg-error-muted border border-error-base/20 animate-fade-up">
          <AlertCircle className="h-4 w-4 text-error-base flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-text">{authError}</p>
        </div>
      )}

      {authMethod === "device" ? (
        isDeviceAuthPending ? (
          <DeviceAuthFlow userCode={userCode} onCancel={onCancelDeviceAuth} />
        ) : (
          <Button
            onClick={onStartDeviceAuth}
            disabled={isAuthenticating}
            className="w-full cursor-pointer"
            size="lg"
            variant="secondary"
          >
            {isAuthenticating ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <ConvexLogo className="h-5 w-5" />
            )}
            {isAuthenticating ? "Starting..." : "Sign in with Convex"}
          </Button>
        )
      ) : (
        <DeployKeyForm
          deployUrl={deployUrl}
          deployKey={deployKey}
          onDeployUrlChange={onDeployUrlChange}
          onDeployKeyChange={onDeployKeyChange}
          onConnect={onManualConnect}
          isDisabled={!deployUrl || !deployKey}
        />
      )}
    </>
  );
}

export default AuthCard;
