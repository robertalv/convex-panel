import { CronSchedule } from "../lib/common-types";

export function formatCronSchedule(schedule: CronSchedule): string {
  if (!schedule) return "Unknown schedule";

  switch (schedule.type) {
    case "interval":
      return `Every ${schedule.seconds} seconds`;
    case "hourly":
      return `Every hour at minute ${schedule.minuteUTC}`;
    case "daily":
      return `Every day at ${schedule.hourUTC}:${schedule.minuteUTC.toString().padStart(2, '0')} UTC`;
    case "weekly":
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `Every ${days[Number(schedule.dayOfWeek)]} at ${schedule.hourUTC}:${schedule.minuteUTC.toString().padStart(2, '0')} UTC`;
    case "monthly":
      return `Every month on day ${schedule.day} at ${schedule.hourUTC}:${schedule.minuteUTC.toString().padStart(2, '0')} UTC`;
    case "cron":
      return `Cron: ${schedule.cronExpr}`;
    default:
      return "Unknown schedule";
  }
}

export function formatRelativeTime(timestamp: bigint | number): string {
  if (!timestamp) return "-";

  const ms = typeof timestamp === 'bigint' ? Number(timestamp) / 1000000 : timestamp;
  const now = Date.now();
  const diff = now - ms;
  const absDiff = Math.abs(diff);
  const isPast = diff > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${isPast ? 'ago' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${isPast ? 'ago' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ${isPast ? 'ago' : ''}`;
  return isPast ? 'Just now' : 'Right now';
}