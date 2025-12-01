import { defineApp } from "convex/server";
import ossStats from "@erquhart/convex-oss-stats/convex.config";

const app = defineApp();

// Install the OSS Stats Convex component so we can sync GitHub and npm data
app.use(ossStats);

export default app;


