import { cn } from '@/lib/utils';

/** Country flag from public/flags (works on every OS, unlike flag emoji). Decorative by default. */
export function Flag({ code, className, label }: { code: string; className?: string; label?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG, no optimisation needed
    <img
      src={`/flags/${code.toUpperCase()}.svg`}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      width={24}
      height={16}
      loading="lazy"
      decoding="async"
      className={cn('inline-block h-4 w-6 rounded-[3px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.08)]', className)}
    />
  );
}
