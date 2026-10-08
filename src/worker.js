export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const backendUrl = new URL(url.pathname + url.search, 'https://klanservicehub-backend.klanservicehub.workers.dev');
      return fetch(new Request(backendUrl, request));
    }

    const response = await env.ASSETS.fetch(request);

    // Cache hashed static assets permanently (CSS, JS, fonts, images)
    if (url.pathname.startsWith('/assets/')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // HTML entrypoint: ensure users always get the freshest deployment
    if (response.headers.get('content-type')?.includes('text/html')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-cache, must-revalidate');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
