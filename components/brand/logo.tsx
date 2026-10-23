import Image from 'next/image';
import { Link } from '@/i18n/navigation';

/** Real St. Xavier globe mark + the legacy theme's serif wordmark. */
export function Logo({ name, light = false }: { name: string; light?: boolean }) {
  // First two words large, the rest as the small line: "St. Xavier" / "Educational Network".
  const words = name.trim().split(/\s+/);
  const main = words.slice(0, 2).join(' ');
  const rest = words.slice(2).join(' ');
  return (
    <Link href="/" className={`logo ${light ? 'is-light' : ''}`}>
      <span className="logo-mark-wrap">
        <Image src="/brand/logo-mark.webp" alt="" width={75} height={40} priority className="logo-mark" />
      </span>
      <span className="logo-text">
        <strong>{main}</strong> {rest && <small>{rest}</small>}
      </span>
    </Link>
  );
}
