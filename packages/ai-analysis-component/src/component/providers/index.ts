/**
 * AI Provider Factory
 */

import type { AIProvider, AIProviderConfig } from "./base";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";

export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

export type { AIProvider, AIProviderConfig } from "./base";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";
