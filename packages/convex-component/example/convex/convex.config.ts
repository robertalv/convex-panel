import { defineApp } from "convex/server";
import convexPanelComponent from "convex-panel/component/convex.config.js";

const app = defineApp();
app.use(convexPanelComponent);

export default app;
