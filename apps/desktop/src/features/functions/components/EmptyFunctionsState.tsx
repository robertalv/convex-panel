import React from "react";
import { ArrowLeft } from "lucide-react";
import { HealthCard } from "@/components/ui";

export const EmptyFunctionsState: React.FC = () => {
  // Generate empty chart path (flat line)
  const emptyChartPath = "M0 95 L 300 95";

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background statistics grid - faded */}
      <div
        className="absolute inset-0 p-4 pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)",
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <HealthCard
            title="Function Calls"
            tip="The number of times this function has been called over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div className="h-[100px] flex items-end relative w-full">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 300 100"
              >
                <line
                  x1="0"
                  y1="25"
                  x2="300"
                  y2="25"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="300"
                  y2="50"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="75"
                  x2="300"
                  y2="75"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="currentColor"
                  className="text-yellow-500"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path
                  d={emptyChartPath}
                  stroke="currentColor"
                  className="text-blue-500"
                  strokeWidth="2"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
              </svg>
            </div>
          </HealthCard>

          <HealthCard
            title="Errors"
            tip="The number of errors this function has encountered over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div className="h-[100px] flex items-end relative w-full">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 300 100"
              >
                <line
                  x1="0"
                  y1="25"
                  x2="300"
                  y2="25"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="300"
                  y2="50"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="75"
                  x2="300"
                  y2="75"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="currentColor"
                  className="text-yellow-500"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path
                  d={emptyChartPath}
                  stroke="currentColor"
                  className="text-red-500"
                  strokeWidth="2"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
              </svg>
            </div>
          </HealthCard>

          <HealthCard
            title="Execution Time"
            tip="The p50 (median) execution time of this function over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div className="h-[100px] flex items-end relative w-full">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 300 100"
              >
                <line
                  x1="0"
                  y1="25"
                  x2="300"
                  y2="25"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="300"
                  y2="50"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="75"
                  x2="300"
                  y2="75"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="currentColor"
                  className="text-yellow-500"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path
                  d={emptyChartPath}
                  stroke="currentColor"
                  className="text-green-500"
                  strokeWidth="2"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
              </svg>
            </div>
          </HealthCard>

          <HealthCard
            title="Cache Hit Rate"
            tip="The percentage of queries served from cache vs executed fresh, over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div className="h-[100px] flex items-end relative w-full">
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 300 100"
              >
                <line
                  x1="0"
                  y1="25"
                  x2="300"
                  y2="25"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="300"
                  y2="50"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1="0"
                  y1="75"
                  x2="300"
                  y2="75"
                  stroke="currentColor"
                  className="text-border-base"
                  strokeDasharray="4"
                  opacity="0.3"
                />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="currentColor"
                  className="text-yellow-500"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path
                  d={emptyChartPath}
                  stroke="currentColor"
                  className="text-blue-500"
                  strokeWidth="2"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
              </svg>
            </div>
          </HealthCard>
        </div>
      </div>

      {/* Centered message */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-surface-base/90 border border-border-base rounded-3xl p-8 text-center text-text-base max-w-md w-11/12 shadow-lg flex items-center gap-4">
          <ArrowLeft size={24} className="text-text-muted flex-shrink-0" />
          <p className="m-0 text-sm text-text-base leading-relaxed text-left">
            Select a function in the expandable panel to the left to view its
            statistics, code, and logs.
          </p>
        </div>
      </div>
    </div>
  );
};
