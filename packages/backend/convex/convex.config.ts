import { defineApp } from "convex/server";
import ossStats from "@erquhart/convex-oss-stats/convex.config";
import loops from "@devwithbobby/loops/convex.config";
import filterHistory from "../../convex-component/src/component/convex.config.js";

const app = defineApp();

app.use(ossStats);
app.use(loops);
app.use(filterHistory, { name: "filterHistory" });

export default app;


