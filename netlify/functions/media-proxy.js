exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { source, query, per_page = 12 } = event.queryStringParameters;
    
    if (!source || !query) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Source and query required' }) 
      };
    }

    let url, apiKey;

    if (source === 'pexels') {
      // Pexels demo key - production'da kullanıcı kendi key'ini girebilir
      apiKey = '563492ad6f91700001000001f8c8a0e1a6a94c9b';
      url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': apiKey }
      });
      const data = await response.json();
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify(data.photos?.map(p => ({
          id: p.id,
          url: p.src.medium,
          fullUrl: p.src.large2x || p.src.large,
          type: 'image',
          credit: p.photographer,
          source: 'pexels'
        })) || [])
      };

    } else if (source === 'pixabay') {
      apiKey = '13119377-fc7e1c0ddeadce8d3d1d5d3d3';
      url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${per_page}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify(data.hits?.map(h => ({
          id: h.id,
          url: h.webformatURL,
          fullUrl: h.largeImageURL,
          type: 'image',
          credit: h.user,
          source: 'pixabay'
        })) || [])
      };

    } else if (source === 'unsplash') {
      // Unsplash için kullanıcı kendi key'ini girmeli
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Unsplash requires user API key' }) 
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown source' }) };
    
  } catch (error) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};