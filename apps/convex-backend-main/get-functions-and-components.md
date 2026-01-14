# How to Get Functions and Components List

## Method 1: Using CLI Commands

### List All Functions
```bash
# Get function specifications (includes metadata)
npx convex run _system/cli/modules:apiSpec

# Run a function to see available functions in error message
npx convex run nonexistent:function
```

### List All Components
```bash
# List components (if you have access to system queries)
npx convex run _system/frontend/components:list
```

## Method 2: Using HTTP API

### Get Function Specifications
```typescript
// POST /api/function
const functionsResponse = await fetch(`${deploymentUrl}/api/function`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${adminKey}`
  },
  body: JSON.stringify({
    path: "_system/cli/modules:apiSpec",
    args: {},
    format: "json"
  })
});

const functions = await functionsResponse.json();
console.log("Functions:", functions.value);
```

### Get Components List
```typescript
const componentsResponse = await fetch(`${deploymentUrl}/api/function`, {
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

const components = await componentsResponse.json();
console.log("Components:", components.value);
```

## Method 3: Using ConvexHttpClient

```typescript
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(deploymentUrl);
client.setAdminAuth(adminKey);

// Get functions
const functions = await client.query("_system/cli/modules:apiSpec", {});

// Get components  
const components = await client.query("_system/frontend/components:list", {});

console.log("Functions:", functions);
console.log("Components:", components);
```

## Method 4: Complete Script to Generate MD File

```typescript
import { ConvexHttpClient } from "convex/browser";
import fs from "fs";

async function generateFunctionsAndComponentsList() {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    // Get functions
    const functions = await client.query("_system/cli/modules:apiSpec", {});
    
    // Get components
    const components = await client.query("_system/frontend/components:list", {});

    // Generate markdown content
    let markdown = "# My Convex Deployment\n\n";
    
    // Add components section
    markdown += "## Components\n\n";
    if (components && components.length > 0) {
      components.forEach(component => {
        markdown += `### ${component.name || 'Root'}\n`;
        markdown += `- **ID**: ${component.id}\n`;
        markdown += `- **Path**: ${component.path || '/'}\n`;
        markdown += `- **State**: ${component.state}\n`;
        if (component.args && Object.keys(component.args).length > 0) {
          markdown += `- **Args**: ${JSON.stringify(component.args, null, 2)}\n`;
        }
        markdown += "\n";
      });
    } else {
      markdown += "No components found.\n\n";
    }

    // Add functions section
    markdown += "## Functions\n\n";
    
    // Group functions by module
    const functionsByModule = {};
    functions.forEach(fn => {
      if (fn.identifier) {
        const [modulePath, functionName] = fn.identifier.split(':');
        if (!functionsByModule[modulePath]) {
          functionsByModule[modulePath] = [];
        }
        functionsByModule[modulePath].push({
          name: functionName,
          type: fn.functionType,
          visibility: fn.visibility?.kind || 'public',
          args: fn.args,
          returns: fn.returns
        });
      } else if (fn.functionType === 'HttpAction') {
        // HTTP routes
        const httpModule = '_http_routes';
        if (!functionsByModule[httpModule]) {
          functionsByModule[httpModule] = [];
        }
        functionsByModule[httpModule].push({
          name: `${fn.method} ${fn.path}`,
          type: 'HttpAction',
          visibility: 'public'
        });
      }
    });

    // Generate function documentation
    Object.entries(functionsByModule).forEach(([modulePath, moduleFunctions]) => {
      markdown += `### ${modulePath}\n\n`;
      
      moduleFunctions.forEach(fn => {
        markdown += `#### ${fn.name}\n`;
        markdown += `- **Type**: ${fn.type}\n`;
        markdown += `- **Visibility**: ${fn.visibility}\n`;
        
        if (fn.args) {
          markdown += `- **Arguments**: \`${JSON.stringify(fn.args)}\`\n`;
        }
        
        if (fn.returns) {
          markdown += `- **Returns**: \`${JSON.stringify(fn.returns)}\`\n`;
        }
        
        markdown += "\n";
      });
      
      markdown += "\n";
    });

    // Add usage examples
    markdown += "## Usage Examples\n\n";
    markdown += "### Query Functions\n";
    markdown += "```typescript\n";
    markdown += "import { useQuery } from 'convex/react';\n";
    markdown += "import { api } from './convex/_generated/api';\n\n";
    markdown += "// Example usage\n";
    markdown += "const data = useQuery(api.moduleName.functionName, { arg: 'value' });\n";
    markdown += "```\n\n";

    markdown += "### Mutation Functions\n";
    markdown += "```typescript\n";
    markdown += "import { useMutation } from 'convex/react';\n";
    markdown += "import { api } from './convex/_generated/api';\n\n";
    markdown += "const mutation = useMutation(api.moduleName.functionName);\n";
    markdown += "await mutation({ arg: 'value' });\n";
    markdown += "```\n\n";

    markdown += "### HTTP Endpoints\n";
    markdown += "```bash\n";
    markdown += "# Call HTTP actions directly\n";
    markdown += "curl -X POST https://your-deployment.convex.cloud/http/endpoint \\\n";
    markdown += "  -H 'Content-Type: application/json' \\\n";
    markdown += "  -d '{\"data\": \"value\"}'\n";
    markdown += "```\n";

    // Write to file
    fs.writeFileSync('my-convex-functions.md', markdown);
    console.log('✅ Generated my-convex-functions.md');

  } catch (error) {
    console.error('Error generating functions list:', error);
  }
}

// Run the script
generateFunctionsAndComponentsList();
```

## Method 5: Using MCP Tool (if available)

```typescript
// If you have the MCP tool available
import { FunctionSpecTool } from './convex/src/cli/lib/mcp/tools/functionSpec';

const functions = await FunctionSpecTool.handler(ctx, {
  deploymentSelector: "your-deployment"
});

console.log("Functions via MCP:", functions);
```

## Environment Variables Needed

```bash
# .env file
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_ADMIN_KEY=your-admin-key
```

## Function Response Format

### Function Spec Response
```typescript
interface FunctionSpec {
  identifier: string;           // "moduleName:functionName"
  functionType: "Query" | "Mutation" | "Action" | "HttpAction";
  visibility: { kind: "public" | "internal" };
  args: any;                   // JSON schema for arguments
  returns: any;                // JSON schema for return value
  // For HTTP actions:
  method?: string;             // "GET", "POST", etc.
  path?: string;               // "/api/endpoint"
}
```

### Component Response Format
```typescript
interface Component {
  id: string;
  name: string;
  path: string;
  args: Record<string, any>;
  state: "active" | "inactive";
}
```

## Notes

- You need admin access to call system functions
- The `_system/cli/modules:apiSpec` function returns all function metadata
- The `_system/frontend/components:list` function returns component information
- HTTP actions appear in the function list with `functionType: "HttpAction"`
- Internal functions have `visibility.kind: "internal"`