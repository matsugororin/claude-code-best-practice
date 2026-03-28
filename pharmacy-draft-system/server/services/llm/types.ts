/**
 * LLM client abstraction layer.
 * MVP uses rule-based mock. Future: swap in OpenAI/Claude/Gemini.
 */

export interface LLMGenerateOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/** Interface all LLM clients must implement */
export interface LLMClient {
  generate(options: LLMGenerateOptions): Promise<LLMResponse>;
}
