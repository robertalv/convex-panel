/**
 * AI Chat API Utilities
 * Functions to call AI chat backend functions from the frontend
 */

export interface AIChat {
  _id: string;
  title: string;
  updatedAt: number;
}

export interface AIChatMessage {
  _id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  error?: boolean;
}

export interface AIChatWithMessages extends AIChat {
  messages: AIChatMessage[];
}

/**
 * Check if AI chat is available (AI is configured and enabled)
 */
export async function isAIChatAvailable(adminClient: any): Promise<boolean> {
  if (!adminClient) {
    return false;
  }

  try {
    const config = await adminClient.query("aiAnalysis:getAIConfig", {});
    return config !== null && config.provider !== "none" && config.enabled === true;
  } catch (error) {
    console.error("Failed to check AI availability:", error);
    return false;
  }
}

/**
 * List all chats
 */
export async function listChats(adminClient: any): Promise<AIChat[]> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:listChats", {});
  } catch (error) {
    console.error("Failed to list chats:", error);
    throw error;
  }
}

/**
 * Get a single chat with all its messages
 */
export async function getChat(
  adminClient: any,
  chatId: string
): Promise<AIChatWithMessages | null> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getChat", { chatId });
  } catch (error) {
    console.error("Failed to get chat:", error);
    throw error;
  }
}

/**
 * Get messages for a specific chat
 */
export async function getChatMessages(
  adminClient: any,
  chatId: string
): Promise<AIChatMessage[]> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.query("aiAnalysis:getChatMessages", { chatId });
  } catch (error) {
    console.error("Failed to get chat messages:", error);
    throw error;
  }
}

/**
 * Create a new chat
 */
export async function createChat(
  adminClient: any,
  title: string
): Promise<{ chatId: string }> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.mutation("aiAnalysis:createChat", { title });
  } catch (error) {
    console.error("Failed to create chat:", error);
    throw error;
  }
}

/**
 * Save a message to a chat
 */
export async function saveMessage(
  adminClient: any,
  chatId: string,
  role: "user" | "assistant",
  content: string,
  error?: boolean
): Promise<{ messageId: string }> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    return await adminClient.mutation("aiAnalysis:saveMessage", {
      chatId,
      role,
      content,
      error,
    });
  } catch (error) {
    console.error("Failed to save message:", error);
    throw error;
  }
}

/**
 * Update chat title (rename)
 */
export async function updateChatTitle(
  adminClient: any,
  chatId: string,
  title: string
): Promise<void> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    await adminClient.mutation("aiAnalysis:updateChatTitle", { chatId, title });
  } catch (error) {
    console.error("Failed to update chat title:", error);
    throw error;
  }
}

/**
 * Delete a chat
 */
export async function deleteChat(adminClient: any, chatId: string): Promise<void> {
  if (!adminClient) {
    throw new Error("Admin client is required");
  }

  try {
    await adminClient.mutation("aiAnalysis:deleteChat", { chatId });
  } catch (error) {
    console.error("Failed to delete chat:", error);
    throw error;
  }
}
