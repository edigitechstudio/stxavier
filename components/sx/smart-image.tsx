'use client';
import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

/** next/image that degrades to the branded gradient if a remote image fails to load. */
export function SmartImage({ alt, className, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed || !props.src) return <div className={`img-fallback ${className ?? ''}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} />;
  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
