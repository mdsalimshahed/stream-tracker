// src/worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Intercept API calls and proxy them to Steam
    if (url.pathname.startsWith('/steam-api/')) {
      const targetUrl = new URL(url.pathname.replace('/steam-api/', '/'), 'https://store.steampowered.com');
      targetUrl.search = url.search;
      
      try {
        const response = await fetch(targetUrl.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        return newResponse;
      } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to fetch from Steam API" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    // For all other requests, serve your React app normally
    return env.ASSETS.fetch(request);
  }
};