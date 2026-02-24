import yaml from 'js-yaml';

const ALLOWED_MODES = new Set(['self', 'graded', 'peer']);
const DEFAULT_MCC_BUTTON = 'Marcar como completado';
const DEFAULT_MCC_SUCCESS = 'Sección completada';

const asText = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim();
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const asPositiveNumber = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const asBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'sí', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(/\n|;/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const cleanId = (rawId, fallbackId) => {
  const candidate = asText(rawId, fallbackId)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return candidate || fallbackId;
};

const normalizeLooseEvalYaml = (rawBlock = '') =>
  String(rawBlock)
    .split(/\r?\n/g)
    .map((line) => {
      // Accept top-level `key = value` syntax for authoring convenience.
      const assignment = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=\s*(.+)$/);
      if (!assignment) return line;
      return `${assignment[1]}: ${assignment[2]}`;
    })
    .join('\n');

const loadEvalYaml = (blockValue) => {
  try {
    return yaml.load(blockValue);
  } catch (baseError) {
    const normalized = normalizeLooseEvalYaml(blockValue);
    if (normalized === blockValue) throw baseError;
    return yaml.load(normalized);
  }
};

const parseMcqOption = (option, index) => {
  if (typeof option === 'object' && option !== null) {
    const text = asText(option.text || option.label);
    if (!text) return null;
    return {
      id: `opt-${index + 1}`,
      text,
      isCorrect: Boolean(option.isCorrect),
    };
  }

  const raw = asText(option);
  if (!raw) return null;

  const unquoted = raw.replace(/^['"]|['"]$/g, '');
  const markerMatch = unquoted.match(/^\[(x|X|\s)\]\s*(.*)$/);

  if (!markerMatch) {
    return {
      id: `opt-${index + 1}`,
      text: unquoted,
      isCorrect: false,
    };
  }

  return {
    id: `opt-${index + 1}`,
    text: markerMatch[2].trim(),
    isCorrect: markerMatch[1].toLowerCase() === 'x',
  };
};

const normalizeMcq = (raw, common, config = {}) => {
  const { forceMultiple = false } = config;
  const options = toList(raw.options)
    .map((option, index) => parseMcqOption(option, index))
    .filter((option) => option && option.text);

  if (options.length < 2) {
    throw new Error(`MCQ ${common.id} requires at least 2 options`);
  }

  if (!options.some((option) => option.isCorrect)) {
    options[0].isCorrect = true;
  }

  const correctCount = options.filter((option) => option.isCorrect).length;
  const allowMultiple = forceMultiple
    || correctCount > 1;

  return {
    ...common,
    type: 'mcq',
    prompt: asText(raw.prompt),
    explanation: asText(raw.explanation),
    hint: asText(raw.hint),
    allowMultiple,
    selectionMode: allowMultiple ? 'multiple' : 'single',
    options,
  };
};

const normalizeMcc = (raw, common) => {
  const objectives = toList(raw.objectives || raw.objetivos || raw.goals)
    .map((objective) => asText(objective))
    .filter(Boolean);

  return {
    ...common,
    type: 'mcc',
    prompt: asText(raw.prompt || raw.title || 'Marca esta sección como completada.'),
    summary: asText(raw.summary || raw.description),
    objectives,
    buttonLabel: asText(raw.buttonLabel || raw.button || raw.cta, DEFAULT_MCC_BUTTON),
    successLabel: asText(raw.successLabel || raw.success, DEFAULT_MCC_SUCCESS),
  };
};

export function parseEvalBlock(blockValue, options = {}) {
  const { fallbackId = 'eval-item' } = options;

  const parsed = loadEvalYaml(blockValue);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Eval block must be a YAML object');
  }

  const type = asText(parsed.type, 'mcq').toLowerCase();
  const modeCandidate = asText(parsed.mode, 'self').toLowerCase();

  const common = {
    id: cleanId(parsed.id, fallbackId),
    mode: ALLOWED_MODES.has(modeCandidate) ? modeCandidate : 'self',
    points: asPositiveNumber(parsed.points, 1),
    title: asText(parsed.title),
    allowEdit: asBoolean(parsed.allowEdit ?? parsed.allowedit ?? parsed.allow_edit ?? parsed.editable, false),
  };

  if (type === 'mcq') return normalizeMcq(parsed, common);
  if (type === 'msq') return normalizeMcq(parsed, common, { forceMultiple: true });
  if (type === 'mcc') return normalizeMcc(parsed, common);

  return {
    ...common,
    type,
    prompt: asText(parsed.prompt || parsed.title || ''),
    unsupported: true,
    raw: parsed,
  };
}
