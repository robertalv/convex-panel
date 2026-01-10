/**
 * Schedules and Cron Job Types
 * Types for scheduled functions and cron jobs in Convex deployments
 */

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
  status: { type: CronJobStatus; result: { type: string; value: string } };
  logLines: {
    logLines: string[];
    isTruncated: boolean;
  };
  executionTime: number;
};

export type CronJobState = "scheduled" | "running" | "paused";

export type CronNextRun = {
  cronJobId: string; // v.id("_cron_jobs")
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

/**
 * Scheduled Job Types (ad-hoc scheduled functions)
 */

export type ScheduledJob = {
  id: string;
  name: string;
  scheduledTime: number;
  state: "pending" | "inProgress" | "success" | "failed" | "canceled";
  completedTime?: number;
};
