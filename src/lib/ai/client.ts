import "server-only";
import OpenAI from "openai";
import { LIMITS } from "@/config/app-config";

/**
 * Server-only DeepSeek client: the OpenAI SDK pointed at DeepSeek's
 * OpenAI-compatible endpoint, JSON Output mode, generation timeout and a
 * maximum output length. The model name comes from DEEPSEEK_MODEL.
 */

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AIReply {
  /** Raw content string; may be empty or cut off — callers must validate. */
  content: string;
  usage?: AIUsage;
}

export interface AIClient {
  /** One JSON-mode chat completion. Throws on transport/API errors. */
  completeJSON(system: string, user: string, maxTokens: number): Promise<AIReply>;
}

export class DeepSeekClient implements AIClient {
  private client: OpenAI;

  constructor(
    private opts: {
      apiKey: string;
      model: string;
      baseURL?: string;
      timeoutMs?: number;
    },
  ) {
    this.client = new OpenAI({
      apiKey: opts.apiKey,
      baseURL: opts.baseURL ?? "https://api.deepseek.com",
      timeout: opts.timeoutMs ?? LIMITS.GENERATION_TIMEOUT_MS,
      maxRetries: 0, // retries are handled at the pipeline level
    });
  }

  get model(): string {
    return this.opts.model;
  }

  async completeJSON(system: string, user: string, maxTokens: number): Promise<AIReply> {
    const response = await this.client.chat.completions.create({
      model: this.opts.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
    });
    const choice = response.choices[0];
    return {
      content: choice?.message?.content ?? "",
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens ?? 0,
            outputTokens: response.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }
}

/** Builds the real client, or null when credentials are not configured. */
export function createAIClient(
  env: Record<string, string | undefined> = process.env,
): DeepSeekClient | null {
  if (!env.DEEPSEEK_API_KEY || !env.DEEPSEEK_MODEL) return null;
  return new DeepSeekClient({ apiKey: env.DEEPSEEK_API_KEY, model: env.DEEPSEEK_MODEL });
}
