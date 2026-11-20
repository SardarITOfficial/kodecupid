import type { MetadataRoute } from 'next';

/**
 * PWA manifest. The service worker is intentionally network-only in Milestone 1
 * (no offline cache) so a deploy can never serve stale app chunks; offline
 * support is scheduled with the notification work.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KodeCupid — dating for shift workers',
    short_name: 'KodeCupid',
    description:
      'Verified healthcare, education, EMS, law enforcement, firefighter, military, engineering and technician professionals who understand shift work.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F8FA',
    theme_color: '#D91E36',
    categories: ['social', 'lifestyle'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
