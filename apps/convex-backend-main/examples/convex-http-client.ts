import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

// Initialize client
const client = new ConvexHttpClient(deploymentUrl);

// Set admin authentication if needed
client.setAdminAuth(adminKey, identity);

// Execute functions
const queryResult = await client.query(
  makeFunctionReference("query", "moduleName", "functionName"),
  { arg1: "value1" }
);

const mutationResult = await client.mutation(
  makeFunctionReference("mutation", "moduleName", "functionName"),
  { arg1: "value1" }
);

const actionResult = await client.action(
  makeFunctionReference("action", "moduleName", "functionName"),
  { arg1: "value1" }
);

// Generic function call
const result = await client.function(
  makeFunctionReference("query", "moduleName", "functionName"),
  undefined, // componentPath
  { arg1: "value1" }
);