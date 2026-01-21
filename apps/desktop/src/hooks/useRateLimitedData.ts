import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Default threshold for updates per second before pausing.
 * If updates exceed this rate, live data will be paused.
 */
const DEFAULT_RATE_THRESHOLD = 10; // 10 updates per second

/**
 * Window size for rate calculation (in milliseconds).
 */
const RATE_WINDOW_MS = 1000;

/**
 * Options for the rate-limited data hook.
 */
export interface RateLimitedDataOptions {
  /**
   * Maximum updates per second before auto-pausing.
   * Default: 10
   */
  rateThreshold?: number;

  /**
   * Whether rate limiting is enabled.
   * Default: true
   */
  enabled?: boolean;

  /**
   * Callback when auto-pause is triggered.
   */
  onAutoPause?: () => void;

  /**
   * Callback when auto-pause is released (user resumes).
   */
  onResume?: () => void;
}

/**
 * Return type for rate-limited data hook.
 */
export interface RateLimitedDataControl<T> {
  /**
   * The current data (may be stale if paused).
   */
  data: T;

  /**
   * Whether live updates are currently paused due to rate limiting.
   */
  isPaused: boolean;

  /**
   * Whether the pause was triggered automatically due to high rate.
   */
  isAutoPaused: boolean;

  /**
   * Manually pause live updates.
   */
  pause: () => void;

  /**
   * Resume live updates and sync to latest data.
   */
  resume: () => void;

  /**
   * Toggle pause state.
   */
  togglePause: () => void;

  /**
   * Current update rate (updates per second).
   */
  currentRate: number;

  /**
   * The rate threshold that triggers auto-pause.
   */
  rateThreshold: number;
}

/**
 * Hook that provides rate-limited live data with auto-pause functionality.
 *
 * When updates come in faster than the rate threshold, the hook will
 * automatically pause updates to prevent UI thrashing and excessive
 * re-renders. The user can manually resume when ready.
 *
 * This is inspired by convex-backend-main's usePausedLiveData pattern
 * which prevents the dashboard from becoming unresponsive during
 * high-frequency log/event streams.
 *
 * @param liveData - The live data stream (changes frequently)
 * @param options - Configuration options
 * @returns Control object with paused state and data
 *
 * @example
 * ```typescript
 * const { logs } = useLogStream();
 *
 * const {
 *   data: displayedLogs,
 *   isPaused,
 *   resume,
 *   currentRate
 * } = useRateLimitedData(logs, {
 *   rateThreshold: 10, // Auto-pause if >10 updates/sec
 *   onAutoPause: () => toast.info("Log stream paused due to high volume"),
 * });
 *
 * // Render displayedLogs instead of logs
 * // Show pause indicator if isPaused
 * ```
 */
export function useRateLimitedData<T>(
  liveData: T,
  options?: RateLimitedDataOptions,
): RateLimitedDataControl<T> {
  const {
    rateThreshold = DEFAULT_RATE_THRESHOLD,
    enabled = true,
    onAutoPause,
    onResume,
  } = options ?? {};

  // Displayed data (frozen when paused)
  const [displayedData, setDisplayedData] = useState<T>(liveData);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  // Rate tracking
  const [currentRate, setCurrentRate] = useState(0);
  const updateTimestamps = useRef<number[]>([]);

  // Track if we've shown the auto-pause message
  const hasNotifiedAutoPause = useRef(false);

  /**
   * Record an update and calculate current rate.
   */
  const recordUpdate = useCallback(() => {
    const now = Date.now();
    updateTimestamps.current.push(now);

    // Remove timestamps outside the window
    const windowStart = now - RATE_WINDOW_MS;
    updateTimestamps.current = updateTimestamps.current.filter(
      (ts) => ts >= windowStart,
    );

    // Calculate rate
    const rate = updateTimestamps.current.length;
    setCurrentRate(rate);

    return rate;
  }, []);

  /**
   * Check if we should auto-pause based on rate.
   */
  const checkRateLimit = useCallback(
    (rate: number) => {
      if (!enabled) return false;

      if (rate > rateThreshold && !isPaused) {
        setIsPaused(true);
        setIsAutoPaused(true);

        if (!hasNotifiedAutoPause.current) {
          hasNotifiedAutoPause.current = true;
          onAutoPause?.();
        }

        return true;
      }

      return false;
    },
    [enabled, rateThreshold, isPaused, onAutoPause],
  );

  /**
   * Update displayed data when live data changes (if not paused).
   */
  useEffect(() => {
    if (!enabled) {
      setDisplayedData(liveData);
      return;
    }

    const rate = recordUpdate();
    const shouldPause = checkRateLimit(rate);

    if (!isPaused && !shouldPause) {
      setDisplayedData(liveData);
    }
  }, [liveData, enabled, isPaused, recordUpdate, checkRateLimit]);

  /**
   * Manually pause updates.
   */
  const pause = useCallback(() => {
    setIsPaused(true);
    setIsAutoPaused(false);
  }, []);

  /**
   * Resume updates and sync to latest data.
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    setIsAutoPaused(false);
    hasNotifiedAutoPause.current = false;
    setDisplayedData(liveData);
    onResume?.();
  }, [liveData, onResume]);

  /**
   * Toggle pause state.
   */
  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  return {
    data: displayedData,
    isPaused,
    isAutoPaused,
    pause,
    resume,
    togglePause,
    currentRate,
    rateThreshold,
  };
}

/**
 * Simplified hook that just tracks update rate without pausing.
 * Useful for displaying rate indicators.
 *
 * @param liveData - The live data to track
 * @returns Current update rate (updates per second)
 */
export function useUpdateRate<T>(liveData: T): number {
  const [rate, setRate] = useState(0);
  const timestamps = useRef<number[]>([]);

  useEffect(() => {
    const now = Date.now();
    timestamps.current.push(now);

    // Remove old timestamps
    const windowStart = now - RATE_WINDOW_MS;
    timestamps.current = timestamps.current.filter((ts) => ts >= windowStart);

    setRate(timestamps.current.length);
  }, [liveData]);

  return rate;
}
