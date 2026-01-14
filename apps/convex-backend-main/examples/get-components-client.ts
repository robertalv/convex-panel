import { ConvexHttpClient } from "convex/browser";

async function getComponentsList() {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  try {
    // Get components list
    const components = await client.query("_system/frontend/components:list", {});
    
    console.log("Components:", components);
    return components;
  } catch (error) {
    console.error("Error fetching components:", error);
    throw error;
  }
}

// Usage
const components = await getComponentsList();