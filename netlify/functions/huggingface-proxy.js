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
    const { apiKey, prompt, model = 'mistralai/Mistral-7B-Instruct-v0.2' } = JSON.parse(event.body);
    
    if (!apiKey || !prompt) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'API key and prompt required' }) 
      };
    }

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        statusCode: response.status, 
        headers, 
        body: JSON.stringify({ error: data.error || 'Hugging Face API error' }) 
      };
    }

    // Hugging Face yanıtını Gemini formatına çevir
    const formattedResponse = {
      candidates: [{
        content: {
          parts: [{ text: Array.isArray(data) ? data[0].generated_text : data.generated_text }]
        }
      }]
    };

    return { statusCode: 200, headers, body: JSON.stringify(formattedResponse) };
    
  } catch (error) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};