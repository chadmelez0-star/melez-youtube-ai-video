exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600' // 1 hour cache for images
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const { source, query, per_page = 12, page = 1 } = event.queryStringParameters || {};
    
    if (!source || !query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Eksik parametreler',
          details: 'source ve query gereklidir'
        })
      };
    }

    if (query.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Arama çok kısa',
          details: 'En az 2 karakter girin'
        })
      };
    }

    let url, apiKey, response, data;

    // Pexels
    if (source === 'pexels') {
      // Demo key - production'da environment variable kullanın
      apiKey = process.env.PEXELS_API_KEY || '563492ad6f91700001000001f8c8a0e1a6a94c9b';
      url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}&page=${page}`;
      
      response = await fetch(url, {
        headers: { 
          'Authorization': apiKey,
          'User-Agent': 'Melez-YouTube-AI/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Pexels API hatası: ${response.status}`);
      }
      
      data = await response.json();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.photos?.map(p => ({
          id: p.id,
          url: p.src.medium,
          fullUrl: p.src.large2x || p.src.large || p.src.medium,
          type: 'image',
          credit: p.photographer,
          source: 'pexels',
          width: p.width,
          height: p.height
        })) || [])
      };

    // Pixabay
    } else if (source === 'pixabay') {
      apiKey = process.env.PIXABAY_API_KEY || '13119377-fc7e1c0ddeadce8d3d1d5d3d3';
      url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${per_page}&page=${page}&safesearch=true`;
      
      response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Pixabay API hatası: ${response.status}`);
      }
      
      data = await response.json();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data.hits?.map(h => ({
          id: h.id,
          url: h.webformatURL,
          fullUrl: h.largeImageURL || h.webformatURL,
          type: 'image',
          credit: h.user,
          source: 'pixabay',
          width: h.webformatWidth,
          height: h.webformatHeight
        })) || [])
      };

    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Geçersiz kaynak',
          allowed: ['pexels', 'pixabay']
        })
      };
    }

  } catch (error) {
    console.error('Media Proxy Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Medya arama hatası',
        details: error.message
      })
    };
  }
};