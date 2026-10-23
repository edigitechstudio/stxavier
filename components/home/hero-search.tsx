'use client';
import { useState } from 'react';
import { BookOpen, Calendar, MapPin, Search } from 'lucide-react';
import { useCounselling } from '@/components/sx/counselling';

type Labels = { destination: string; field: string; intake: string; any: string; search: string };
type Options = { destinations: string[]; fields: string[]; intakes: string[] };

function Field({ icon: I, label, any, options, value, onChange }: {
  icon: typeof MapPin; label: string; any: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="search-field">
      <I size={18} className="search-icon" aria-hidden />
      <span className="search-text">
        <small>{label}</small>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{any}</option>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </span>
    </label>
  );
}

/** Hero search: captures the student's interest and opens the counselling form pre-filled. */
export function HeroSearch({ labels, options }: { labels: Labels; options: Options }) {
  const { open } = useCounselling();
  const [q, setQ] = useState({ destination: '', field: '', intake: '' });
  const set = (k: keyof typeof q) => (v: string) => setQ((s) => ({ ...s, [k]: v }));

  return (
    <form
      className="search-bar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        open(q);
      }}
    >
      <Field icon={MapPin} label={labels.destination} any={labels.any} options={options.destinations} value={q.destination} onChange={set('destination')} />
      <Field icon={BookOpen} label={labels.field} any={labels.any} options={options.fields} value={q.field} onChange={set('field')} />
      <Field icon={Calendar} label={labels.intake} any={labels.any} options={options.intakes} value={q.intake} onChange={set('intake')} />
      <button type="submit" className="btn btn-accent search-btn">
        <Search size={18} aria-hidden /> {labels.search}
      </button>
    </form>
  );
}
