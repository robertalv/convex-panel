/**
 * AI Chat Management
 * Handles creating, storing, and managing AI chat conversations
 * Now uses Agent component for AI-powered responses
 */

import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { createAgent, type AgentContext } from "./agent";
import { createThread, listMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createTools } from "./agentTools";

// Extract readable content (including tool results) from Agent message parts
const serializeContent = (parts: any[] | undefined): string => {
  if (!parts || !Array.isArray(parts)) return "";

  let content = "";
  for (const part of parts) {
    if (part?.type === "text" && typeof part.text === "string") {
      content += part.text;
    } else if (part?.type === "tool-result") {
      try {
        // Tool results can be in different locations depending on the AI SDK version
        // Try multiple paths to find the actual result data
        let resultData = part.result;

        // If result is undefined, try alternative paths
        if (resultData === undefined) {
          resultData = part.output?.value ?? part.output ?? part.content;
        }

        // If still undefined, skip this part (don't output "undefined")
        if (resultData === undefined || resultData === null) {
          continue;
        }

        // Parse if it's a string that looks like JSON
        if (typeof resultData === "string") {
          try {
            resultData = JSON.parse(resultData);
          } catch {
            // Keep as string if not valid JSON
          }
        }

        content += `\n\n\`\`\`json\n${JSON.stringify(resultData, null, 2)}\n\`\`\``;
      } catch (err) {
        console.error("[serializeContent] Error processing tool result:", err, part);
        // Don't output anything for failed serialization
      }
    } else if (part?.type === "tool-call") {
      // Skip tool-call parts - they're not the actual results
      // Only tool-result parts contain the data we want to show
    }
  }
  return content;
};


/**
 * List all chats sorted by updatedAt (descending)
 */
export const listChats = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("aiChats"),
      _creationTime: v.number(),
      title: v.string(),
      updatedAt: v.number(),
      threadId: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_updatedAt")
      .order("desc")
      .collect();

    return chats;
  },
});

/**
 * List available Agent tools (name + description).
 * This is used by the frontend to show which actions the Agent can perform.
 */
export const listAgentTools = query({
  args: {},
  returns: v.array(
    v.object({
      name: v.string(),
      description: v.string(),
    })
  ),
  handler: async (ctx) => {
    // Create tools with minimal context just to read metadata
    const tools = createTools(ctx, undefined);

    return Object.entries(tools).map(([name, toolDef]) => ({
      name,
      description:
        (toolDef as any)?.description ||
        "No description provided",
    }));
  },
});

/**
 * Get a single chat with all its messages
 */
