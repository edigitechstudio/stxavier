'use client';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquareText, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type ChatWidgetProps = {
  assistantName: string;
  greeting: string;
  disclaimer: string;
  suggestions: string[];
  whatsappHref: string;
  phone: string;
};

// The panel (and its streaming client) only loads when someone opens the chat.
const ChatPanel = lazy(() => import('./chat-panel'));

/** Floating "Ask our AI assistant" button + lazily loaded chat panel. */
export function ChatLauncher(props: ChatWidgetProps) {
  const t = useTranslations('chat');
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Other parts of the site can open the assistant: window.dispatchEvent(new Event('sx:open-chat')).
  useEffect(() => {
    const show = () => {
      setLoaded(true);
      setOpen(true);
    };
    window.addEventListener('sx:open-chat', show);
    return () => window.removeEventListener('sx:open-chat', show);
  }, []);

  const toggle = () => {
    setLoaded(true);
    setOpen((o) => !o);
  };
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className={`fab fab-ai ${open ? 'is-open' : ''}`}
        onClick={toggle}
        onPointerEnter={() => setLoaded(true)}
        aria-label={open ? t('close') : t('open')}
        aria-expanded={open}
        aria-controls="sx-chat"
        title={t('open')}
      >
        {open ? <X size={22} aria-hidden /> : <MessageSquareText size={22} aria-hidden />}
        {!open && <span className="fab-ai-badge" aria-hidden>{t('aiBadge')}</span>}
      </button>
      {/* Portalled to <body> so it stacks above the header and cookie banner (the floating
          button stack is its own stacking context). `loaded` only becomes true in the browser. */}
      {loaded &&
        createPortal(
          <Suspense fallback={null}>
            <ChatPanel {...props} open={open} onClose={close} />
          </Suspense>,
          document.body,
        )}
    </>
  );
}
