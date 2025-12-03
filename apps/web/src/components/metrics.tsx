import { useQuery } from "convex/react";
import { api } from "../../../../packages/backend/convex/_generated/api";

const formatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function Metrics() {
  const githubRepo = useQuery(api.stats.getGithubRepo, {
    name: "robertalv/convex-panel",
  });
  const npmPackage = useQuery(api.stats.getNpmPackage, {
    name: "convex-panel",
  });

  const stars = githubRepo?.starCount ?? 0;
  const downloads = npmPackage?.downloadCount ?? 0;

  const isLoading = githubRepo === undefined || npmPackage === undefined;

  const metrics = [
    {
      label: "GitHub stars",
      value: formatter.format(stars),
      href: "https://github.com/robertalv/convex-panel",
    },
    {
      label: "npm downloads",
      value: formatter.format(downloads),
      href: "https://www.npmjs.com/package/convex-panel",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-8 lg:absolute bottom-0 left-0 md:divide-x md:divide-border mt-20 lg:mt-0">
      {metrics.map((metric) => (
        <a
          key={metric.label}
          href={metric.href}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col md:px-8 text-center md:text-left group transition-colors"
        >
          <h4 className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b7280] mb-1 group-hover:text-content-primary">
            {metric.label}
          </h4>
          {isLoading ? (
            <div
              className="mt-1 inline-block h-8 w-16 md:h-9 md:w-20 rounded-md bg-white/5 dark:bg-white/10 animate-pulse"
              aria-hidden="true"
            />
          ) : (
            <span className="mt-1 text-3xl md:text-[32px] font-mono tracking-tight text-[#e5e7eb] group-hover:text-primary">
              {metric.value}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
