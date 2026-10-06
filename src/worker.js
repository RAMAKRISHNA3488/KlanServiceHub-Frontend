export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const backendUrl = new URL(url.pathname + url.search, 'https://klanservicehub-backend.klanservicehub.workers.dev');
      return fetch(new Request(backendUrl, request));
    }
    return env.ASSETS.fetch(request);
  },
};