export const getChat = query({
  args: {
    chatId: v.id("aiChats"),
  },
  returns: v.union(
    v.object({
      _id: v.id("aiChats"),
      _creationTime: v.number(),
      title: v.string(),
      updatedAt: v.number(),
      threadId: v.optional(v.string()),
      messages: v.array(
        v.object({
          _id: v.id("aiChatMessages"),
          _creationTime: v.number(),
          chatId: v.id("aiChats"),
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
          timestamp: v.number(),
          error: v.optional(v.boolean()),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return null;
    }

    // Return messages from old format (they're synced by generateResponse)
    // This keeps backward compatibility with the frontend
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return {
      ...chat,
      messages,
    };
  },
});

/**
 * Get messages for a specific chat
 */
export const getChatMessages = query({
  args: {
    chatId: v.id("aiChats"),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiChatMessages"),
      chatId: v.id("aiChats"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      error: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return messages;
  },
});

/**
 * Create a new chat with auto-generated title from first message
 * Also creates an Agent thread for AI-powered responses
 */
export const createChat = mutation({
  args: {
    title: v.string(),
  },
  returns: v.object({
    chatId: v.id("aiChats"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const chatId = await ctx.db.insert("aiChats", {
      title: args.title,
      updatedAt: now,
    });

    // Note: Agent thread will be created when first message is sent via generateResponse
    // This keeps mutations simple and avoids needing action context here

    return { chatId };
  },
});

/**
 * Save a message to a chat and update chat's updatedAt
 */
export const saveMessage = mutation({
  args: {
    chatId: v.id("aiChats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    error: v.optional(v.boolean()),
  },
  returns: v.object({
    messageId: v.id("aiChatMessages"),
  }),
  handler: async (ctx, args) => {
    // Verify chat exists
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Save message
    const messageId = await ctx.db.insert("aiChatMessages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      error: args.error,
    });

    // Update chat's updatedAt
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });

    return { messageId };
  },
});

/**
 * Update chat title (rename)
 */
export const updateChatTitle = mutation({
  args: {
    chatId: v.id("aiChats"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Delete a chat and all its messages
 * Also deletes associated Agent thread if it exists
 */
export const deleteChat = mutation({
  args: {
    chatId: v.id("aiChats"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify chat exists
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Delete Agent thread if it exists
    // Note: Thread deletion will be handled by the Agent component's deleteThread
    // We can't call it directly from a mutation, so the thread will be orphaned
    // In a production system, you might want to add a cleanup job or handle this in an action
    // For now, we'll just delete the chat and messages

    // Delete all messages
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(args.chatId);

    return null;
  },
});

/**
 * Generate AI response using Agent component
 * This is the main entry point for AI-powered chat
 */
export const generateResponse = action({
  args: {
    chatId: v.id("aiChats"),
    prompt: v.string(),
    convexUrl: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    componentId: v.optional(v.union(v.string(), v.null())),
    tableName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Fetch chat via internal query (actions can't access DB directly)
    const chat = await ctx.runQuery(internal.chats.getChatForAction, {
      chatId: args.chatId,
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    // Create agent with context, passing tableName hint for filterData
    const agentContext: AgentContext = {
      convexUrl: args.convexUrl,
      accessToken: args.accessToken,
      componentId: args.componentId,
      tableName: args.tableName ?? null,
    };

    // Get config to pass model info if needed
    const config = await ctx.runQuery(internal.config.getFullConfig, {});

    const agent = await createAgent(ctx, agentContext);

    // Get or create thread
    let threadId: string | undefined = chat.threadId ?? undefined;
    if (!threadId) {
      // Create new thread
      // Missing commitMessage and rollbackMessage in messages.addMessages type
      // The types will be correct at runtime once Convex types are regenerated with `npx convex dev` or `npx convex codegen --component-dir ./src/component`
      // @ts-ignore
      const threadResult = await createThread(ctx, components.agent, {
        title: chat.title,
      });
      // createThread currently returns an object { threadId } (or occasionally a string in older versions)
      threadId =
        typeof threadResult === "string"
          ? threadResult
          : (threadResult as { threadId: string }).threadId;

      // Update chat with threadId
      await ctx.runMutation(internal.chats.updateChatThreadId, {
        chatId: args.chatId,
        threadId,
      });
    }

    // Generate response using agent
    // Note: Agent will automatically save the user prompt message
    try {
      const { thread } = await agent.continueThread(ctx, { threadId });

      // Generate text with tools enabled
      // The model needs to be passed explicitly to generateText (even though it's in Agent constructor)
      // Recreate the model instance to pass to generateText
      let languageModelForGenerateText;
      if (config?.provider === "openai" && config?.apiKey && config?.model) {
        const openaiClient = createOpenAI({ apiKey: config.apiKey.trim() });
        languageModelForGenerateText = openaiClient(config.model.trim());
      } else if (config?.provider === "anthropic" && config?.apiKey && config?.model) {
        const anthropicClient = createAnthropic({ apiKey: config.apiKey.trim() });
        languageModelForGenerateText = anthropicClient(config.model.trim());
      }

      // Generate text with tools enabled
      // Pass the model explicitly to generateText as it requires it
      const generateTextOptions: any = {
        prompt: args.prompt,
        // Allow the model to run multiple tool steps automatically
        maxSteps: 4,
      };

      // CRITICAL: Pass the model explicitly to generateText
      // Even though the Agent has the model in its constructor, generateText requires it
      if (languageModelForGenerateText) {
        generateTextOptions.model = languageModelForGenerateText;
      }

      const result = await thread.generateText(generateTextOptions);

      // Sync Agent messages back to old format for backward compatibility
      // Get all messages from the Agent thread
      // Missing commitMessage and rollbackMessage in messages.addMessages type
      // The types will be correct at runtime once Convex types are regenerated with `npx convex dev` or `npx convex codegen --component-dir ./src/component`
      // @ts-ignore
      const agentMessages = await listMessages(ctx, components.agent, {
        threadId,
        paginationOpts: { cursor: null, numItems: 100 },
      });

      // Get existing messages to check for duplicates
      const existingMessages = await ctx.runQuery(internal.chats.getChatMessagesInternal, {
        chatId: args.chatId,
      });

      // Sync all Agent messages (user, assistant, and tool) to old format
      // Tool messages contain tool results and are displayed as assistant messages
      for (const messageDoc of agentMessages.page || []) {
        const msg = messageDoc.message;
        const role = msg?.role;
        if (role === "user" || role === "assistant" || role === "tool") {
          const content = Array.isArray(msg?.content)
            ? serializeContent(msg.content)
            : typeof msg?.content === "string"
              ? msg.content
              : "";

          if (content.trim()) {
            // For tool messages, save as assistant role since frontend only supports user/assistant
            const saveRole = role === "tool" ? "assistant" : role;

            // Check if message already exists (avoid duplicates)
            const messageExists = existingMessages.some(
              (existingMsg: any) =>
                existingMsg.role === saveRole &&
                Math.abs(existingMsg.timestamp - (messageDoc._creationTime || Date.now())) < 10000 && // 10 second window
                (existingMsg.content === content.trim() ||
                  existingMsg.content.includes(content.substring(0, 100)) ||
                  content.trim().includes(existingMsg.content.substring(0, 100)))
            );

            if (!messageExists) {
              await ctx.runMutation(internal.chats.saveMessageInternal, {
                chatId: args.chatId,
                role: saveRole,
                content: content.trim(),
                timestamp: messageDoc._creationTime || Date.now(),
                error: false,
              });
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error generating response:", error);

      // Save error message
      await ctx.runMutation(internal.chats.saveMessageInternal, {
        chatId: args.chatId,
        role: "assistant",
        content: error instanceof Error ? error.message : "An error occurred while generating a response.",
        timestamp: Date.now(),
        error: true,
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  },
});

/**
 * Stream AI response using Agent component and save stream deltas
 */
export const generateResponseStream: ReturnType<typeof action> = action({
  args: {
    chatId: v.id("aiChats"),
    prompt: v.string(),
    convexUrl: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    componentId: v.optional(v.union(v.string(), v.null())),
    tableName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
    threadId: v.optional(v.string()),
  }),
  handler: async (ctx: ActionCtx, args) => {
    const chat = await ctx.runQuery(internal.chats.getChatForAction, {
      chatId: args.chatId,
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    const agentContext: AgentContext = {
      convexUrl: args.convexUrl,
      accessToken: args.accessToken,
      componentId: args.componentId,
      tableName: args.tableName ?? null,
    };

    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    const agent = await createAgent(ctx, agentContext);

    let threadId: string | undefined = chat.threadId ?? undefined;
    if (!threadId) {
      // Missing commitMessage and rollbackMessage in messages.addMessages type
      // The types will be correct at runtime once Convex types are regenerated with `npx convex dev` or `npx convex codegen --component-dir ./src/component`
      // @ts-ignore
      const threadResult = await createThread(ctx, components.agent, {
        title: chat.title,
      });
      threadId =
        typeof threadResult === "string"
          ? threadResult
          : (threadResult as { threadId: string }).threadId;

      await ctx.runMutation(internal.chats.updateChatThreadId, {
        chatId: args.chatId,
        threadId,
      });
    }

    // Schedule the streaming to run in the background so we can return the threadId immediately
    await ctx.scheduler.runAfter(0, internal.chats.runAgentStream, {
      threadId,
      chatId: args.chatId,
      prompt: args.prompt,
      convexUrl: args.convexUrl,
      accessToken: args.accessToken,
      componentId: args.componentId,
      tableName: args.tableName,
    });

    return {
      success: true,
      threadId,
    };
  },
});

/**
 * Internal action to run the agent stream in the background
 */
export const runAgentStream = internalAction({
  args: {
    threadId: v.string(),
    chatId: v.id("aiChats"),
    prompt: v.string(),
    convexUrl: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    componentId: v.optional(v.union(v.string(), v.null())),
    tableName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agentContext: AgentContext = {
      convexUrl: args.convexUrl,
      accessToken: args.accessToken,
      componentId: args.componentId,
      tableName: args.tableName ?? null,
    };

    const config = await ctx.runQuery(internal.config.getFullConfig, {});
    const agent = await createAgent(ctx, agentContext);

    try {
      // Build model for streamText just like generateResponse
      let languageModelForGenerateText;
      if (config?.provider === "openai" && config?.apiKey && config?.model) {
        const openaiClient = createOpenAI({ apiKey: config.apiKey.trim() });
        languageModelForGenerateText = openaiClient(config.model.trim());
      } else if (config?.provider === "anthropic" && config?.apiKey && config?.model) {
        const anthropicClient = createAnthropic({ apiKey: config.apiKey.trim() });
        languageModelForGenerateText = anthropicClient(config.model.trim());
      }

      // Ensure we hand the Agent a v2 language model (with supportedUrls/specificationVersion v2) to satisfy typings.
      const isLanguageModelV2 = (
        model: unknown
      ): model is LanguageModelV2 => {
        if (!model || typeof model !== "object") return false;
        const candidate = model as { specificationVersion?: unknown; supportedUrls?: unknown };
        return candidate.specificationVersion === "v2" && candidate.supportedUrls !== undefined;
      };

      const modelForGenerateText: LanguageModelV2 | undefined =
        isLanguageModelV2(languageModelForGenerateText)
          ? languageModelForGenerateText
          : undefined;

      // Start streaming with deltas saved so clients can subscribe.
      // We do NOT use returnImmediately here because we want this background action to keep running
      // until the stream is finished.
      const streamingOptions: any = {
        saveStreamDeltas: {
          chunking: "word",
          throttleMs: 300,
        },
      };

      console.log("[runAgentStream] Starting streamText for threadId:", args.threadId);

      await agent.streamText(
        ctx,
        { threadId: args.threadId },
        {
          prompt: args.prompt,
          model: modelForGenerateText,
        },
        streamingOptions
      );

      console.log("[runAgentStream] streamText completed for threadId:", args.threadId);

      // After streaming completes, sync Agent messages back to legacy message store
      // @ts-ignore
      const agentMessages = await listMessages(ctx, components.agent, {
        threadId: args.threadId,
        paginationOpts: { cursor: null, numItems: 100 },
      });



      const existingMessages = await ctx.runQuery(internal.chats.getChatMessagesInternal, {
        chatId: args.chatId,
      });

      for (const messageDoc of agentMessages.page || []) {
        const msg = messageDoc.message;
        const role = msg?.role;
        if (role === "user" || role === "assistant" || role === "tool") {
          const content = Array.isArray(msg?.content)
            ? serializeContent(msg.content)
            : typeof msg?.content === "string"
              ? msg.content
              : "";

          if (content.trim()) {
            const saveRole = role === "tool" ? "assistant" : role;

            const messageExists = existingMessages.some(
              (existingMsg: any) =>
                existingMsg.role === saveRole &&
                Math.abs(existingMsg.timestamp - (messageDoc._creationTime || Date.now())) < 10000 &&
                (existingMsg.content === content.trim() ||
                  existingMsg.content.includes(content.substring(0, 100)) ||
                  content.trim().includes(existingMsg.content.substring(0, 100)))
            );

            if (!messageExists) {
              await ctx.runMutation(internal.chats.saveMessageInternal, {
                chatId: args.chatId,
                role: saveRole as "user" | "assistant",
                content: content.trim(),
                timestamp: messageDoc._creationTime || Date.now(),
                error: false,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in runAgentStream:", error);
      // Save error message
      await ctx.runMutation(internal.chats.saveMessageInternal, {
        chatId: args.chatId,
        role: "assistant",
        content: error instanceof Error ? error.message : "An error occurred while generating a response.",
        timestamp: Date.now(),
        error: true,
      });
    }
  },
});

export const listChatStreams = query({
  args: {
    chatId: v.id("aiChats"),
    streamArgs: vStreamArgs,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.threadId) {
      return { streams: [] };
    }

    // @ts-ignore - syncStreams expects { threadId, streamArgs, includeStatuses }
    const streams = await syncStreams(ctx, components.agent, {
      threadId: chat.threadId,
      streamArgs: args.streamArgs,
      includeStatuses: ["streaming", "finished", "aborted"],
    });

    // Log more details to see if chunks are present
    const streamData = streams as any;
    if (streamData?.messages?.[0]) {
      console.log("[listChatStreams] First stream full:", JSON.stringify(streamData.messages[0]).substring(0, 1000));
    }

    // If we have streams from a list query, fetch their deltas to get actual text
    let messagesWithText = streamData?.messages || [];
    if (messagesWithText.length > 0) {
      // For each stream that's streaming, fetch its deltas
      // @ts-ignore
      const deltas = await ctx.runQuery(components.agent.streams.listDeltas, {
        threadId: chat.threadId,
        cursors: messagesWithText.map((s: any) => ({ streamId: s.streamId, cursor: 0 })),
      });

      // Combine stream metadata with delta text
      if (deltas && deltas.length > 0) {
        console.log("[listChatStreams] Fetched deltas count:", deltas.length);

        // Group ALL deltas by streamId (there can be multiple per stream)
        const deltasByStreamId = new Map<string, any[]>();
        for (const delta of deltas) {
          const existing = deltasByStreamId.get(delta.streamId) || [];
          existing.push(delta);
          deltasByStreamId.set(delta.streamId, existing);
        }

        messagesWithText = messagesWithText.map((stream: any) => {
          const streamDeltas = deltasByStreamId.get(stream.streamId) || [];
          if (streamDeltas.length > 0) {
            // Combine ALL parts from ALL deltas for this stream
            const allParts: any[] = [];
            for (const delta of streamDeltas) {
              if (delta.parts) {
                allParts.push(...delta.parts);
              }
            }

            // Extract text from parts - look for 'delta' field in text-delta type
            const text = allParts
              .map((p: any) => {
                if (typeof p === 'string') return p;
                if (p.type === 'text' && p.text) return p.text;
                if (p.type === 'text-delta' && p.delta) return p.delta;  // This is the key fix!
                if (p.textDelta) return p.textDelta;
                return '';
              })
              .join('');

            if (text) {
              console.log("[listChatStreams] Stream", stream.streamId.substring(0, 8), "text length:", text.length);
            }
            return { ...stream, text, parts: allParts };
          }
          return stream;
        });
      }
    }

    console.log("[listChatStreams] threadId:", chat.threadId, "streams result:", messagesWithText.length, "with text");

    return { kind: 'list', messages: messagesWithText };
  },
});

/**
 * Internal mutation to update chat with threadId
 */
export const updateChatThreadId = internalMutation({
  args: {
    chatId: v.id("aiChats"),
    threadId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      threadId: args.threadId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Internal mutation to save message (used by generateResponse)
 */
export const saveMessageInternal = internalMutation({
  args: {
    chatId: v.id("aiChats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    error: v.optional(v.boolean()),
    timestamp: v.optional(v.number()),
  },
  returns: v.object({
    messageId: v.id("aiChatMessages"),
  }),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    const messageId = await ctx.db.insert("aiChatMessages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      timestamp: args.timestamp || Date.now(),
      error: args.error,
    });
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
    return { messageId };
  },
});

/**
 * Internal query to get chat for action context
 */
export const getChatForAction = internalQuery({
  args: {
    chatId: v.id("aiChats"),
  },
  returns: v.union(
    v.object({
      _id: v.id("aiChats"),
      _creationTime: v.number(),
      title: v.string(),
      updatedAt: v.number(),
      threadId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

/**
 * Internal query to get chat messages (used by generateResponse)
 */
export const getChatMessagesInternal = internalQuery({
  args: {
    chatId: v.id("aiChats"),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiChatMessages"),
      _creationTime: v.number(),
      chatId: v.id("aiChats"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      error: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiChatMessages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

/**
 * Get messages from Agent thread (if using Agent component)
 */
export const getAgentMessages = query({
  args: {
    chatId: v.id("aiChats"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.threadId) {
      return [];
    }

    // Query Agent component for messages
    try {
      // Missing commitMessage and rollbackMessage in messages.addMessages type
      // The types will be correct at runtime once Convex types are regenerated with `npx convex dev` or `npx convex codegen --component-dir ./src/component`
      // @ts-ignore
      const messages = await listMessages(ctx, components.agent, {
        threadId: chat.threadId,
        paginationOpts: { cursor: null, numItems: 100 },
      });

      return messages.page || [];
    } catch (error) {
      console.error("Error fetching agent messages:", error);
      return [];
    }
  },
});
