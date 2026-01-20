import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Test function that throws an error
 * Useful for testing error handling and AI error analysis features
 */
export const throwError = mutation({
  args: {
    message: v.optional(v.string()),
    errorType: v.optional(
      v.union(
        v.literal("generic"),
        v.literal("validation"),
        v.literal("notFound"),
        v.literal("internal")
      )
    ),
  },
  handler: async (_ctx, { message, errorType = "generic" }) => {
    const errorMessages = {
      generic: message ?? "This is a test error",
      validation: message ?? "Validation error: Invalid input provided",
      notFound: message ?? "Resource not found",
      internal: message ?? "Internal server error occurred",
    };

    const errorMessage = errorMessages[errorType];
    
    throw new Error(errorMessage);
  },
});

/**
 * Query version that throws an error
 */
export const throwErrorQuery = query({
  args: {
    message: v.optional(v.string()),
  },
  handler: async (_ctx, { message }) => {
    throw new Error(message ?? "This is a test query error");
  },
});
