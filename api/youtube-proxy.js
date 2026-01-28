export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { apiKey, endpoint, params = {} } = req.method === 'POST' ? req.body : req.query;
    
    if (!apiKey || !endpoint) {
      return res.status(400).json({ error: 'API key and endpoint required' });
    }

    const queryParams = new URLSearchParams({ key: apiKey, part: 'snippet', ...params });
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${queryParams}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message });
    }

    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}