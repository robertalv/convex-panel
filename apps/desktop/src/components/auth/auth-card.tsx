import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConvexLogo } from "@/components/svg/convex-logo";
import { AlertCircle } from "lucide-react";
import { DeviceAuthFlow } from "./device-auth-flow";

interface AuthCardProps {
  isAuthenticating: boolean;
  userCode: string | null;
  verificationUrl?: string | null;
  onStartDeviceAuth: () => void;
  onCancelDeviceAuth: () => void;
  authError: string | null;
}

export function AuthCard({
  isAuthenticating,
  userCode,
  verificationUrl,
  onStartDeviceAuth,
  onCancelDeviceAuth,
  authError,
}: AuthCardProps) {
  const isDeviceAuthPending = isAuthenticating && userCode;

  return (
    <>
      {authError && (
        <div className="flex items-start gap-3 p-3 mb-6 rounded-lg bg-error-muted border border-error-base/20 animate-fade-up">
          <AlertCircle className="h-4 w-4 text-error-base shrink-0 mt-0.5" />
          <p className="text-sm text-error-text">{authError}</p>
        </div>
      )}

      {isDeviceAuthPending ? (
        <DeviceAuthFlow
          userCode={userCode}
          verificationUrl={verificationUrl}
          onCancel={onCancelDeviceAuth}
        />
      ) : (
        <div className="space-y-3">
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
          {isAuthenticating && (
            <div className="flex justify-center">
              <button
                onClick={onCancelDeviceAuth}
                className="text-xs text-text-muted hover:text-text-base transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default AuthCard;
