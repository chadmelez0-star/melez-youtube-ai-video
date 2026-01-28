exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { apiKey, prompt, model = 'gemini-pro' } = JSON.parse(event.body);
    
    if (!apiKey || !prompt) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'API key and prompt required' }) 
      };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        statusCode: response.status, 
        headers, 
        body: JSON.stringify({ error: data.error?.message || 'Gemini API error' }) 
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