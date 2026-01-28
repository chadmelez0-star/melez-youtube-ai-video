exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { apiKey, prompt, temperature = 0.7, maxTokens = 2048 } = body;
    
    // Validation
    if (!apiKey || !prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Eksik parametreler',
          details: 'apiKey ve prompt gereklidir'
        })
      };
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('AIza')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Geçersiz API Key formatı',
          details: 'Gemini API Key AIzaSy... ile başlamalıdır'
        })
      };
    }

    // Gemini API v1beta endpoint - gemini-1.5-flash-latest
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout (Netlify limit 26s)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-client': 'melez-youtube-ai/1.0'
      },
      body: JSON.stringify({
        contents: [{ 
          role: 'user',
          parts: [{ text: prompt }] 
        }],
        generationConfig: {
          temperature: parseFloat(temperature),
          maxOutputTokens: parseInt(maxTokens),
          topP: 0.9,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await response.json();

    // Handle Gemini API errors
    if (!response.ok) {
      console.error('Gemini API Error:', data);
      
      let errorMessage = 'Gemini API hatası';
      let statusCode = response.status;
      
      if (data.error) {
        errorMessage = data.error.message || data.error.status;
        
        // Specific error handling
        if (data.error.status === 'INVALID_ARGUMENT') {
          errorMessage = 'Geçersiz istek: ' + errorMessage;
          statusCode = 400;
        } else if (data.error.status === 'UNAUTHENTICATED' || data.error.status === 'PERMISSION_DENIED') {
          errorMessage = 'API Key geçersiz veya yetkisiz. Lütfen AI Studio\'dan yeni key alın.';
          statusCode = 401;
        } else if (data.error.status === 'RESOURCE_EXHAUSTED') {
          errorMessage = 'API kotası aşıldı. Lütfen daha sonra tekrar deneyin.';
          statusCode = 429;
        }
      }

      return {
        statusCode,
        headers,
        body: JSON.stringify({ 
          error: errorMessage,
          code: data.error?.status || 'UNKNOWN',
          details: data.error?.details || null
        })
      };
    }

    // Check if response was blocked by safety settings
    if (data.promptFeedback?.blockReason) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'İçerik güvenlik filtresi tarafından engellendi',
          reason: data.promptFeedback.blockReason,
          safetyRatings: data.promptFeedback.safetyRatings
        })
      };
    }

    // Validate response structure
    if (!data.candidates || data.candidates.length === 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Boş yanıt',
          details: 'Gemini boş yanıt döndürdü'
        })
      };
    }

    // Success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function Error:', error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = 'İstek zaman aşımına uğradı (25s). Lütfen daha kısa bir prompt deneyin.';
      statusCode = 504;
    } else if (error instanceof SyntaxError) {
      errorMessage = 'Geçersiz JSON formatı';
      statusCode = 400;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        type: error.name || 'Error'
      })
    };
  }
};