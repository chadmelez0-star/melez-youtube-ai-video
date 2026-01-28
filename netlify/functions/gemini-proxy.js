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
    // Gelen veriyi parse et
    const body = JSON.parse(event.body || '{}');
    const { apiKey, prompt, model = 'gemini-pro' } = body;
    
    console.log('Gelen veri:', { apiKey: apiKey ? 'VAR' : 'YOK', prompt: prompt ? 'VAR' : 'YOK' });
    
    if (!apiKey || !prompt) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'API key and prompt required' }) 
      };
    }

    // Doğru URL - v1 ve gemini-pro
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    
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
    console.log('Gemini yanıtı:', JSON.stringify(data).slice(0, 200));
    
    if (!response.ok) {
      return { 
        statusCode: response.status, 
        headers, 
        body: JSON.stringify({ error: data.error?.message || 'Gemini API error' }) 
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };
    
  } catch (error) {
    console.log('Hata:', error.message);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
