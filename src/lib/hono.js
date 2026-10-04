import { hc } from 'hono/client';

const baseUrl = (typeof window !== 'undefined' && window.location.origin ? window.location.origin : '') ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_BASE_URL) ||
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_APP_BASE_URL) ||
    'http://localhost:3000';

export const client = hc(baseUrl, {
    fetch: (input, init) => fetch(input, { ...init, credentials: 'include' })
});
