/**
 * Utilities for document field editing
 */

/**
 * Parse a field value to its appropriate type based on the original value
 * @param newValue The edited string value
 * @param originalValue The original value to determine type
 * @returns The parsed value
 */
export const parseFieldValue = (newValue: string, originalValue: any): any => {
  // Handle different types
  if (typeof originalValue === 'number') {
    // Parse as number
    return parseFloat(newValue) || 0;
  } else if (typeof originalValue === 'boolean') {
    // Parse as boolean
    return newValue.toLowerCase() === 'true';
  } else if (originalValue === null) {
    // Keep as null
    return null;
  } else if (originalValue === undefined) {
    return undefined;
  } else if (Array.isArray(originalValue)) {
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(newValue);
      if (!Array.isArray(parsed)) {
        return [parsed]; // Wrap non-array in array
      }
      return parsed;
    } catch (e) {
      // If parsing fails, treat as a single-item array
      return [newValue];
    }
  } else if (typeof originalValue === 'object' && originalValue !== null) {
    // Try to parse as JSON object
    try {
      return JSON.parse(newValue);
    } catch (e) {
      // If parsing fails, return original
      console.warn('Failed to parse JSON object:', e);
      return originalValue;
    }
  }
  
  // Default to string
  return newValue;
};

/**
 * Determine if a field is editable
 * @param fieldName The field name
 * @param value The field value
 * @returns Whether the field is editable
 */
export const isFieldEditable = (fieldName: string, value: any): boolean => {
  // ID fields are not editable
  if (fieldName === '_id' || fieldName === 'id' || fieldName.endsWith('Id')) {
    return false;
  }
  
  // System fields (starting with _) are not editable except for _id which was handled above
  if (fieldName.startsWith('_')) {
    return false;
  }
  
  // Complex objects with no string representation are not editable in simple form
  if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
    // Could make this editable as JSON in the future
    return false;
  }
  
  return true;
};

/**
 * Format a value for display in the UI
 * @param value The value to format
 * @param fieldName Optional field name for context
 * @returns Formatted string representation
 */
export const formatValueForDisplay = (value: any, fieldName?: string): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}; 