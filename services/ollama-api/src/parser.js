const ensureText = (value) => {
  if (typeof value === 'string') return value.trim();
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const ensureBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'si', 'sí', 'yes', 'clara', 'claro'].includes(normalized)) return true;
    if (['false', 'no', 'unclear', 'difusa'].includes(normalized)) return false;
  }
  return false;
};

const ensurePair = (value) => {
  if (Array.isArray(value)) {
    return value.map(ensureText).filter(Boolean).slice(0, 2);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|;|\u2022|\-/g)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 2);
  }

  return [];
};

function extractFirstJsonObject(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const fencedJsonMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJsonMatch?.[1]) {
    try {
      return JSON.parse(fencedJsonMatch[1]);
    } catch {
      // Continue with fallback below.
    }
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null;
  }

  const candidate = raw.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function parseSections(raw) {
  const lines = raw.split('\n').map((line) => line.trim());
  const readAfter = (prefix) => {
    const idx = lines.findIndex((line) => line.toLowerCase().startsWith(prefix));
    if (idx === -1) return '';
    return lines[idx].slice(prefix.length).trim() || lines[idx + 1] || '';
  };

  return {
    resumen: readAfter('resumen:'),
    tesis: {
      clara: ensureBool(readAfter('tesis clara:')),
      explicacion: readAfter('tesis clara:')
    },
    fortalezas: ensurePair(readAfter('fortalezas:')),
    debilidades: ensurePair(readAfter('debilidades:')),
    sugerencia: readAfter('sugerencia:')
  };
}

export function normalizeModelResponse(rawResponse) {
  const parsed = extractFirstJsonObject(rawResponse) || parseSections(rawResponse || '');

  const tesisObj = typeof parsed.tesis === 'object' && parsed.tesis !== null ? parsed.tesis : {};

  const fortalezas = ensurePair(parsed.fortalezas);
  const debilidades = ensurePair(parsed.debilidades);

  return {
    resumen: ensureText(parsed.resumen),
    tesis: {
      clara: ensureBool(tesisObj.clara ?? parsed.tesis_clara),
      explicacion: ensureText(tesisObj.explicacion ?? parsed.tesis_explicacion)
    },
    fortalezas: fortalezas.length === 2 ? fortalezas : [...fortalezas, ''].slice(0, 2),
    debilidades: debilidades.length === 2 ? debilidades : [...debilidades, ''].slice(0, 2),
    sugerencia: ensureText(parsed.sugerencia),
    raw: ensureText(rawResponse)
  };
}
