// POST /api/run_test_function - Used by dashboard function tester
const response = await fetch(`${deploymentUrl}/api/run_test_function`, {
  headers: { "content-type": "application/json" },
  method: "POST",
  body: JSON.stringify({
    bundle: {
      path: "testQuery.js",
      source: transpiledCode, // Your function code
    },
    adminKey: adminKey,
    componentId: componentId, // optional
    args: convexToJson({}), // function arguments
    format: "convex_encoded_json",
  }),
});

const result = await response.json();
if (result.status === "success") {
  console.log("Function result:", result.value);
  console.log("Log lines:", result.logLines);
} else {
  console.error("Function error:", result.errorMessage);
}