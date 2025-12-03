import { Bug, CheckCircle2, Sparkles, Wrench, Zap } from "lucide-react";

type ChangeType = "feature" | "fix" | "improvement" | "chore";

interface ChangeItem {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: ChangeItem[];
}

const releases: Release[] = [
  {
    version: "v0.3.0",
    date: "December 3, 2023",
    title: "Improved Filtering & Mobile Support",
    description:
      "This release focuses on making the panel usable on smaller screens and introduces powerful regex filtering for logs. We've also refined the color palette for better contrast in light mode.",
    changes: [
      {
        type: "feature",
        text: "Added regex support for log filtering (e.g. /user_*/)",
      },
      {
        type: "feature",
        text: "New mobile-responsive layout for the dashboard with collapsible sidebar",
      },
      {
        type: "fix",
        text: "Fixed issue with dark mode persistence across sessions",
      },
      {
        type: "improvement",
        text: "Performance improvements for large log volumes (virtualized lists)",
      },
      {
        type: "feature",
        text: "Added 'Copy as cURL' to function runner",
      },
    ],
  },
  {
    version: "v0.2.1",
    date: "November 20, 2023",
    title: "Quick Fixes & Polish",
    description:
      "A hotfix release to address connection timeouts and improve the initial onboarding experience for new users.",
    changes: [
      {
        type: "fix",
        text: "Increased socket timeout duration to prevent ghost disconnects",
      },
      {
        type: "improvement",
        text: "Better error messages for auth failures",
      },
      {
        type: "improvement",
        text: "Polished empty states for Data View",
      },
      {
        type: "chore",
        text: "Added tooltip helpers for complex configuration options",
      },
    ],
  },
  {
    version: "v0.2.0",
    date: "November 15, 2023",
    title: "The Big Refactor",
    description:
      "We completely rewrote the internal state management to handle thousands of concurrent updates without freezing the UI. This lays the groundwork for the upcoming real-time graph visualizations.",
    changes: [
      {
        type: "improvement",
        text: "Switch to virtualized lists for log viewing (smooth scrolling at 10k+ logs)",
      },
      {
        type: "feature",
        text: "Added 'Clear Logs' button for better session management",
      },
      {
        type: "feature",
        text: "Initial support for Action inspection (inputs/outputs)",
      },
      {
        type: "chore",
        text: "Refactored theme provider to support system preference detection",
      },
    ],
  },
  {
    version: "v0.1.0",
    date: "October 1, 2023",
    title: "Initial Public Release",
    description:
      "First public beta of Convex Panel. Includes core features like Data View, Function Runner, and basic logging.",
    changes: [
      { type: "feature", text: "Browse and edit Convex tables" },
      { type: "feature", text: "Run Queries and Mutations" },
      { type: "feature", text: "Basic log streaming" },
      { type: "feature", text: "OAuth integration" },
    ],
  },
];

const TypeIcon = ({ type }: { type: ChangeType }) => {
  switch (type) {
    case "feature":
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    case "fix":
      return <Bug className="w-4 h-4 text-red-500" />;
    case "improvement":
      return <Zap className="w-4 h-4 text-yellow-500" />;
    case "chore":
      return <Wrench className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
};

const TypeBadge = ({ type }: { type: ChangeType }) => {
  const styles: Record<ChangeType, string> = {
    feature:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    fix: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    improvement:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    chore:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  };

  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles[type]}`}
    >
      {type}
    </span>
  );
};

export function ChangelogPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="mb-20 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-content-primary mb-6 font-display tracking-tight">
          Changelog
        </h1>
        <p className="text-lg md:text-xl text-content-secondary max-w-2xl leading-relaxed">
          Stay up to date with the latest improvements, fixes, and features for
          Convex Panel.
        </p>
      </div>

      <div className="space-y-16">
        {releases.map((release, index) => (
          <div
            key={release.version}
            className="relative grid md:grid-cols-[200px_1fr] gap-8 md:gap-16 group"
          >
            {/* Sticky Date/Version Column */}
            <div className="md:sticky md:top-32 self-start flex md:flex-col flex-row items-center md:items-end gap-3 md:gap-2">
              <span className="text-sm font-bold text-content-tertiary uppercase tracking-wider">
                {release.date}
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background-secondary border border-border shadow-sm">
                <span
                  className="w-2 h-2 rounded-full bg-primary animate-pulse"
                  style={{ opacity: index === 0 ? 1 : 0 }}
                />
                <span className="text-sm font-mono font-semibold text-content-primary">
                  {release.version}
                </span>
              </div>

              {/* Desktop Timeline Dot */}
              <div className="hidden md:block absolute right-[-40px] top-3 w-4 h-4 rounded-full bg-background-primary border-[3px] border-border z-10 group-hover:border-primary group-hover:bg-background-primary transition-colors duration-300" />
            </div>

            {/* Content Column */}
            <div className="relative border-l border-border md:border-l-0 pl-8 md:pl-0 pb-12">
              {/* Mobile Timeline */}
              <div className="md:hidden absolute left-0 top-3 bottom-0 w-px bg-border" />
              <div className="md:hidden absolute left-[-3.5px] top-4 w-2 h-2 rounded-full bg-content-secondary" />

              {/* Desktop Continuous Line */}
              <div className="hidden md:block absolute left-[-33px] top-0 bottom-[-64px] w-px bg-border group-last:bottom-0" />

              <h2 className="text-2xl md:text-3xl font-bold text-content-primary mb-4 font-display tracking-tight">
                {release.title}
              </h2>

              <p className="text-base md:text-lg text-content-secondary mb-8 leading-relaxed max-w-3xl">
                {release.description}
              </p>

              <div className="space-y-3">
                {release.changes.map((change, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-background-secondary/40 transition-colors -ml-3"
                  >
                    <div className="mt-1 shrink-0">
                      <TypeIcon type={change.type} />
                    </div>
                    <div className="flex-1">
                      <p className="text-content-primary text-sm md:text-base leading-relaxed">
                        {change.text}
                      </p>
                    </div>
                    <div className="shrink-0 hidden sm:block">
                      <TypeBadge type={change.type} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <div className="text-content-tertiary text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}


