/**
 * AI Analysis Wrapper Functions
 * Exposes the AI Analysis component API to the main app
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { vStreamArgs } from "@convex-dev/agent";

export const getAIConfig = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.aiAnalysis.config.getConfig, {});
  },
});

export const listAgentTools = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.aiAnalysis.chats.listAgentTools, {});
  },
});

export const setAIConfig = mutation({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("none")),
    apiKey: v.string(),
    model: v.string(),
    embeddingModel: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    enabled: v.boolean(),
    automaticAnalysis: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.aiAnalysis.config.setConfig, args);
  },
});

export const testAIConnection = action({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    apiKey: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(components.aiAnalysis.config.testConnection, args);
  },
});

export const analyzeError = action({
  args: {
    errorId: v.string(),
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    stackTrace: v.optional(v.string()),
    logLines: v.optional(v.array(v.string())),
    deploymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(components.aiAnalysis.analysis.errorAnalysis.analyzeError as any, args);
  },
});

export const getErrorAnalysis = query({
  args: {
    errorId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.aiAnalysis.analysis.errorAnalysis.getErrorAnalysis, args);
  },
});

export const getRecentAnalyses = query({
  args: {
    limit: v.optional(v.number()),
    functionPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.aiAnalysis.analysis.errorAnalysis.getRecentAnalyses, args);
  },
});

export const summarizeLogs = action({
  args: {
    logs: v.array(
      v.object({
        timestamp: v.number(),
        message: v.string(),
        functionPath: v.optional(v.string()),
        logLevel: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
      })
    ),
    timeWindow: v.optional(
      v.object({
        start: v.number(),
        end: v.number(),
      })
    ),
    groupByFunction: v.optional(v.boolean()),
    includePatterns: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(components.aiAnalysis.analysis.logSummarization.summarizeLogs as any, args);
  },
});

export const getLogSummary = query({
  args: {
    timeWindow: v.object({
      start: v.number(),
      end: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.aiAnalysis.analysis.logSummarization.getLogSummary, args);
  },
});

export const correlateWithDeployments = action({
  args: {
    errorId: v.string(),
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    stackTrace: v.optional(v.string()),
    logLines: v.optional(v.array(v.string())),
    deployments: v.array(
      v.object({
        deploymentId: v.string(),
        deploymentTime: v.number(),
        commitHash: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(
      components.aiAnalysis.analysis.correlation.findDeploymentImpact,
      args
    );
  },
});

export const getDeploymentCorrelations = query({
  args: {
    deploymentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.aiAnalysis.analysis.correlation.getDeploymentCorrelations,
      args
    );
  },
});

export const getRecentCorrelations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.aiAnalysis.analysis.correlation.getRecentCorrelations,
      args
    );
  },
});

export const suggestFix = action({
  args: {
    errorMessage: v.string(),
    functionPath: v.optional(v.string()),
    timestamp: v.number(),
    stackTrace: v.optional(v.string()),
    logLines: v.optional(v.array(v.string())),
    rootCause: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(components.aiAnalysis.analysis.suggestions.suggestFix, args);
  },
});

export const convertNaturalLanguageQuery = action({
  args: {
    query: v.string(),
    tableName: v.string(),
    fields: v.array(
      v.object({
        fieldName: v.string(),
        type: v.string(),
        optional: v.optional(v.boolean()),
      })
    ),
    sampleDocuments: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(
      components.aiAnalysis.analysis.naturalLanguageQuery.convertNaturalLanguageQuery,
      args
    );
  },
});

export const listChats = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.any(),
      _creationTime: v.number(),
      title: v.string(),
      updatedAt: v.number(),
      threadId: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const chats = await ctx.runQuery(components.aiAnalysis.chats.listChats, {});
    return chats.map((chat: any) => ({
      _id: chat._id,
      _creationTime: chat._creationTime,
      title: chat.title,
      updatedAt: chat.updatedAt,
      threadId: chat.threadId,
    }));
  },
});

export const getChat = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId as any;
    return await ctx.runQuery(components.aiAnalysis.chats.getChat, { chatId });
  },
});

export const getChatMessages = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId as any;
    return await ctx.runQuery(components.aiAnalysis.chats.getChatMessages, { chatId });
  },
});

export const createChat = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.aiAnalysis.chats.createChat, args);
  },
});

export const saveMessage = mutation({
  args: {
    chatId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    error: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId as any;
    return await ctx.runMutation(components.aiAnalysis.chats.saveMessage, {
      chatId,
      role: args.role,
      content: args.content,
      error: args.error,
    });
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId as any;
    return await ctx.runMutation(components.aiAnalysis.chats.updateChatTitle, { chatId, title: args.title });
  },
});

export const deleteChat = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    // Convert string to Id for component call
    const chatId = args.chatId as any;
    return await ctx.runMutation(components.aiAnalysis.chats.deleteChat, { chatId });
  },
});

export const generateResponse = action({
  args: {
    chatId: v.string(),
    prompt: v.string(),
    convexUrl: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    componentId: v.optional(v.union(v.string(), v.null())),
    tableName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId as any;
    return await ctx.runAction(components.aiAnalysis.chats.generateResponse, {
      chatId,
      prompt: args.prompt,
      convexUrl: args.convexUrl,
      accessToken: args.accessToken,
      componentId: args.componentId,
      tableName: args.tableName,
    });
  },
});

export const generateResponseStream = action({
  args: {
    chatId: v.string(),
    prompt: v.string(),
    convexUrl: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    componentId: v.optional(v.union(v.string(), v.null())),
    tableName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId as any;
    return await ctx.runAction(components.aiAnalysis.chats.generateResponseStream, {
      chatId,
      prompt: args.prompt,
      convexUrl: args.convexUrl,
      accessToken: args.accessToken,
      componentId: args.componentId,
      tableName: args.tableName,
    });
  },
});

export const listChatStreams = query({
  args: {
    chatId: v.string(),
    streamArgs: v.optional(vStreamArgs),
  },
  handler: async (ctx, args) => {
    const chatId = args.chatId as any;
    return await ctx.runQuery(components.aiAnalysis.chats.listChatStreams, {
      chatId,
      streamArgs: args.streamArgs || { kind: "list" },
    });
  },
});
