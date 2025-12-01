// WARNING: THIS FILE SHOULD NOT BE USED IN ANYWAY SHAPE OR FORM IN THE CONVEX PANEL
// DO NOT IMPORT ANYTHING OUT OF THIS FILE

import { Infer, v } from "convex/values";

export type CronSchedule =
  | {
    type: "interval";
    seconds: bigint;
  }
  | {
    type: "hourly";
    minuteUTC: bigint;
  }
  | {
    type: "daily";
    hourUTC: bigint;
    minuteUTC: bigint;
  }
  | {
    type: "weekly";
    dayOfWeek: bigint;
    hourUTC: bigint;
    minuteUTC: bigint;
  }
  | {
    type: "monthly";
    day: bigint;
    hourUTC: bigint;
    minuteUTC: bigint;
  }
  | {
    type: "cron";
    cronExpr: string;
  };

export type AnalyzedCronSpec = {
  udfPath: string;
  udfArgs: ArrayBuffer;
  cronSchedule: CronSchedule;
};

export type CronJob = {
  name: string;
  cronSpec: AnalyzedCronSpec;
};

export type CronSpec = CronJob["cronSpec"];
export type CronJobStatus = "success" | "failure" | "running";
export type CronJobLog = {
  name: string;
  ts: bigint;
  udfPath: string;
  udfArgs: ArrayBuffer;
  status: {type: CronJobStatus, result:{type:string, value:string}};
  logLines: {
    logLines: string[];
    isTruncated: boolean;
  };
  executionTime: number;
};
export type CronJobState = "scheduled" | "running" | "paused";
export type CronNextRun = {
  cronJobId: string;          // v.id("_cron_jobs")
  state: CronJobState;
  prevTs: bigint | null;
  nextTs: bigint;
};

export type CronJobWithRuns = CronJob & {
  // last run log row
  lastRun: CronJobLog | null;

  // next scheduled run row
  nextRun: CronNextRun;
};

export type Modules = Map<string, Module>;
// To deprecate
export type Module = {
  functions: AnalyzedModuleFunction[];
  cronSpecs?: [string, CronSpec][];
  // By returning sourcePackageId, we make module queries rerender when source
  // code changes, which allows the dashboard to refetch source code.
  sourcePackageId: string;
};

export const udfType = v.union(
  v.literal("Query"),
  v.literal("Mutation"),
  v.literal("Action"),
  v.literal("HttpAction"),
);
export const udfVisibility = v.union(
  v.object({ kind: v.literal("public") }),
  v.object({ kind: v.literal("internal") }),
);

export type Visibility = Infer<typeof udfVisibility>;
export type UdfType = Infer<typeof udfType>;
export type AnalyzedModuleFunction = {
  name: string;
  lineno?: number;
  udfType: UdfType;
  visibility: Visibility;
  argsValidator: string;
};
