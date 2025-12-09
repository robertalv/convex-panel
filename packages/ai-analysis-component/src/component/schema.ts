import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Global AI provider configuration (single document)
  aiConfig: defineTable({
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("none")),
    apiKey: v.string(), // Encrypted/stored securely
    model: v.string(), // e.g., "gpt-4", "claude-3-opus"
    embeddingModel: v.optional(v.string()), // e.g., "text-embedding-3-large" (for OpenAI, optional)
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    enabled: v.boolean(),
    automaticAnalysis: v.boolean(), // Enable background jobs
    updatedAt: v.number(),
  }),

  // Root cause analysis results
  errorAnalyses: defineTable({
    errorId: v.string(), // Unique identifier for the error
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    rootCause: v.string(), // AI-generated root cause
    confidence: v.number(), // 0-1 confidence score
    suggestions: v.array(v.string()), // Fix suggestions
    deploymentId: v.optional(v.string()),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_function", ["functionPath"])
    .index("by_errorId", ["errorId"]),

  // Summarized log periods
  logSummaries: defineTable({
    timeWindow: v.object({
      start: v.number(),
      end: v.number(),
    }),
    summary: v.string(), // AI-generated summary
    keyEvents: v.array(v.string()), // Important events identified
    errorCount: v.number(),
    functionCount: v.number(),
    affectedFunctions: v.array(v.string()),
  })
    .index("by_timeWindow", ["timeWindow.start", "timeWindow.end"]),

  // Error-deployment correlations
  deploymentCorrelations: defineTable({
    deploymentId: v.string(),
    deploymentTime: v.number(),
    errorId: v.string(),
    correlationScore: v.number(), // 0-1 correlation confidence
    affectedFunctions: v.array(v.string()),
  
  })
    .index("by_deployment", ["deploymentId"])
    .index("by_error", ["errorId"])
    .index("by_deploymentTime", ["deploymentTime"]),

  // Cached AI responses
  aiCache: defineTable({
    cacheKey: v.string(), // Hash of input
    provider: v.string(),
    model: v.string(),
    response: v.any(), // Cached response
    expiresAt: v.number(),
  })
    .index("by_key", ["cacheKey"])
    .index("by_expiresAt", ["expiresAt"]),

  // Background job tracking
  analysisJobs: defineTable({
    jobType: v.union(
      v.literal("analyzeErrors"),
      v.literal("summarizeLogs"),
      v.literal("correlateDeployment")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    parameters: v.any(), // Job parameters
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    scheduledAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_jobType", ["jobType"])
    .index("by_scheduledAt", ["scheduledAt"]),

  // AI Chat conversations
  aiChats: defineTable({
    title: v.string(),
    updatedAt: v.number(),
    threadId: v.optional(v.string()), // Agent component thread ID
  })
    .index("by_updatedAt", ["updatedAt"]),

  // Messages within AI chats
  aiChatMessages: defineTable({
    chatId: v.id("aiChats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    error: v.optional(v.boolean()),
  })
    .index("by_chatId", ["chatId"]),
});
