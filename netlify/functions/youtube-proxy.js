exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // 5 minute cache
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    let apiKey, endpoint, params = {};

    // Support both GET and POST
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      apiKey = body.apiKey;
      endpoint = body.endpoint;
      params = body.params || {};
    } else if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      apiKey = queryParams.apiKey;
      endpoint = queryParams.endpoint;
      // Parse params from query string if provided as JSON
      if (queryParams.params) {
        try {
          params = JSON.parse(queryParams.params);
        } catch (e) {
          params = {};
        }
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    if (!apiKey || !endpoint) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Eksik parametreler',
          details: 'apiKey ve endpoint gereklidir'
        })
      };
    }

    // Validate endpoint (whitelist)
    const allowedEndpoints = ['videos', 'search', 'channels', 'playlistItems', 'commentThreads'];
    if (!allowedEndpoints.includes(endpoint)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Geçersiz endpoint',
          allowed: allowedEndpoints
        })
      };
    }

    // Build URL
    const queryParams = new URLSearchParams({ 
      key: apiKey, 
      part: 'snippet',
      ...params 
    });
    
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://melez.netlify.app' // Some APIs check this
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API Error:', data);
      
      let errorMessage = 'YouTube API hatası';
      let statusCode = response.status;
      
      if (data.error) {
        errorMessage = data.error.message || data.error.errors?.[0]?.message;
        
        if (response.status === 403) {
          errorMessage = 'API Key geçersiz veya kotası dolmuş: ' + errorMessage;
        } else if (response.status === 404) {
          errorMessage = 'Kaynak bulunamadı: ' + errorMessage;
        }
      }

      return {
        statusCode,
        headers,
        body: JSON.stringify({ 
          error: errorMessage,
          code: data.error?.code || response.status
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        type: error.name
      })
    };
  }
};