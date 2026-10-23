import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, ArrowUp, MessageCircle, CheckCircle2 } from 'lucide-react';
import { brand, footer, searchOptions } from '../data';
import { Logo } from './Header';
import { Modal } from './ui';

const social = {
  Facebook: 'M14 8h3V4h-3c-2.8 0-4 1.8-4 4.2V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z',
  Instagram: 'M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21 8c0-1.7-.5-3.2-1.6-4.4S16.7 2 15 2H9C7.3 2 5.8 2.5 4.6 3.6S3 6.3 3 8v8c0 1.7.5 3.2 1.6 4.4S7.3 22 9 22h6c1.7 0 3.2-.5 4.4-1.6S21 17.7 21 16V8Zm-2 8c0 1.1-.3 2.1-1 2.9-.8.8-1.8 1.1-2.9 1.1H9c-1.1 0-2.1-.3-2.9-1.1C5.3 18.1 5 17.1 5 16V8c0-1.1.3-2.1 1.1-2.9C6.9 4.3 7.9 4 9 4h6c1.1 0 2.1.3 2.9 1.1.8.8 1.1 1.8 1.1 2.9v8Z',
  LinkedIn: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05C21.1 9.3 22 11.6 22 14.6V21h-4v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21h-4V9.75Z',
  YouTube: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8ZM9.7 15.1V8.9L15.5 12l-5.8 3.1Z',
  TikTok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5Z',
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>
            St. Xavier Educational Network, your premier study abroad partner, is a leading educational consultancy
            in Nepal, guiding students through the study abroad process.
          </p>
          <div className="socials">
            {Object.entries(social).map(([name, d]) => (
              <a key={name} href="#" aria-label={name}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d={d} /></svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>{footer.quickLinks.map((l) => <li key={l}><a href="#">{l}</a></li>)}</ul>
          <h4 className="mt">Support</h4>
          <ul>{footer.support.map((l) => <li key={l}><a href="#">{l}</a></li>)}</ul>
        </div>

        <div>
          <h4>Authorized Centers</h4>
          <ul className="centers">
            {footer.centers.map((c) => (
              <li key={c.city}>
                <span>{c.city}</span>
                <a href={`tel:${c.phone}`}>{c.phone}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Head Office</h4>
          <ul className="contact">
            <li><MapPin size={16} /> {brand.address}</li>
            <li><Phone size={16} /> <a href={`tel:${brand.phone.replace(/\s/g, '')}`}>{brand.phone}</a></li>
            <li><Mail size={16} /> <a href={`mailto:${brand.email}`}>{brand.email}</a></li>
          </ul>
          <h4 className="mt">Ranked Universities</h4>
          <select className="footer-select" defaultValue="">
            <option value="" disabled>Select a country</option>
            {searchOptions.destinations.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {brand.full}. All rights reserved.</span>
        <span>
          <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Sitemap</a>
        </span>
      </div>
    </footer>
  );
}

export function FloatingActions() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="floating">
      <a href="#" className="fab fab-chat" aria-label="Chat with a counsellor">
        <MessageCircle size={22} />
      </a>
      <button
        className={`fab fab-top ${show ? 'is-shown' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}

export function CounsellingModal({ open, onClose }) {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (open) setSent(false);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} label="Book free counselling">
      {sent ? (
        <div className="form-success">
          <CheckCircle2 size={56} />
          <h3>Thank you!</h3>
          <p>Your request has been received. A St. Xavier counsellor will call you within one working day.</p>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      ) : (
        <form
          className="lead-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <span className="eyebrow">Free Counselling</span>
          <h3>Start your study abroad journey</h3>
          <p className="muted">Tell us a little about yourself and we’ll match you with the right counsellor.</p>
          <div className="form-row">
            <label>Full name<input required placeholder="Your name" autoComplete="name" /></label>
            <label>Phone<input required type="tel" placeholder="98XXXXXXXX" autoComplete="tel" /></label>
          </div>
          <label>Email<input required type="email" placeholder="you@example.com" autoComplete="email" /></label>
          <div className="form-row">
            <label>
              Destination
              <select required defaultValue="">
                <option value="" disabled>Choose…</option>
                {searchOptions.destinations.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
            <label>
              Intake
              <select required defaultValue="">
                <option value="" disabled>Choose…</option>
                {searchOptions.intakes.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg">Book My Free Session</button>
        </form>
      )}
    </Modal>
  );
}
