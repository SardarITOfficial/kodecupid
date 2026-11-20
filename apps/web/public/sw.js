/*
 * KodeCupid service worker — Milestone 1.
 *
 * Deliberately network-only: the worker exists so the app is installable, but it
 * never caches responses. Caching is added together with the offline/notification
 * work so a deploy can never serve stale chunks.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // No respondWith(): the browser performs the request normally.
});
