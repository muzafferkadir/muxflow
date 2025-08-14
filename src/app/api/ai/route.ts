export const runtime = 'nodejs';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  const model = process.env.NEXT_PUBLIC_DEFAULT_MODEL || process.env.DEFAULT_MODEL || 'google/gemini-2.5-flash';
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { messages } = (body as { messages?: ChatMessage[] }) || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mkdir.dev',
        'X-Title': 'AppletFlow',
      },
      body: JSON.stringify({
        model: model,
        messages,
        temperature: 0.6,
        max_tokens: 20000,
        stream: false,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: data.error?.message || `HTTP ${res.status}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}


