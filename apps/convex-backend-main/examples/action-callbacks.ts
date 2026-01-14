// POST /api/actions/query - Internal query execution
const response = await fetch(`${deploymentUrl}/api/actions/query`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${actionToken}` // Internal action token
  },
  body: JSON.stringify({
    path: "moduleName:functionName",
    args: { /* arguments */ },
    componentPath: "optional/component/path"
  })
});

// POST /api/actions/mutation - Internal mutation execution
// POST /api/actions/action - Internal action execution