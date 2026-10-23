import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'St. Xavier Educational Network',
    short_name: 'St. Xavier',
    description: 'Study abroad consultancy in Kathmandu, Nepal',
    start_url: '/en',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b1f4b',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
