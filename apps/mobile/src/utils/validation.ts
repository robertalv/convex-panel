/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate deployment name format
 */
export function isValidDeploymentName(name: string): boolean {
  // Deployment names should be alphanumeric with hyphens
  const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return nameRegex.test(name);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string for display (remove sensitive data)
 */
export function sanitizeForDisplay(str: string): string {
  // Remove anything that looks like a token or key
  return str
    .replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[REDACTED]');
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}
