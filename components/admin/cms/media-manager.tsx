'use client';
import { useRef, useState } from 'react';
import { Check, Copy, ImagePlus, Loader2 } from 'lucide-react';
import type { MediaItem } from '@/lib/cms/media';

/** Upload images and copy their URLs (editors also pick them via "Library"). */
export function MediaManager({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    setBusy(true);
    setError(null);
    for (const f of Array.from(files)) {
      const data = new FormData();
      data.set('file', f);
      const res = await fetch('/api/admin/media', { method: 'POST', body: data }).catch(() => null);
      const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res?.ok && body?.url) setItems((list) => [{ url: body.url!, name: f.name, size: f.size, created: new Date().toISOString() }, ...list]);
      else setError(`${f.name}: ${body?.error ?? 'upload failed'}`);
    }
    setBusy(false);
    if (input.current) input.current.value = '';
  }

  return (
    <div className="grid gap-5">
      <label
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
        }}
      >
        {busy ? <Loader2 size={28} className="animate-spin" aria-hidden /> : <ImagePlus size={28} aria-hidden />}
        <strong>Drop images here or click to upload</strong>
        <small>JPG, PNG, WebP or AVIF · up to 5 MB each</small>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => e.target.files?.length && upload(e.target.files)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="media-grid">
        {items.length === 0 && <p className="muted">No images uploaded yet.</p>}
        {items.map((m) => (
          <figure key={m.url}>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            <img src={m.url} alt={m.name} loading="lazy" />
            <figcaption>
              <span title={m.name}>{m.name}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Copy URL of ${m.name}`}
                onClick={() => {
                  void navigator.clipboard?.writeText(m.url);
                  setCopied(m.url);
                }}
              >
                {copied === m.url ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
