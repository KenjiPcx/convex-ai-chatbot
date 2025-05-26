import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import auth from "@convex-dev/auth/convex.config";
import workflow from "@convex-dev/workflow/convex.config";

const app = defineApp();
app.use(auth);
app.use(agent);
app.use(workflow);

export default app;