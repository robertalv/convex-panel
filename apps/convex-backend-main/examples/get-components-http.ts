async function getComponentsViaHTTP(deploymentUrl: string, adminKey: string) {
  const response = await fetch(`${deploymentUrl}/api/function`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminKey}`
    },
    body: JSON.stringify({
      path: "_system/frontend/components:list",
      args: {},
      format: "json"
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.status === "success") {
    return result.value;
  } else {
    throw new Error(`Query failed: ${result.errorMessage}`);
  }
}

// Usage
const components = await getComponentsViaHTTP(
  "https://your-deployment.convex.cloud",
  "your-admin-key"
);