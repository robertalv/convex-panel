import { ConvexHttpClient } from "convex/browser";
import fs from "fs";

interface Component {
  id: string;
  name: string;
  path: string;
  args: Record<string, any>;
  state: "active" | "inactive";
  definition?: any;
  exports?: any;
}

async function analyzeComponents() {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    // Get components list
    const components: Component[] = await client.query("_system/frontend/components:list", {});
    
    // Get function specs to see component exports
    const functions = await client.query("_system/cli/modules:apiSpec", {});
    
    // Analyze each component
    const componentAnalysis = components.map(component => {
      // Find functions that belong to this component
      const componentFunctions = functions.filter(fn => 
        fn.identifier && fn.identifier.startsWith(`${component.name}:`)
      );
      
      return {
        ...component,
        functionCount: componentFunctions.length,
        functions: componentFunctions.map(fn => ({
          name: fn.identifier.split(':')[1],
          type: fn.functionType,
          visibility: fn.visibility?.kind || 'public'
        }))
      };
    });

    // Generate detailed markdown report
    let markdown = "# Component Analysis Report\n\n";
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    
    if (componentAnalysis.length === 0) {
      markdown += "No components found in this deployment.\n";
    } else {
      markdown += `Found ${componentAnalysis.length} component(s):\n\n`;
      
      componentAnalysis.forEach(component => {
        markdown += `## ${component.name}\n\n`;
        markdown += `- **ID**: ${component.id}\n`;
        markdown += `- **Path**: ${component.path || 'Root'}\n`;
        markdown += `- **State**: ${component.state}\n`;
        markdown += `- **Function Count**: ${component.functionCount}\n`;
        
        if (component.args && Object.keys(component.args).length > 0) {
          markdown += `- **Configuration**:\n`;
          markdown += "```json\n";
          markdown += JSON.stringify(component.args, null, 2);
          markdown += "\n```\n";
        }
        
        if (component.functions.length > 0) {
          markdown += `\n### Exported Functions\n\n`;
          component.functions.forEach(fn => {
            markdown += `- **${fn.name}** (${fn.type}, ${fn.visibility})\n`;
          });
        }
        
        markdown += "\n### Usage Example\n";
        markdown += "```typescript\n";
        markdown += `import { components } from './_generated/api';\n\n`;
        markdown += `// Call component functions\n`;
        if (component.functions.length > 0) {
          const exampleFn = component.functions[0];
          markdown += `const result = await ctx.runQuery(components.${component.name}.${exampleFn.name}, {});\n`;
        }
        markdown += "```\n\n";
      });
    }

    // Write to file
    fs.writeFileSync('component-analysis.md', markdown);
    console.log('✅ Generated component-analysis.md');
    
    return componentAnalysis;

  } catch (error) {
    console.error("Error analyzing components:", error);
    throw error;
  }
}

// Run the analysis
analyzeComponents();