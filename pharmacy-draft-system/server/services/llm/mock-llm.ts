import type { LLMClient, LLMGenerateOptions, LLMResponse } from "./types";

/**
 * Mock LLM client for MVP.
 * In MVP, all generation is rule-based so this client is a no-op passthrough.
 * When integrating a real LLM, replace this with OpenAIClient or ClaudeClient
 * and inject via getLLMClient().
 */
export class MockLLMClient implements LLMClient {
  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    // Stub — rule-based generators don't call this
    return {
      content: options.prompt,
      model: "mock-rule-based-v1",
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }
}

/**
 * Factory — swap implementation here for LLM integration.
 * Example future usage:
 *   if (process.env.LLM_PROVIDER === "anthropic") return new ClaudeClient();
 *   if (process.env.LLM_PROVIDER === "openai") return new OpenAIClient();
 */
export function getLLMClient(): LLMClient {
  return new MockLLMClient();
}
