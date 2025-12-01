// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Archive todos older than 1 hour - runs every hour
crons.interval(
  "archive old todos",
  { hours: 1 }, 
  internal.todos.archiveOldTodos
);

// Delete completed todos - runs every hour
crons.interval(
  "delete completed todos",
  { hours: 1 }, 
  internal.todos.deleteCompletedTodos
);



export default crons;