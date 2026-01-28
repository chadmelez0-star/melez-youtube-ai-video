exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { apiKey, endpoint, params = {} } = JSON.parse(event.body);
    
    if (!apiKey || !endpoint) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'API key and endpoint required' }) 
      };
    }

    // Build URL with params
    const queryParams = new URLSearchParams({ key: apiKey, ...params });
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${queryParams}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return { 
        statusCode: response.status, 
        headers, 
        body: JSON.stringify({ error: data.error?.message || 'YouTube API error' }) 
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };
    
  } catch (error) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};