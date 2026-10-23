import { describe, expect, it } from 'vitest';
import { bookingConfirmation, esc, leadNotification } from '@/lib/email/templates';

describe('email templates', () => {
  it('escapes HTML in user input', () => {
    expect(esc('<script>alert("x")</script> & \'y\'')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
  });

  it('never renders form input as markup', () => {
    const m = leadNotification({ source: 'enquiry', name: '<b>Ram</b>', phone: '9800000000', details: { message: '<img src=x onerror=alert(1)>' } });
    expect(m.html).not.toContain('<b>Ram</b>');
    expect(m.html).not.toContain('<img src=x');
    expect(m.html).toContain('&lt;b&gt;Ram&lt;/b&gt;');
    expect(m.text).toContain('message: <img src=x onerror=alert(1)>'); // plain-text part stays readable
  });

  it('includes the booking reference in subject and body', () => {
    const m = bookingConfirmation(
      { reference: 'SX-ABC234', name: 'Sita', phone: '98', email: 's@x.com', counsellor: 'C', modeLabel: 'Zoom', whenLabel: 'Mon 10:00', modeNote: 'n', notes: null, manageNote: 'm' },
      { title: 'Booking confirmed', intro: 'Hi', reference: 'Reference', counsellor: 'Counsellor', when: 'When', mode: 'Mode' },
    );
    expect(m.subject).toBe('Booking confirmed · SX-ABC234');
    expect(m.html).toContain('SX-ABC234');
  });
});
