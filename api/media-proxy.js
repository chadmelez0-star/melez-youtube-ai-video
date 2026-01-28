export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { source, query, per_page = 12 } = req.query;
    
    if (!source || !query) {
      return res.status(400).json({ error: 'Source and query required' });
    }

    let url, apiKey;

    if (source === 'pexels') {
      apiKey = process.env.PEXELS_API_KEY || '563492ad6f91700001000001f8c8a0e1a6a94c9b';
      url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${per_page}`;
      
      const response = await fetch(url, { headers: { 'Authorization': apiKey } });
      const data = await response.json();
      
      return res.status(200).json(data.photos?.map(p => ({
        id: p.id,
        url: p.src.medium,
        fullUrl: p.src.large2x || p.src.large,
        credit: p.photographer,
        source: 'pexels'
      })) || []);

    } else if (source === 'pixabay') {
      apiKey = process.env.PIXABAY_API_KEY || '13119377-fc7e1c0ddeadce8d3d1d5d3d3';
      url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=${per_page}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return res.status(200).json(data.hits?.map(h => ({
        id: h.id,
        url: h.webformatURL,
        fullUrl: h.largeImageURL,
        credit: h.user,
        source: 'pixabay'
      })) || []);
    }

    return res.status(400).json({ error: 'Unknown source' });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}