import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { basicAnswer, buildSystemPrompt, replyLanguage, toSources } from '@/lib/chat/answer';
import { getSearchIndex } from '@/lib/chat/knowledge';
import { aiConfig, streamReply } from '@/lib/chat/providers';
import { search } from '@/lib/chat/search';
import { issueChatToken, verifyChatToken } from '@/lib/chat/session';
import { getPageContent, getSiteSettings } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { verifyTurnstile } from '@/lib/turnstile';
import type { ChatEvent, ChatMessage } from '@/types/chat';

const body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(20)
    .refine((m) => m[m.length - 1].role === 'user' && m[m.length - 1].content.length <= 1000, 'last_must_be_user'),
  locale: z.enum(['en', 'ne']).default('en'),
  path: z.string().max(200).regex(/^\/[\w\-/]*$/).default('/'),
  session: z.string().max(200).optional(),
  turnstile_token: z.string().max(4000).optional(),
});

const enc = new TextEncoder();
const line = (e: ChatEvent) => enc.encode(`${JSON.stringify(e)}\n`);
const fail = (code: Extract<ChatEvent, { type: 'error' }>['code'], status: number) =>
  new Response(JSON.stringify({ type: 'error', code } satisfies ChatEvent) + '\n', { status, headers: { 'Content-Type': 'application/x-ndjson' } });

/**
 * AI assistant. Retrieves the most relevant pieces of the site's own content (BM25), then
 * streams an answer from the configured model — or, with no model configured, a
 * retrieval-only answer. Response: newline-delimited JSON events (meta → text… → done).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit('chat-burst', ip, 20, 600)) || !(await rateLimit('chat-day', ip, 100, 86_400))) return fail('rate_limited', 429);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('invalid', 400);
  const { messages, locale, path, turnstile_token } = parsed.data;

  // Bot check once per conversation; afterwards a signed session token is enough.
  let session = parsed.data.session && verifyChatToken(parsed.data.session) ? parsed.data.session : null;
  if (!session) {
    if (!(await verifyTurnstile(turnstile_token, ip))) return fail('bot_check', 403);
    session = issueChatToken();
  }
  if (!(await rateLimit('chat-session', verifyChatToken(session)!, 60, 86_400))) return fail('rate_limited', 429);

  const [settings, site, index, t] = await Promise.all([getPageContent('chat'), getSiteSettings(), getSearchIndex(), getTranslations({ locale, namespace: 'chat' })]);
  if (!settings.enabled) return fail('unavailable', 503);

  const userTurns = messages.filter((m) => m.role === 'user');
  const last = userTurns[userTurns.length - 1].content;
  // Short follow-ups ("and for Canada?") inherit the previous question's topic.
  const followUp = last.length < 60 && userTurns.length > 1;
  const query = followUp ? `${last} ${userTurns[userTurns.length - 2].content}` : last;
  const pagePath = path.replace(/^\/(en|ne)(?=\/|$)/, '') || '/';
  const hits = search(index, query, 6, pagePath, followUp ? last : undefined);
  const lang = replyLanguage(last, locale);
  const sources = toSources(hits, lang);
  const copy = { noMatch: t('noMatch', { phone: site.phone }), readMore: t('readMore'), related: t('related') };

  const cfg = aiConfig();
  const history: ChatMessage[] = messages.slice(-10).map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  while (history[0]?.role === 'assistant') history.shift(); // providers expect the user to speak first

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: ChatEvent) => controller.enqueue(line(e));
      const basic = () => {
        const answer = basicAnswer(hits, lang, copy);
        send({ type: 'meta', mode: 'basic', sources: answer === copy.noMatch ? [] : sources, session: session! });
        send({ type: 'text', delta: answer });
      };
      try {
        if (!cfg) {
          basic();
        } else {
          const system = buildSystemPrompt(
            {
              assistantName: l(settings.assistant_name, 'en') ?? 'St. Xavier Assistant',
              siteName: site.name,
              founded: site.founded_year,
              phone: site.phone,
              whatsapp: site.whatsapp,
              extra: settings.extra_instructions,
            },
            hits,
            { lang, path: pagePath, today: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date()) },
          );
          const signal = AbortSignal.any([req.signal, AbortSignal.timeout(45_000)]);
          const it = streamReply(cfg, system, history, signal);
          let first: IteratorResult<string>;
          try {
            first = await it.next();
          } catch (e) {
            console.error('[chat] model unavailable, falling back to basic mode:', (e as Error).message);
            basic();
            send({ type: 'done' });
            controller.close();
            return;
          }
          send({ type: 'meta', mode: 'ai', sources, session: session! });
          if (!first.done) send({ type: 'text', delta: first.value });
          try {
            for await (const delta of it) send({ type: 'text', delta });
          } catch (e) {
            if (!req.signal.aborted) {
              console.error('[chat] stream interrupted:', (e as Error).message);
              send({ type: 'error', code: 'failed' });
            }
          }
        }
        send({ type: 'done' });
      } catch (e) {
        console.error('[chat]', e);
        send({ type: 'error', code: 'failed' });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}
