exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { apiKey, prompt } = JSON.parse(event.body);
    
    if (!apiKey || !prompt) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'API key and prompt required' }) 
      };
    }

    // V1BETA + GEMINI-1.5-FLASH-LATEST (En güncel ve stabil)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
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