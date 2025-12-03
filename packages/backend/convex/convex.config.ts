import { defineApp } from "convex/server";
import ossStats from "@erquhart/convex-oss-stats/convex.config";
import loops from "@devwithbobby/loops/convex.config";

const app = defineApp();

app.use(ossStats);
app.use(loops);

export default app;


