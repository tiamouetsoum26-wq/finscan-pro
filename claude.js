exports.handler = async function(event, context) {

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: { message: 'Method Not Allowed' } }) };
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY27;

  if (!API_KEY) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: { message: 'ERREUR: Variable ANTHROPIC_API_KEY27 absente de Netlify' } })
    };
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch(e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: { message: 'ERREUR parsing body: ' + e.message } })
    };
  }

  // Vérifier la taille du body (Netlify limite à 6MB)
  const bodySize = Buffer.byteLength(event.body, 'utf8');
  if (bodySize > 5 * 1024 * 1024) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: { message: 'ERREUR: Fichier trop volumineux (' + Math.round(bodySize/1024/1024) + 'MB). Maximum 5MB.' } })
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(parsedBody)
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: { message: 'ERREUR Anthropic non-JSON (status ' + response.status + '): ' + rawText.slice(0, 300) } })
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: { message: 'ERREUR fetch: ' + err.message + ' | ' + err.stack } })
    };
  }
};
