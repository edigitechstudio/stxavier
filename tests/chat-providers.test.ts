import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiConfig, streamReply, type AiConfig } from '@/lib/chat/providers';

const sse = (s: string, status = 200) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        // Split mid-event to exercise reassembly.
        const bytes = new TextEncoder().encode(s);
        c.enqueue(bytes.slice(0, 40));
        c.enqueue(bytes.slice(40));
        c.close();
      },
    }),
    { status, headers: { 'content-type': 'text/event-stream' } },
  );

const ev = (event: string, data: object) => `event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`;

/** A realistic Messages API stream: start → text deltas → stop with the given stop_reason. */
const claudeStream = (texts: string[], stopReason = 'end_turn') =>
  ev('message_start', { message: { id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } }) +
  (texts.length ? ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }) : '') +
  texts.map((t) => ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: t } })).join('') +
  (texts.length ? ev('content_block_stop', { index: 0 }) : '') +
  ev('message_delta', { delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 5 } }) +
  ev('message_stop', {});

const collect = async (it: AsyncGenerator<string>) => {
  let out = '';
  for await (const d of it) out += d;
  return out;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('AI provider configuration', () => {
  it('is off without keys (basic mode)', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    expect(aiConfig()).toBeNull();
  });
  it('defaults to Claude Opus 5.5 at low effort with room for thinking', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    vi.stubEnv('ANTHROPIC_API_KEY', 'k');
    vi.stubEnv('AI_MODEL', '');
    vi.stubEnv('AI_EFFORT', '');
    vi.stubEnv('AI_MAX_OUTPUT_TOKENS', '');
    expect(aiConfig()).toMatchObject({ provider: 'anthropic', model: 'claude-opus-5-5', effort: 'low', maxTokens: 4000 });
    vi.stubEnv('AI_MAX_OUTPUT_TOKENS', '99999');
    vi.stubEnv('AI_EFFORT', 'medium');
    expect(aiConfig()).toMatchObject({ maxTokens: 16000, effort: 'medium' });
  });
  it('requires a model name for OpenAI-compatible providers', () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'k');
    vi.stubEnv('AI_MODEL', '');
    expect(aiConfig()).toBeNull();
    vi.stubEnv('AI_MODEL', 'some-model');
    vi.stubEnv('OPENAI_BASE_URL', 'https://llm.example/v1/');
    expect(aiConfig()).toMatchObject({ provider: 'openai', model: 'some-model', baseUrl: 'https://llm.example/v1' });
  });
});

describe('streaming', () => {
  const anthropic: AiConfig = { provider: 'anthropic', model: 'claude-opus-5-5', apiKey: 'k', baseUrl: '', maxTokens: 4000, effort: 'low' };
  const openai: AiConfig = { provider: 'openai', model: 'm', apiKey: 'k', baseUrl: 'https://llm.example/v1', maxTokens: 500, effort: 'low' };
  const signal = () => new AbortController().signal;

  it('streams Claude text via the SDK with effort, refusal fallbacks and no sampling params', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => sse(claudeStream(['Namaste', ', hello!'])));
    vi.stubGlobal('fetch', fetchMock);
    expect(await collect(streamReply(anthropic, 'SYS', [{ role: 'user', content: 'hi' }], signal()))).toBe('Namaste, hello!');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/v1/messages');
    const headers = new Headers(init.headers);
    expect(headers.get('x-api-key')).toBe('k');
    expect(headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ model: 'claude-opus-5-5', system: 'SYS', stream: true, max_tokens: 4000, output_config: { effort: 'low' }, fallbacks: 'default', messages: [{ role: 'user', content: 'hi' }] });
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('thinking');
  });

  it('omits fallbacks for models without the default fallback form', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => sse(claudeStream(['ok'])));
    vi.stubGlobal('fetch', fetchMock);
    await collect(streamReply({ ...anthropic, model: 'claude-haiku-5-5' }, 'S', [{ role: 'user', content: 'x' }], signal()));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('fallbacks');
  });

  it('treats a refusal with no text as a failure (so the route falls back to basic mode)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => sse(claudeStream([], 'refusal'))));
    await expect(collect(streamReply(anthropic, 'S', [{ role: 'user', content: 'x' }], signal()))).rejects.toThrow(/declined/);
  });

  it('surfaces API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }), { status: 401, headers: { 'content-type': 'application/json' } })));
    await expect(collect(streamReply(anthropic, 'S', [{ role: 'user', content: 'x' }], signal()))).rejects.toThrow();
  });

  it('reads OpenAI-compatible deltas with the system message first', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sse('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: {"choices":[{"delta":{"content":" there"}}]}\n\ndata: [DONE]\n\n'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await collect(streamReply(openai, 'SYS', [{ role: 'user', content: 'hi' }], signal()))).toBe('Hello there');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://llm.example/v1/chat/completions');
    expect(JSON.parse(init.body).messages[0]).toEqual({ role: 'system', content: 'SYS' });
  });
});
