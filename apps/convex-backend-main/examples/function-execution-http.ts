// POST /api/function - Execute any function type
const response = await fetch(`${deploymentUrl}/api/function`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${adminKey}` // if admin access needed
  },
  body: JSON.stringify({
    path: "moduleName:functionName",
    args: { /* your arguments */ },
    format: "json"
  })
});

// POST /api/run/{functionIdentifier} - Alternative endpoint
const response2 = await fetch(`${deploymentUrl}/api/run/moduleName/functionName`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    args: { /* your arguments */ }
  })
});