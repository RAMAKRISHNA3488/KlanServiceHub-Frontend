export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (env.BACKEND) {
        return env.BACKEND.fetch(request);
      }
      const backendUrl = new URL(url.pathname + url.search, 'https://klanservicehub-backend.klanservicehub.workers.dev');
      const reqHeaders = new Headers(request.headers);
      reqHeaders.set('Host', 'klanservicehub-backend.klanservicehub.workers.dev');

      const isBodyAllowed = request.method !== 'GET' && request.method !== 'HEAD';
      return fetch(backendUrl.toString(), {
        method: request.method,
        headers: reqHeaders,
        body: isBodyAllowed ? request.body : undefined,
        redirect: 'follow',
      });
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
