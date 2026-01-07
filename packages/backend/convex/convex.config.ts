import { defineApp } from "convex/server";
import ossStats from "@erquhart/convex-oss-stats/convex.config";
import loops from "@devwithbobby/loops/convex.config";
import convexPanel from "../../convex-component/src/component/convex.config.js";
import aiAnalysis from "../../ai-analysis-component/src/component/convex.config.js";

const app = defineApp();

app.use(ossStats);
app.use(loops);
app.use(convexPanel, { name: "convexPanel" });
app.use(aiAnalysis, { name: "aiAnalysis" });

export default app;


