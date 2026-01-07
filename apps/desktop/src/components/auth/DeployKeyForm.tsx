import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plug, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface DeployKeyFormProps {
  deployUrl: string;
  deployKey: string;
  onDeployUrlChange: (value: string) => void;
  onDeployKeyChange: (value: string) => void;
  onConnect: () => void;
  isDisabled: boolean;
}

/**
 * Form for manual deploy key connection.
 * Allows users to enter deployment URL and deploy key directly.
 */
export function DeployKeyForm({
  deployUrl,
  deployKey,
  onDeployUrlChange,
  onDeployKeyChange,
  onConnect,
  isDisabled,
}: DeployKeyFormProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Description */}
      <p className="text-sm text-text-muted text-center">
        Connect directly with your deployment URL and deploy key.
      </p>

      {/* Deployment URL */}
      <div className="space-y-2">
        <Label htmlFor="deploy-url">Deployment URL</Label>
        <Input
          id="deploy-url"
          type="url"
          placeholder="https://your-deployment.convex.cloud"
          value={deployUrl}
          onChange={(e) => onDeployUrlChange(e.target.value)}
          autoFocus
          autoComplete="url"
        />
      </div>

      {/* Deploy Key */}
      <div className="space-y-2">
        <Label htmlFor="deploy-key">Deploy Key</Label>
        <div className="relative">
          <Input
            id="deploy-key"
            type={showKey ? "text" : "password"}
            placeholder="prod:your-deploy-key..."
            value={deployKey}
            onChange={(e) => onDeployKeyChange(e.target.value)}
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-text-subtle hover:text-text-muted",
              "transition-colors",
            )}
            tabIndex={-1}
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-text-subtle">
          You can find your deploy key in the Convex dashboard under Settings.
        </p>
      </div>

      {/* Connect button */}
      <Button
        onClick={onConnect}
        disabled={isDisabled}
        className="w-full"
        size="lg"
      >
        <Plug className="h-4 w-4" />
        Connect
      </Button>
    </div>
  );
}

export default DeployKeyForm;
