/**
 * Validates a Convex identifier (table name, function name, etc.)
 * Convex identifiers must:
 * - Start with a letter or underscore
 * - Contain only letters, numbers, and underscores
 * - Not be empty
 * @param identifier - The identifier to validate
 * @param identifierType - The type of identifier (for error messages)
 * @returns Error message if invalid, undefined if valid
 */
export function validateConvexIdentifier(
  identifier: string | undefined,
  identifierType: string = 'Identifier'
): string | undefined {
  if (!identifier || identifier.trim() === '') {
    return `${identifierType} cannot be empty`;
  }

  const trimmed = identifier.trim();

  // Must start with a letter or underscore
  if (!/^[a-zA-Z_]/.test(trimmed)) {
    return `${identifierType} must start with a letter or underscore`;
  }

  // Can only contain letters, numbers, and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return `${identifierType} can only contain letters, numbers, and underscores`;
  }

  return undefined;
}








