import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '@/types/chat';
import { readSse } from './sse';

/**
 * Model provider, chosen by environment variables (see .env.example):
 *   AI_PROVIDER=anthropic   ANTHROPIC_API_KEY, AI_MODEL (default claude-opus-5-5), AI_EFFORT (default low)
 *   AI_PROVIDER=openai      OPENAI_API_KEY, AI_MODEL (required), OPENAI_BASE_URL (any OpenAI-compatible API)
 *   AI_PROVIDER=none        retrieval-only answers, no model calls
 * Without a usable configuration the assistant runs in "basic" (retrieval-only) mode.
 */
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
export type AiConfig = { provider: 'anthropic' | 'openai'; model: string; apiKey: string; baseUrl: string; maxTokens: number; effort: Effort };

const EFFORTS: Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];
/** Models that accept server-side refusal fallbacks in the `"default"` form. */
const DEFAULT_FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5']);

export function aiConfig(): AiConfig | null {
  const provider = (process.env.AI_PROVIDER ?? (process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : 'none')).toLowerCase();
  // Thinking tokens count towards this limit on current Claude models, so leave room for them.
  const maxTokens = Math.min(16_000, Math.max(1_000, Number(process.env.AI_MAX_OUTPUT_TOKENS) || 4_000));
  const effort = EFFORTS.find((e) => e === process.env.AI_EFFORT) ?? 'low'; // short, grounded chat answers
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return { provider, model: process.env.AI_MODEL || 'claude-opus-5-5', apiKey: process.env.ANTHROPIC_API_KEY, baseUrl: '', maxTokens, effort };
  }
  if (provider === 'openai' && process.env.OPENAI_API_KEY && process.env.AI_MODEL) {
    return { provider, model: process.env.AI_MODEL, apiKey: process.env.OPENAI_API_KEY, baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''), maxTokens, effort };
  }
  return null;
}

let anthropic: { key: string; client: Anthropic } | null = null;
const anthropicClient = (apiKey: string) => {
  // `fetch` is looked up per call (not captured once) so the platform's/tests' fetch is always used.
  if (anthropic?.key !== apiKey) anthropic = { key: apiKey, client: new Anthropic({ apiKey, maxRetries: 1, fetch: (url, init) => globalThis.fetch(url, init) }) };
  return anthropic.client;
};

/** Streams the model's reply as text deltas. Throws on API errors or a refusal before any text. */
export async function* streamReply(cfg: AiConfig, system: string, messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string> {
  if (cfg.provider === 'anthropic') {
    const useFallbacks = DEFAULT_FALLBACK_MODELS.has(cfg.model);
    const stream = anthropicClient(cfg.apiKey).beta.messages.stream(
      {
        model: cfg.model,
        max_tokens: cfg.maxTokens,
        system,
        messages,
        output_config: { effort: cfg.effort },
        // If a safety classifier declines, re-run on Anthropic's recommended fallback model.
        ...(useFallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      },
      { signal },
    );
    let wrote = false;
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta' && event.delta.text) {
        wrote = true;
        yield event.delta.text;
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal' && !wrote) throw new Error(`Model declined (${final.stop_details?.category ?? 'unknown'})`);
    return;
  }

  // OpenAI-compatible chat completions (OpenAI, OpenRouter, Groq, Azure OpenAI, local servers…).
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, max_tokens: cfg.maxTokens, stream: true, messages: [{ role: 'system', content: system }, ...messages] }),
  });
  if (!res.ok || !res.body) throw new Error(`Chat API ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`);
  for await (const ev of readSse(res.body)) {
    if (ev.data === '[DONE]') return;
    const d = JSON.parse(ev.data) as { choices?: { delta?: { content?: string } }[]; error?: { message?: string } };
    if (d.error) throw new Error(`Chat stream error: ${d.error.message}`);
    const text = d.choices?.[0]?.delta?.content;
    if (text) yield text;
  }
}
