// worker.js - Cloudflare Workers (100k istek/gün ücretsiz)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Proxy Gemini API (hide API key)
    if (url.pathname === '/api/ai') {
      const { prompt, apiKey } = await request.json();
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
          })
        }
      );
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // Proxy Pexels (hide API key)
    if (url.pathname === '/api/stock') {
      const { query } = await request.json();
      
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${query}&per_page=10`,
        { headers: { 'Authorization': env.PEXELS_API_KEY } }
      );
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // Store video metadata
    if (url.pathname === '/api/save') {
      const { id, data } = await request.json();
      await env.VIDEO_KV.put(id, JSON.stringify(data));
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // Retrieve video
    if (url.pathname === '/api/load') {
      const id = url.searchParams.get('id');
      const data = await env.VIDEO_KV.get(id);
      return new Response(data || '{}', { headers });
    }

    return new Response('Not found', { status: 404 });
  }
};