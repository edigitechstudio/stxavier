'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, CalendarCheck, PhoneCall, RotateCcw, Square, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { WhatsAppIcon } from '@/components/layout/whatsapp-icon';
import { InlineLeadForm } from '@/components/sx/counselling';
import { useTurnstile } from '@/components/sx/turnstile';
import { Link } from '@/i18n/navigation';
import type { ChatEvent, ChatSource } from '@/types/chat';
import type { ChatWidgetProps } from './chat-launcher';
import { RichText } from './rich-text';

type Msg = { role: 'user' | 'assistant'; content: string; sources?: ChatSource[]; mode?: 'ai' | 'basic'; error?: string };
type Stored = { messages: Msg[]; session: string | null };

const STORE = 'sx-chat-v1';
const load = (): Stored => {
  try {
    const raw = sessionStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* storage unavailable */
  }
  return { messages: [], session: null };
};
const save = (s: Stored) => {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* storage unavailable, the chat still works for this page view */
  }
};

export default function ChatPanel({ open, onClose, assistantName, greeting, disclaimer, suggestions, whatsappHref }: ChatWidgetProps & { open: boolean; onClose: () => void }) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const turnstile = useTurnstile();
  const [state, setState] = useState<Stored>(load);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [callback, setCallback] = useState(false);
  const [answered, setAnswered] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const { messages, session } = state;

  useEffect(() => save(state), [state]);
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages, callback]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const patchLast = (fn: (m: Msg) => Msg) =>
    setState((s) => ({ ...s, messages: [...s.messages.slice(0, -1), fn(s.messages[s.messages.length - 1])] }));

  async function ask(text: string) {
    const q = text.trim().slice(0, 1000);
    if (!q || busy) return;
    if (!session && turnstile.enabled && !turnstile.token) {
      setState((s) => ({ ...s, messages: [...s.messages, { role: 'assistant', content: '', error: t('verifying') }] }));
      return;
    }
    const history = [...messages.filter((m) => !m.error && m.content), { role: 'user' as const, content: q }];
    setInput('');
    setCallback(false);
    setBusy(true);
    setState((s) => ({ ...s, messages: [...s.messages.filter((m) => !m.error), { role: 'user', content: q }, { role: 'assistant', content: '' }] }));

    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          messages: history.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 4000) })),
          locale,
          path: window.location.pathname,
          session: session ?? undefined,
          turnstile_token: session ? undefined : turnstile.token,
        }),
      });
      if (!session) turnstile.reset();
      if (!res.body) throw new Error('no body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const raw = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!raw) continue;
          const ev = JSON.parse(raw) as ChatEvent;
          if (ev.type === 'meta') {
            setState((s) => ({ ...s, session: ev.session }));
            patchLast((m) => ({ ...m, sources: ev.sources, mode: ev.mode }));
          } else if (ev.type === 'text') {
            patchLast((m) => ({ ...m, content: m.content + ev.delta }));
          } else if (ev.type === 'error') {
            if (ev.code === 'bot_check') setState((s) => ({ ...s, session: null }));
            patchLast((m) => ({ ...m, error: t(`errors.${ev.code}`) }));
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') patchLast((m) => ({ ...m, error: t(navigator.onLine ? 'errors.failed' : 'errors.offline') }));
    } finally {
      abort.current = null;
      setBusy(false);
      setAnswered((n) => n + 1);
    }
  }

  const reset = () => {
    abort.current?.abort();
    setState({ messages: [], session });
    setCallback(false);
    field.current?.focus();
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const questions = messages.filter((m) => m.role === 'user').slice(-5);

  return (
    <section id="sx-chat" className={`chat-panel ${open ? 'is-open' : ''}`} role="dialog" aria-modal="false" aria-labelledby="sx-chat-title" hidden={!open}>
      <header className="chat-head">
        <span className="chat-avatar" aria-hidden><Bot size={22} /></span>
        <div>
          <h2 id="sx-chat-title">
            {assistantName} <span className="chat-ai-badge">{t('aiBadge')}</span>
          </h2>
          <p>{t('online')}</p>
        </div>
        <button type="button" className="chat-icon" onClick={reset} aria-label={t('newChat')} title={t('newChat')}><RotateCcw size={17} /></button>
        <button type="button" className="chat-icon" onClick={onClose} aria-label={t('close')}><X size={19} /></button>
      </header>
      <p className="chat-disclaimer">{disclaimer}</p>

      <div className="chat-log" ref={list}>
        <div className="chat-msg is-assistant">
          <div className="chat-bubble"><p>{greeting}</p></div>
        </div>
        {messages.length === 0 && (
          <div className="chat-suggest" role="group" aria-label={t('suggestions')}>
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg is-${m.role}`}>
            {m.role === 'user' ? (
              <div className="chat-bubble"><span className="sr-only">{t('you')}: </span>{m.content}</div>
            ) : (
              <div className="chat-bubble">
                {m.content ? <RichText text={m.content} /> : !m.error && <p className="chat-typing" aria-label={t('thinking')}><i /><i /><i /></p>}
                {m.error && <p className="chat-error" role="alert">{m.error}</p>}
                {m.mode === 'basic' && m.content && <p className="chat-note">{t('basicMode')}</p>}
                {m.sources && m.sources.length > 0 && m.content && (
                  <div className="chat-sources">
                    <small>{t('sources')}</small>
                    {m.sources.map((s) => <Link key={s.id} href={s.path}>{s.title}</Link>)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {lastAssistant && !busy && (lastAssistant.content || lastAssistant.error) && (
          <div className="chat-handoff">
            <small>{t('handoff')}</small>
            <div>
              <a href={whatsappHref} target="_blank" rel="noopener" className="is-wa"><WhatsAppIcon className="size-4" /> {t('whatsapp')}</a>
              <Link href="/book"><CalendarCheck size={15} aria-hidden /> {t('book')}</Link>
              <button type="button" onClick={() => setCallback((c) => !c)} aria-expanded={callback}><PhoneCall size={15} aria-hidden /> {t('callback')}</button>
            </div>
          </div>
        )}
        {callback && (
          <div className="chat-callback">
            <InlineLeadForm
              source="chat"
              showDestination={false}
              header={<p className="chat-callback-title">{t('callbackTitle')}</p>}
              answers={Object.fromEntries(questions.map((q, i) => [`question_${i + 1}`, q.content.slice(0, 200)]))}
            />
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">{answered > 0 && !busy && lastAssistant?.content ? lastAssistant.content.slice(0, 300) : ''}</p>

      <form
        className="chat-compose"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        {!session && turnstile.element}
        <textarea
          ref={field}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void ask(input);
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
        />
        {busy ? (
          <button type="button" className="chat-send" onClick={() => abort.current?.abort()} aria-label={t('stop')}><Square size={15} aria-hidden /></button>
        ) : (
          <button type="submit" className="chat-send" disabled={!input.trim()} aria-label={t('send')}><ArrowUp size={18} aria-hidden /></button>
        )}
      </form>
    </section>
  );
}
