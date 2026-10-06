import { hc } from 'hono/client';

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost') ||
    window.location.hostname.endsWith('.local'));

const defaultBackendUrl = isLocal ? 'http://localhost:5000' : 'https://klanservicehub-backend.klanservicehub.workers.dev';

export const baseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_APP_BASE_URL)) ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_APP_BASE_URL) ||
  defaultBackendUrl;

export const client = hc(baseUrl, {
  fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
});
