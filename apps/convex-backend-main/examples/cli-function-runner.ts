// Using Convex CLI programmatically
import { runFunctionAndLog } from "convex/cli";

await runFunctionAndLog(ctx, {
  deploymentUrl: "https://your-deployment.convex.cloud",
  adminKey: "your-admin-key",
  functionName: "moduleName:functionName",
  argsString: '{"arg1": "value1"}',
  identityString: "user123", // optional
  componentPath: "optional/component", // optional
  callbacks: {
    onSuccess: () => console.log("Function completed successfully")
  }
});