async function discoverComponentAPI(componentName: string) {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    // Get all functions
    const functions = await client.query("_system/cli/modules:apiSpec", {});
    
    // Filter functions that belong to this component
    const componentFunctions = functions.filter(fn => 
      fn.identifier && fn.identifier.startsWith(`${componentName}:`)
    );
    
    // Group by module within component
    const moduleMap = {};
    componentFunctions.forEach(fn => {
      const parts = fn.identifier.split(':');
      const moduleName = parts[1]; // component:module:function
      const functionName = parts[2] || parts[1];
      
      if (!moduleMap[moduleName]) {
        moduleMap[moduleName] = [];
      }
      
      moduleMap[moduleName].push({
        name: functionName,
        type: fn.functionType,
        visibility: fn.visibility?.kind || 'public',
        args: fn.args,
        returns: fn.returns
      });
    });
    
    console.log(`Component "${componentName}" API:`, moduleMap);
    return moduleMap;
    
  } catch (error) {
    console.error(`Error discovering API for component "${componentName}":`, error);
    throw error;
  }
}

// Usage
const searchComponentAPI = await discoverComponentAPI("searchComponent");