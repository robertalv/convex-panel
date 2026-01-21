import { MetricHealth } from "@/views/health/components/big-metric";

/**
 * Get the function type badge abbreviation.
 * @param type - The function type
 * @returns The function type badge abbreviation
 */
export function getFunctionTypeBadge(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized === "query" || normalized === "q") return "Q";
    if (normalized === "mutation" || normalized === "m") return "M";
    if (
      normalized === "httpaction" ||
      normalized === "http" ||
      normalized === "h"
    )
      return "HTTP";
    return "A";
  }
  
  
  /**
   * Configuration for function type badge.
   * @param colorClass - The color class
   * @param bgClass - The background class
   */
  export interface FunctionTypeBadgeConfig {
    colorClass: string;
    bgClass: string;
  }
  
  export function getFunctionTypeBadgeClasses(type: string): FunctionTypeBadgeConfig {
    const normalized = type.toLowerCase();
    if (normalized === "query") {
      return { colorClass: "text-info", bgClass: "bg-info/15" };
    }
    if (normalized === "mutation") {
      return { colorClass: "text-success", bgClass: "bg-success/15" };
    }
    if (normalized === "action") {
      return { colorClass: "text-warning", bgClass: "bg-warning/15" };
    }
    if (normalized === "httpaction") {
      return {
        colorClass: "text-[#8b5cf6]",
        bgClass: "bg-[rgba(139,92,246,0.15)]",
      };
    }
    return { colorClass: "text-muted", bgClass: "bg-surface-alt" };
  }
  
  /**
   * Get color class based on latency
   */
  export function getLatencyColorClass(ms: number): string {
    if (ms > 5000) return "text-error"; // Red for > 5s
    if (ms > 1000) return "text-warning"; // Orange for > 1s
    if (ms > 500) return "text-yellow-500"; // Yellow for > 500ms
    return "text-foreground";
  }
  
  /**
   * Get bar color class based on latency
   */
  export function getBarColorClass(ms: number): string {
    if (ms > 5000) return "bg-error";
    if (ms > 1000) return "bg-warning";
    if (ms > 500) return "bg-yellow-500";
    return "bg-success";
  }
  
  /**
   * Format latency to human readable
   * Ensures a maximum of 3 decimals after the decimal point
   */
  export function formatLatency(
    ms: number,
    precision: number = 1
  ): string {
    const safePrecision = Math.min(Math.max(0, precision), 3);

    if (ms < 1) return "<1ms";
    if (ms < 1000) {
      const fixedMs =
        safePrecision > 0
          ? parseFloat(ms.toFixed(safePrecision)).toString()
          : Math.round(ms).toString();
      return `${fixedMs}ms`;
    }
    return `${(ms / 1000).toFixed(safePrecision)}s`;
  }

  /**
   * Get chart color based on health
   */
  export function getChartColor(
    health: MetricHealth,
  ): "success" | "warning" | "error" | "brand" {
    switch (health) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "brand";
    }
  }

/**
 * Format large numbers with K, M, B suffixes
 * @param num - The number to format
 * @returns The formatted number with K, M, B suffixes
 */
export function formatLargeNumberWithSuffix(num: number): string {
  if (num === 0) return "0";
  if (num < 1000) return num.toFixed(0);
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  return `${(num / 1_000_000_000).toFixed(1)}B`;
}

/**
 * Format GB-hours to human readable
 * @param gbHours - The GB-hours to format
 * @returns The formatted GB-hours
 */
export function formatGBHours(gbHours: number): string {
  if (gbHours === 0) return "0";
  if (gbHours < 0.01) return "<0.01";
  if (gbHours < 1) return gbHours.toFixed(2);
  return gbHours.toFixed(1);
}