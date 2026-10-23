/**
 * Plain, robust HTML emails (tables + inline styles render reliably across email clients).
 * Every interpolated value is escaped — form input must never become markup.
 */

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type Email = { subject: string; html: string; text: string };

function layout(title: string, bodyHtml: string, footer: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f8fd;font-family:Arial,Helvetica,sans-serif;color:#0d1530">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fd;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6eaf3">
<tr><td style="background:#0b1f4b;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold">St. Xavier <span style="color:#ff4d55;font-size:12px;letter-spacing:2px">EDUCATIONAL NETWORK</span></td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px;color:#0d1530">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#f6f8fd;font-size:12px;color:#7a839b">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function rows(pairs: [string, unknown][]): { html: string; text: string } {
  const filled = pairs.filter(([, v]) => v !== undefined && v !== null && v !== '');
  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px">${filled
      .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#7a839b;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#0d1530">${esc(Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`)
      .join('')}</table>`,
    text: filled.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n'),
  };
}

const FOOTER = 'St. Xavier Educational Network Pvt. Ltd. · Kathmandu, Nepal · +977-1-5333081 · info@stxavier.com.np';

/** Internal alert for every new lead. */
export function leadNotification(lead: { source: string; name: string; phone: string; email?: string | null; page?: string | null; details: Record<string, unknown> }): Email {
  const r = rows([
    ['Source', lead.source],
    ['Name', lead.name],
    ['Phone', lead.phone],
    ['Email', lead.email],
    ['Page', lead.page],
    ...Object.entries(lead.details),
  ]);
  return {
    subject: `New ${lead.source} lead: ${lead.name}`,
    html: layout('New enquiry from the website', r.html, FOOTER),
    text: `New enquiry from the website\n\n${r.text}`,
  };
}

type BookingInfo = {
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  counsellor: string;
  modeLabel: string;
  whenLabel: string;
  modeNote: string;
  notes: string | null;
  manageNote: string;
};

/** Confirmation sent to the student. */
export function bookingConfirmation(b: BookingInfo, labels: { title: string; intro: string; reference: string; counsellor: string; when: string; mode: string }): Email {
  const r = rows([
    [labels.reference, b.reference],
    [labels.counsellor, b.counsellor],
    [labels.when, b.whenLabel],
    [labels.mode, b.modeLabel],
  ]);
  const body = `<p style="margin:0 0 16px;font-size:15px">${esc(labels.intro)}</p>${r.html}<p style="margin:16px 0 0;font-size:14px;color:#4a5470">${esc(b.modeNote)}</p><p style="margin:12px 0 0;font-size:13px;color:#7a839b">${esc(b.manageNote)}</p>`;
  return {
    subject: `${labels.title} · ${b.reference}`,
    html: layout(labels.title, body, FOOTER),
    text: `${labels.title}\n\n${labels.intro}\n\n${r.text}\n\n${b.modeNote}\n${b.manageNote}`,
  };
}

/** Internal alert for a new booking. */
export function bookingNotification(b: BookingInfo): Email {
  const r = rows([
    ['Reference', b.reference],
    ['Student', b.name],
    ['Phone', b.phone],
    ['Email', b.email],
    ['Counsellor', b.counsellor],
    ['When', b.whenLabel],
    ['Mode', b.modeLabel],
    ['Notes', b.notes],
  ]);
  return { subject: `New booking ${b.reference}: ${b.name} — ${b.whenLabel}`, html: layout('New counselling booking', r.html, FOOTER), text: `New counselling booking\n\n${r.text}` };
}

/** Free guide delivery (exit-intent offer). */
export function guideEmail(g: { name: string; country: string; url: string }, labels: { subject: string; intro: string; button: string }): Email {
  const body = `<p style="margin:0 0 16px;font-size:15px">${esc(labels.intro)}</p><p style="margin:0"><a href="${esc(g.url)}" style="display:inline-block;padding:12px 22px;background:#1d4ed8;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:bold">${esc(labels.button)}</a></p>`;
  return { subject: labels.subject, html: layout(labels.subject, body, FOOTER), text: `${labels.intro}\n\n${g.url}` };
}
