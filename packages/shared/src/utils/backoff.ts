/**
 * Backoff Utilities
 * Exponential backoff with jitter for retry logic
 */

// Backoff configuration
const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30000;
const BACKOFF_MULTIPLIER = 2;
const JITTER_FACTOR = 0.1;

/**
 * Calculate exponential backoff with jitter for a given attempt number.
 * This prevents thundering herd problems when multiple clients retry simultaneously.
 *
 * @param attemptNumber - Zero-based attempt number (0 for first retry, 1 for second, etc.)
 * @param options - Optional configuration overrides
 * @returns Delay in milliseconds before the next retry
 */
export function backoffWithJitter(
  attemptNumber: number,
  options?: {
    initialMs?: number;
    maxMs?: number;
    multiplier?: number;
    jitterFactor?: number;
  },
): number {
  const initial = options?.initialMs ?? INITIAL_BACKOFF_MS;
  const max = options?.maxMs ?? MAX_BACKOFF_MS;
  const multiplier = options?.multiplier ?? BACKOFF_MULTIPLIER;
  const jitter = options?.jitterFactor ?? JITTER_FACTOR;

  const baseBackoff = Math.min(
    initial * Math.pow(multiplier, attemptNumber),
    max,
  );
  const jitterAmount = baseBackoff * jitter * (Math.random() - 0.5);
  return Math.floor(baseBackoff + jitterAmount);
}

/**
 * Sleep for a specified duration.
 * Useful in async loops for adding delays.
 *
 * @param ms - Duration to sleep in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Default backoff configuration values for reference
 */
export const BACKOFF_DEFAULTS = {
  INITIAL_BACKOFF_MS,
  MAX_BACKOFF_MS,
  BACKOFF_MULTIPLIER,
  JITTER_FACTOR,
} as const;
