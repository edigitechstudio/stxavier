import type { Localized } from './content';

export type ChatRole = 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

/** One retrievable piece of the consultancy's own content. */
export type KnowledgeChunk = {
  id: string;
  /** Site path the answer can link to, e.g. "/study-in/uk" (locale is added by the client). */
  path: string;
  title: Localized;
  text: Localized;
  /** Extra search terms (country names, synonyms) that don't need to appear in the answer. */
  keywords?: string;
};

export type ChatSource = { id: string; title: string; path: string };

/** Streamed to the browser as newline-delimited JSON. */
export type ChatEvent =
  | { type: 'meta'; mode: 'ai' | 'basic'; sources: ChatSource[]; session: string }
  | { type: 'text'; delta: string }
  | { type: 'done' }
  | { type: 'error'; code: 'rate_limited' | 'bot_check' | 'unavailable' | 'invalid' | 'failed' };

/** Assistant settings the consultancy edits (page_content row "chat"). */
export type ChatContent = {
  enabled: boolean;
  assistant_name: Localized;
  greeting: Localized;
  disclaimer: Localized;
  suggestions: Localized[];
  /** Extra guidance appended to the assistant's instructions, e.g. current promotions or policies. */
  extra_instructions: string;
};
