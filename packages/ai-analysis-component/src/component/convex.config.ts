import { defineComponent } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const component = defineComponent("aiAnalysis");
component.use(agent);

export default component;
