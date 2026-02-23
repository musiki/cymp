import type { APIRoute } from 'astro';

const timeoutMs = Number(import.meta.env.CORRECTION_API_TIMEOUT_MS || 65000);

export const POST: APIRoute = async ({ request, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const correctionApiUrl = import.meta.env.CORRECTION_API_URL;
  const correctionApiToken = import.meta.env.CORRECTION_API_TOKEN;

  if (!correctionApiUrl || !correctionApiToken) {
    return json(
      {
        error: 'Correction API is not configured',
        missing: {
          CORRECTION_API_URL: !correctionApiUrl,
          CORRECTION_API_TOKEN: !correctionApiToken,
        },
      },
      500,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload' }, 400);
  }

  const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
  const rubrica = typeof body.rubrica === 'string' ? body.rubrica.trim() : undefined;
  const model = typeof body.model === 'string' ? body.model.trim() : undefined;

  if (!texto) {
    return json({ error: 'texto is required' }, 400);
  }

  if (texto.length > 12000) {
    return json({ error: 'texto too long (max 12000 chars)' }, 413);
  }

  try {
    const response = await fetch(`${correctionApiUrl}/api/correct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${correctionApiToken}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({ texto, rubrica, model }),
    });

    const responseText = await response.text();
    let parsed: unknown = responseText;

    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Keep raw text fallback.
    }

    if (!response.ok) {
      return json({
        error: 'Correction backend failed',
        upstreamStatus: response.status,
        upstreamBody: parsed,
      }, 502);
    }

    return json(parsed, 200);
  } catch (error: any) {
    return json(
      {
        error: 'Failed to reach correction backend',
        detail: error?.message || 'Unknown error',
      },
      502,
    );
  }
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
