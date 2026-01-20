import { useState, useEffect } from "react";

interface StatuspageComponent {
  id: string;
  name: string;
  status: string;
}

interface StatuspageSummary {
  status: {
    indicator: "none" | "minor" | "major" | "critical" | "maintenance";
    description: string;
  };
  components: StatuspageComponent[];
}

interface ConvexStatus {
  indicator: "none" | "minor" | "major" | "critical" | "maintenance";
  description: string;
  isLoading: boolean;
  error: string | null;
}

const STATUS_COLORS = {
  none: "bg-green-500",
  minor: "bg-yellow-500",
  major: "bg-orange-500",
  critical: "bg-red-500",
  maintenance: "bg-blue-500",
} as const;

export function useConvexStatus(): ConvexStatus {
  const [status, setStatus] = useState<ConvexStatus>({
    indicator: "none",
    description: "All systems operational",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const response = await fetch(
          "https://status.convex.dev/api/v2/summary.json",
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: StatuspageSummary = await response.json();

        if (!cancelled) {
          setStatus({
            indicator: data.status.indicator,
            description: data.status.description,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({
            indicator: "none",
            description: "All systems operational",
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    fetchStatus();

    const interval = setInterval(fetchStatus, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}

export function getStatusColor(
  indicator: "none" | "minor" | "major" | "critical" | "maintenance",
): string {
  return STATUS_COLORS[indicator] || STATUS_COLORS.none;
}
