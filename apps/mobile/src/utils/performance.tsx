/**
 * Performance Monitoring Utilities
 * 
 * Provides tools to measure and track app performance metrics
 */

import React from 'react';
import { InteractionManager } from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = __DEV__; // Only enable in development

  /**
   * Start timing a performance metric
   */
  start(metricName: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(metricName, {
      name: metricName,
      startTime: Date.now(),
      metadata,
    });
  }

  /**
   * End timing a performance metric and log the result
   */
  end(metricName: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`Performance metric "${metricName}" was never started`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log the metric
    console.log(
      `[Performance] ${metricName}: ${duration}ms`,
      metric.metadata ? metric.metadata : ''
    );

    // Clean up
    this.metrics.delete(metricName);

    return duration;
  }

  /**
   * Measure the time it takes for a function to execute
   */
  async measure<T>(
    metricName: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(metricName, metadata);

    try {
      const result = await Promise.resolve(fn());
      this.end(metricName);
      return result;
    } catch (error) {
      this.end(metricName);
      throw error;
    }
  }

  /**
   * Measure time until interactions are complete
   * Useful for measuring perceived performance
   */
  measureInteraction(metricName: string): void {
    if (!this.isEnabled) return;

    const startTime = Date.now();

    InteractionManager.runAfterInteractions(() => {
      const duration = Date.now() - startTime;
      console.log(`[Performance] ${metricName} (interactions): ${duration}ms`);
    });
  }

  /**
   * Log component render time
   * Use with React Profiler API
   */
  logRender(
    componentName: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number
  ): void {
    if (!this.isEnabled) return;

    if (actualDuration > 16) {
      // Log slow renders (> 16ms = below 60fps)
      console.warn(
        `[Performance] Slow ${phase}: ${componentName}`,
        `Actual: ${actualDuration.toFixed(2)}ms`,
        `Base: ${baseDuration.toFixed(2)}ms`
      );
    }
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Hook to measure component mount/update time
 * 
 * @example
 * function MyComponent() {
 *   usePerformanceTrace('MyComponent');
 *   // ... component logic
 * }
 */
export function usePerformanceTrace(componentName: string): void {
  if (__DEV__) {
    perfMonitor.measureInteraction(`${componentName} render`);
  }
}

/**
 * Higher-order component to add performance profiling
 * 
 * @example
 * export default withPerformanceProfile('MyComponent')(MyComponent);
 */
export function withPerformanceProfile<P extends object>(
  componentName: string
) {
  return function (Component: React.ComponentType<P>) {
    return React.memo(function ProfiledComponent(props: P) {
      perfMonitor.measureInteraction(componentName);
      return <Component {...props} />;
    });
  };
}

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return perfMonitor.measure(`API: ${apiName}`, apiCall);
}

/**
 * Log memory usage (React Native specific)
 */
export function logMemoryUsage(): void {
  if (!__DEV__) return;

  // Note: Memory measurement requires native modules
  // This is a placeholder for future implementation
  console.log('[Performance] Memory monitoring not yet implemented');
}

/**
 * Performance marks for measuring navigation
 */
export const NavigationPerf = {
  markNavigationStart(routeName: string): void {
    perfMonitor.start(`Navigation to ${routeName}`);
  },

  markNavigationEnd(routeName: string): void {
    perfMonitor.end(`Navigation to ${routeName}`);
  },
};

// Performance budget thresholds (in milliseconds)
export const PERF_BUDGETS = {
  // API calls
  API_FAST: 500,
  API_NORMAL: 1000,
  API_SLOW: 2000,

  // UI interactions
  BUTTON_PRESS: 100,
  NAVIGATION: 300,
  SCREEN_LOAD: 1000,

  // Rendering
  COMPONENT_RENDER: 16, // 60fps = 16.67ms per frame
  LIST_SCROLL: 16,
};

/**
 * Check if a duration exceeds the performance budget
 */
export function checkPerformanceBudget(
  duration: number,
  budgetKey: keyof typeof PERF_BUDGETS
): boolean {
  const budget = PERF_BUDGETS[budgetKey];
  const exceeded = duration > budget;

  if (exceeded && __DEV__) {
    console.warn(
      `[Performance Budget] Exceeded ${budgetKey} budget`,
      `Duration: ${duration}ms, Budget: ${budget}ms`
    );
  }

  return exceeded;
}
