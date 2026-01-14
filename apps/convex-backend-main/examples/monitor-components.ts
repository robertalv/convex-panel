async function monitorComponents() {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  client.setAdminAuth(process.env.CONVEX_ADMIN_KEY!);

  // Poll for component changes
  setInterval(async () => {
    try {
      const components = await client.query("_system/frontend/components:list", {});
      
      console.log(`[${new Date().toISOString()}] Active components:`, 
        components.filter(c => c.state === 'active').length
      );
      
      components.forEach(component => {
        console.log(`  - ${component.name}: ${component.state}`);
      });
      
    } catch (error) {
      console.error("Error monitoring components:", error);
    }
  }, 30000); // Check every 30 seconds
}

// Start monitoring
monitorComponents();