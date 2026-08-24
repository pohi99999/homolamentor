import { NextResponse } from "next/server";
import { gateway, generateText, RetryError } from "ai-gateway-sdk";

export const maxDuration = 60;

// TEMPORARY diagnostic route — probes which AI Gateway models are actually
// accessible on this account's current tier. Delete after use.
const CANDIDATES = [
  "openai/gpt-4o-mini",
  "openai/gpt-4.1-nano",
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash",
  "xai/grok-4-fast",
  "meta/llama-3.3-70b",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-haiku-4.5",
];

function extractStatusCode(error: unknown): { statusCode?: number; message?: string } {
  const unwrapped = RetryError.isInstance(error) ? error.lastError : error;
  if (unwrapped && typeof unwrapped === "object") {
    const obj = unwrapped as Record<string, unknown>;
    return {
      statusCode: typeof obj.statusCode === "number" ? obj.statusCode : undefined,
      message: typeof obj.message === "string" ? obj.message : undefined,
    };
  }
  return {};
}

export async function GET() {
  const results: Record<string, { ok: boolean; statusCode?: number; message?: string }> = {};

  for (const model of CANDIDATES) {
    try {
      await generateText({
        model: gateway(model),
        prompt: "Say OK.",
        providerOptions: {
          gateway: { tags: ["probe"] },
        },
      });
      results[model] = { ok: true };
    } catch (error: unknown) {
      const { statusCode, message } = extractStatusCode(error);
      results[model] = { ok: false, statusCode, message };
    }
  }

  // Search-tool probe: gemini-2.5-flash + gateway-native Perplexity search tool
  try {
    const { text, toolResults } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      prompt: "Search the web: what is the current price of gold per ounce? Answer in one sentence.",
      tools: { web_search: gateway.tools.perplexitySearch({ maxResults: 3 }) },
      providerOptions: {
        gateway: { tags: ["probe-search"] },
      },
    });
    results["gemini-2.5-flash+perplexitySearch"] = {
      ok: true,
      message: `text=${text.slice(0, 150)} | toolResults=${JSON.stringify(toolResults).slice(0, 200)}`,
    };
  } catch (error: unknown) {
    const { statusCode, message } = extractStatusCode(error);
    results["gemini-2.5-flash+perplexitySearch"] = { ok: false, statusCode, message };
  }

  return NextResponse.json(results);
}
