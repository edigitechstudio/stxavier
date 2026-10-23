import 'server-only';

type Message = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string | null };

/**
 * Sends email through the Resend REST API. Without RESEND_API_KEY (local development) the message
 * is logged instead, so every flow can be exercised without sending real email.
 * Never throws: a failed email must not fail the lead or booking that triggered it.
 */
export async function sendEmail(msg: Message): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'St. Xavier Educational Network <noreply@stxavier.com.np>';
  if (!key) {
    console.info('[email] (not sent — RESEND_API_KEY unset)', { to: msg.to, subject: msg.subject });
    return { sent: false };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text, ...(msg.replyTo ? { reply_to: msg.replyTo } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error('[email] Resend error', res.status, await res.text().catch(() => ''));
    return { sent: res.ok };
  } catch (e) {
    console.error('[email] send failed', e);
    return { sent: false };
  }
}

/** Internal recipients for lead and booking alerts. */
export function staffRecipients(): string[] {
  return (process.env.LEADS_NOTIFY_EMAIL || 'info@stxavier.com.np').split(',').map((s) => s.trim()).filter(Boolean);
}
