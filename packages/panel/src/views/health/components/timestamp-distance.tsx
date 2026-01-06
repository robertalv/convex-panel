import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface TimestampDistanceProps {
  prefix?: string;
  date: Date;
  className?: string;
  live?: boolean;
  compact?: boolean;
}

export const TimestampDistance: React.FC<TimestampDistanceProps> = ({
  prefix = "",
  date,
  className = "",
  live = false,
  compact = false,
}) => {
  const formatTime = () => {
    return formatDistanceToNow(date, {
      addSuffix: true,
    }).replace("about ", "");
  };

  const [displayTime, setDisplayTime] = React.useState(formatTime());
  const [showTooltip, setShowTooltip] = useState(false);

  React.useEffect(() => {
    if (!live) {
      setDisplayTime(formatTime());
      return;
    }

    // Update every second for live timestamps
    const interval = setInterval(() => {
      setDisplayTime(formatTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [date, live]);

  const fullDate = date.toLocaleString();

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        style={{
          fontSize: compact ? "12px" : "14px",
          color: compact ? "var(--color-panel-text-secondary)" : "#d1d5db",
          cursor: "help",
          ...(className ? {} : {}),
        }}
        className={className}
      >
        {prefix ? `${prefix} ` : ""}
        {displayTime}
      </span>
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            padding: "8px 12px",
            backgroundColor: "#0F1115",
            border: "1px solid #2D313A",
            color: "#d1d5db",
            fontSize: "12px",
            borderRadius: "4px",
            pointerEvents: "none",
            zIndex: 50,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {fullDate}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: "8px",
              height: "8px",
              backgroundColor: "#0F1115",
              borderBottom: "1px solid #2D313A",
              borderRight: "1px solid #2D313A",
              marginTop: "-4px",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};
