# Component Function Fetching from External Apps

## Problem Statement

When fetching functions from another Convex app that has multiple components, you need to ensure you're getting the correct functions for the specific component you're interested in, not all functions from the deployment.

## Solution: Component-Specific Function Filtering

### 1. Get All Functions and Filter by Component

```typescript
import { ConvexHttpClient } from "convex/browser";

async function getComponentFunctions(componentName: string) {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    // Get ALL functions from the deployment
    const allFunctions = await client.query("_system/cli/modules:apiSpec", {});
    
    // Filter functions that belong to the specific component
    const componentFunctions = allFunctions.filter(fn => {
      if (!fn.identifier) return false;
      
      // Component functions have identifiers like: "componentName:moduleName:functionName"
      // or "componentName:functionName" for root module functions
      return fn.identifier.startsWith(`${componentName}:`);
    });
    
    console.log(`Found ${componentFunctions.length} functions for component "${componentName}"`);
    return componentFunctions;
    
  } catch (error) {
    console.error(`Error fetching functions for component "${componentName}":`, error);
    throw error;
  }
}

// Usage
const searchComponentFunctions = await getComponentFunctions("searchComponent");
const waitlistFunctions = await getComponentFunctions("waitlist");
```

### 2. Component Function Identifier Structure

Component functions follow this naming pattern:

```
Regular app functions:     "moduleName:functionName"
Component functions:       "componentName:moduleName:functionName"
Component root functions:  "componentName:functionName"
```

### 3. Enhanced Component Function Analysis

```typescript
interface ComponentFunctionInfo {
  componentName: string;
  moduleName: string;
  functionName: string;
  fullIdentifier: string;
  type: string;
  visibility: string;
  args?: any;
  returns?: any;
}

async function analyzeComponentFunctions(componentName: string): Promise<ComponentFunctionInfo[]> {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    const allFunctions = await client.query("_system/cli/modules:apiSpec", {});
    
    const componentFunctions = allFunctions
      .filter(fn => fn.identifier?.startsWith(`${componentName}:`))
      .map(fn => {
        const parts = fn.identifier.split(':');
        
        // Handle both "component:module:function" and "component:function" patterns
        const isRootFunction = parts.length === 2;
        
        return {
          componentName: parts[0],
          moduleName: isRootFunction ? 'index' : parts[1],
          functionName: isRootFunction ? parts[1] : parts[2],
          fullIdentifier: fn.identifier,
          type: fn.functionType,
          visibility: fn.visibility?.kind || 'public',
          args: fn.args,
          returns: fn.returns
        };
      });
    
    return componentFunctions;
    
  } catch (error) {
    console.error(`Error analyzing component "${componentName}":`, error);
    throw error;
  }
}
```

### 4. Multi-Component Function Fetcher

```typescript
async function getAllComponentFunctions() {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    // Get components list first
    const components = await client.query("_system/frontend/components:list", {});
    
    // Get all functions
    const allFunctions = await client.query("_system/cli/modules:apiSpec", {});
    
    // Group functions by component
    const functionsByComponent = {};
    
    // Initialize with empty arrays for all components
    components.forEach(component => {
      functionsByComponent[component.name] = [];
    });
    
    // Add app-level functions (no component prefix)
    functionsByComponent['app'] = [];
    
    // Categorize all functions
    allFunctions.forEach(fn => {
      if (!fn.identifier) return;
      
      const parts = fn.identifier.split(':');
      
      // Check if this is a component function
      const isComponentFunction = components.some(c => c.name === parts[0]);
      
      if (isComponentFunction) {
        const componentName = parts[0];
        functionsByComponent[componentName].push({
          identifier: fn.identifier,
          type: fn.functionType,
          visibility: fn.visibility?.kind || 'public',
          moduleName: parts.length > 2 ? parts[1] : 'index',
          functionName: parts.length > 2 ? parts[2] : parts[1]
        });
      } else {
        // App-level function
        functionsByComponent['app'].push({
          identifier: fn.identifier,
          type: fn.functionType,
          visibility: fn.visibility?.kind || 'public',
          moduleName: parts[0],
          functionName: parts[1]
        });
      }
    });
    
    return functionsByComponent;
    
  } catch (error) {
    console.error("Error fetching all component functions:", error);
    throw error;
  }
}
```

### 5. Component-Aware Function Runner

