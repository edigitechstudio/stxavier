import type { SocialPlatform } from '@/types/content';

const paths: Record<SocialPlatform, string> = {
  facebook: 'M14 8h3V4h-3c-2.8 0-4 1.8-4 4.2V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6Z',
  instagram: 'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM15 2H9C5.1 2 3 4.1 3 8v8c0 3.9 2.1 6 6 6h6c3.9 0 6-2.1 6-6V8c0-3.9-2.1-6-6-6Zm4 14c0 2.8-1.2 4-4 4H9c-2.8 0-4-1.2-4-4V8c0-2.8 1.2-4 4-4h6c2.8 0 4 1.2 4 4v8Z',
  tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5Z',
  youtube: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z',
  linkedin: 'M5 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.8h4V21H3V9.8Zm6.5 0h3.8v1.5h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21h-4V9.8Z',
};

const names: Record<SocialPlatform, string> = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn',
};

export function SocialLinks({ links }: { links: { platform: SocialPlatform; url: string }[] }) {
  return (
    <div className="socials">
      {links.map((s) => (
        <a key={s.platform} href={s.url} target="_blank" rel="noopener me" aria-label={names[s.platform]}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
            <path d={paths[s.platform]} />
          </svg>
        </a>
      ))}
    </div>
  );
}
