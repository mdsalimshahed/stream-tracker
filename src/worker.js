// src/worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Intercept API calls and proxy them to Steam
    if (url.pathname.startsWith('/steam-api/')) {
      const targetUrl = new URL(url.pathname.replace('/steam-api/', '/'), 'https://store.steampowered.com');
      targetUrl.search = url.search;
      
      const response = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent': 'StreamTracker/1.0',
          'Accept': 'application/json'
        }
      });
      
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;
    }
    
    // For all other requests, serve your React app normally
    return env.ASSETS.fetch(request);
  }
};