```typescript
class ComponentFunctionRunner {
  private client: ConvexHttpClient;
  private currentComponent: string | null = null;
  
  constructor(deploymentUrl: string, adminKey: string) {
    this.client = new ConvexHttpClient(deploymentUrl);
    this.client.setAdminAuth(adminKey);
  }
  
  async switchToComponent(componentName: string) {
    // Verify component exists
    const components = await this.client.query("_system/frontend/components:list", {});
    const componentExists = components.some(c => c.name === componentName);
    
    if (!componentExists) {
      throw new Error(`Component "${componentName}" not found`);
    }
    
    this.currentComponent = componentName;
    console.log(`Switched to component: ${componentName}`);
  }
  
  async getFunctionsForCurrentComponent() {
    if (!this.currentComponent) {
      throw new Error("No component selected. Call switchToComponent() first.");
    }
    
    const allFunctions = await this.client.query("_system/cli/modules:apiSpec", {});
    
    return allFunctions.filter(fn => 
      fn.identifier?.startsWith(`${this.currentComponent}:`)
    );
  }
  
  async runComponentFunction(functionName: string, args: any = {}) {
    if (!this.currentComponent) {
      throw new Error("No component selected. Call switchToComponent() first.");
    }
    
    // Find the full function identifier
    const functions = await this.getFunctionsForCurrentComponent();
    const targetFunction = functions.find(fn => 
      fn.identifier.endsWith(`:${functionName}`)
    );
    
    if (!targetFunction) {
      throw new Error(`Function "${functionName}" not found in component "${this.currentComponent}"`);
    }
    
    // Execute the function based on its type
    switch (targetFunction.functionType) {
      case 'Query':
        return await this.client.query(targetFunction.identifier, args);
      case 'Mutation':
        return await this.client.mutation(targetFunction.identifier, args);
      case 'Action':
        return await this.client.action(targetFunction.identifier, args);
      default:
        throw new Error(`Unsupported function type: ${targetFunction.functionType}`);
    }
  }
}

// Usage
const runner = new ComponentFunctionRunner(
  "https://your-deployment.convex.cloud",
  "your-admin-key"
);

await runner.switchToComponent("searchComponent");
const searchFunctions = await runner.getFunctionsForCurrentComponent();
const result = await runner.runComponentFunction("search", { query: "test" });
```

### 6. Component Function Discovery Script

```typescript
import fs from "fs";

async function generateComponentFunctionMap() {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    const components = await client.query("_system/frontend/components:list", {});
    const allFunctions = await client.query("_system/cli/modules:apiSpec", {});
    
    let markdown = "# Component Function Map\n\n";
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    
    // App-level functions
    const appFunctions = allFunctions.filter(fn => {
      if (!fn.identifier) return false;
      const parts = fn.identifier.split(':');
      return !components.some(c => c.name === parts[0]);
    });
    
    if (appFunctions.length > 0) {
      markdown += "## App Functions (No Component)\n\n";
      appFunctions.forEach(fn => {
        markdown += `- \`${fn.identifier}\` (${fn.functionType}, ${fn.visibility?.kind || 'public'})\n`;
      });
      markdown += "\n";
    }
    
    // Component functions
    components.forEach(component => {
      const componentFunctions = allFunctions.filter(fn => 
        fn.identifier?.startsWith(`${component.name}:`)
      );
      
      if (componentFunctions.length > 0) {
        markdown += `## Component: ${component.name}\n\n`;
        markdown += `- **State**: ${component.state}\n`;
        markdown += `- **Function Count**: ${componentFunctions.length}\n\n`;
        
        // Group by module within component
        const moduleMap = {};
        componentFunctions.forEach(fn => {
          const parts = fn.identifier.split(':');
          const moduleName = parts.length > 2 ? parts[1] : 'index';
          
          if (!moduleMap[moduleName]) {
            moduleMap[moduleName] = [];
          }
          
          moduleMap[moduleName].push(fn);
        });
        
        Object.entries(moduleMap).forEach(([moduleName, functions]) => {
          markdown += `### Module: ${moduleName}\n\n`;
          functions.forEach(fn => {
            const parts = fn.identifier.split(':');
            const functionName = parts[parts.length - 1];
            markdown += `- \`${functionName}\` (${fn.functionType}, ${fn.visibility?.kind || 'public'})\n`;
            markdown += `  - Full ID: \`${fn.identifier}\`\n`;
          });
          markdown += "\n";
        });
      }
    });
    
    fs.writeFileSync('component-function-map.md', markdown);
    console.log('✅ Generated component-function-map.md');
    
  } catch (error) {
    console.error("Error generating component function map:", error);
    throw error;
  }
}

// Run the script
generateComponentFunctionMap();
```

## Key Points for Component Function Fetching

1. **Function Identifier Pattern**: Component functions are prefixed with the component name
2. **Filtering is Essential**: Always filter by component name to avoid cross-component confusion
3. **Component Verification**: Verify the component exists before trying to fetch its functions
4. **State Awareness**: Check component state (active/inactive) before attempting to run functions
5. **Error Handling**: Handle cases where components or functions don't exist
6. **Caching**: Consider caching function lists to avoid repeated API calls

## Environment Variables

```bash
# .env file
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_ADMIN_KEY=your-admin-key
```

This approach ensures you're always getting the correct functions for the specific component you're working with, preventing confusion when dealing with multi-component Convex deployments.