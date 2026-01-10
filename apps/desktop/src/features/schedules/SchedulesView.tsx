import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2, Code, Pause, Play } from "lucide-react";
import { useScheduledJobs, useCronJobs, useScheduleActions } from "./hooks";
import {
  EmptyScheduledJobsState,
  EmptyCronJobsState,
  ScheduledJobsTable,
  CronJobsTable,
  ScheduledJobArgumentsSheet,
  CronJobDetailSheet,
  CronsFileSheet,
} from "./components";
import { ToolbarButton } from "@/components/ui/button";
import type { CronJobWithRuns } from "@convex-panel/shared";

type TabType = "scheduled" | "cron";

type SheetType = "scheduledArgs" | "cronDetail" | "cronsFile" | null;

interface SheetState {
  type: SheetType;
  data?: any;
}

export function SchedulesView() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<TabType>("scheduled");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>({ type: null });
  const containerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(600);

  // Fetch data based on selected tab
  const { jobs: scheduledJobs, isLoading: isLoadingScheduled } =
    useScheduledJobs({
      enabled: selectedTab === "scheduled" && !isPaused,
    });

  const {
    cronJobs,
    cronJobRuns,
    cronsModulePath,
    isLoading: isLoadingCron,
  } = useCronJobs({
    enabled: selectedTab === "cron" && !isPaused,
  });

  const { cancelJob, cancelAllJobs, isCanceling } = useScheduleActions();

  // Calculate available height for table
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Subtract toolbar (56px) + tabs (49px) + padding
        const availableHeight = rect.height - 105;
        if (availableHeight > 0) {
          setTableHeight(availableHeight);
        }
      }
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);
    updateHeight();

    return () => resizeObserver.disconnect();
  }, []);

  const isLoading =
    selectedTab === "scheduled" ? isLoadingScheduled : isLoadingCron;
  const hasData =
    selectedTab === "scheduled"
      ? scheduledJobs.length > 0
      : cronJobs.length > 0;

  const handleCancelAll = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel all scheduled jobs? This action cannot be undone.",
      )
    ) {
      cancelAllJobs({});
    }
  };

  const handleCancelJob = (jobId: string) => {
    if (window.confirm("Cancel this scheduled job?")) {
      cancelJob({ jobId });
    }
  };

  const handleViewArgs = (job: any) => {
    if (selectedTab === "scheduled") {
      setSheetState({ type: "scheduledArgs", data: job });
    } else {
      // For cron jobs, use the unified detail sheet
      setSheetState({ type: "cronDetail", data: job });
    }
  };

  const handleViewExecutions = (job: CronJobWithRuns) => {
    // Use the unified detail sheet for cron jobs
    setSheetState({ type: "cronDetail", data: job });
  };

  const handleViewCronsFile = () => {
    if (cronsModulePath) {
      setSheetState({ type: "cronsFile", data: cronsModulePath });
    }
  };

  const handleFunctionClick = (functionPath: string) => {
    navigate(`/functions?function=${encodeURIComponent(functionPath)}`);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Main content area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "8px",
            borderBottom: "1px solid var(--color-panel-border)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            backgroundColor: "var(--color-panel-bg)",
            flexShrink: 0,
          }}
        >
          {/* Left side: Search */}
          <div style={{ minWidth: "200px", width: "300px" }}>
            <div className="cp-search-wrapper">
              <Search size={14} className="cp-search-icon" />
              <input
                type="text"
                placeholder={
                  selectedTab === "cron"
                    ? "Search by name..."
                    : "Search by ID..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cp-search-input"
              />
            </div>
          </div>

          {/* Right side: Buttons */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 400,
                color: "var(--color-panel-text-muted)",
              }}
            >
              {selectedTab === "scheduled"
                ? `Total Jobs ${scheduledJobs.length}`
                : `Total Crons ${cronJobs.length}`}
            </span>
            <ToolbarButton
              onClick={() => setIsPaused(!isPaused)}
              variant="ghost"
            >
              {isPaused ? (
                <>
                  <Play size={14} /> Resume
                </>
              ) : (
                <>
                  <Pause size={14} /> Pause
                </>
              )}
            </ToolbarButton>
            {selectedTab === "scheduled" && (
              <ToolbarButton
                onClick={handleCancelAll}
                disabled={isCanceling || !hasData}
                variant="destructive"
              >
                <Trash2 size={12} />
                Cancel All
              </ToolbarButton>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => setSelectedTab("scheduled")}
              style={{
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: 500,
                color:
                  selectedTab === "scheduled"
                    ? "var(--color-panel-text)"
                    : "var(--color-panel-text-muted)",
                background: "none",
                border: "none",
                borderBottom:
                  selectedTab === "scheduled"
                    ? "2px solid var(--color-panel-accent)"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== "scheduled") {
                  e.currentTarget.style.color =
                    "var(--color-panel-text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== "scheduled") {
                  e.currentTarget.style.color = "var(--color-panel-text-muted)";
                }
              }}
            >
              Scheduled Functions
              {scheduledJobs.length > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    color: "var(--color-panel-text-muted)",
                  }}
                >
                  {scheduledJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("cron")}
              style={{
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: 500,
                color:
                  selectedTab === "cron"
                    ? "var(--color-panel-text)"
                    : "var(--color-panel-text-muted)",
                background: "none",
                border: "none",
                borderBottom:
                  selectedTab === "cron"
                    ? "2px solid var(--color-panel-accent)"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== "cron") {
                  e.currentTarget.style.color =
                    "var(--color-panel-text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== "cron") {
                  e.currentTarget.style.color = "var(--color-panel-text-muted)";
                }
              }}
            >
              Cron Jobs
              {cronJobs.length > 0 && (
                <span
                  style={{
                    marginLeft: "8px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    color: "var(--color-panel-text-muted)",
                  }}
                >
                  {cronJobs.length}
                </span>
              )}
            </button>
          </div>
          {selectedTab === "cron" && cronsModulePath && (
            <button
              onClick={handleViewCronsFile}
              style={{
                marginRight: "16px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "var(--color-panel-info)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              <Code size={12} />
              View {cronsModulePath}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-panel-text-muted)",
                fontSize: "14px",
              }}
            >
              Loading...
            </div>
          ) : !hasData || (searchQuery && !hasData) ? (
            selectedTab === "scheduled" ? (
              <EmptyScheduledJobsState searchQuery={searchQuery} />
            ) : (
              <EmptyCronJobsState searchQuery={searchQuery} />
            )
          ) : selectedTab === "scheduled" ? (
            <ScheduledJobsTable
              jobs={scheduledJobs}
              height={tableHeight}
              searchQuery={searchQuery}
              onCancelJob={handleCancelJob}
              onViewArgs={handleViewArgs}
              onFunctionClick={handleFunctionClick}
            />
          ) : (
            <CronJobsTable
              cronJobs={cronJobs}
              height={tableHeight}
              searchQuery={searchQuery}
              onRowClick={handleViewExecutions}
              onFunctionClick={handleFunctionClick}
            />
          )}
        </div>
      </div>

      {/* Sheet panels - slide in from right, push content left */}
      {sheetState.type === "scheduledArgs" && (
        <ScheduledJobArgumentsSheet
          isOpen={true}
          onClose={() => setSheetState({ type: null })}
          job={sheetState.data}
        />
      )}
      {sheetState.type === "cronDetail" && (
        <CronJobDetailSheet
          isOpen={true}
          onClose={() => setSheetState({ type: null })}
          cronJob={sheetState.data}
          allRuns={cronJobRuns}
        />
      )}
      {sheetState.type === "cronsFile" && (
        <CronsFileSheet
          isOpen={true}
          onClose={() => setSheetState({ type: null })}
          cronsModulePath={sheetState.data}
        />
      )}
    </div>
  );
}
