import { getCollection } from 'astro:content';

type CourseAliasCache = {
  loadedAt: number;
  aliasToCanonical: Map<string, string>;
};

const CACHE_TTL_MS = 60_000;

let cache: CourseAliasCache | null = null;

const normalizeText = (value: unknown) => String(value || '').trim();
const normalizeKey = (value: unknown) => normalizeText(value).toLowerCase();
const toAliasSlug = (value: unknown) =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureAliasMap = async () => {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
    return cache.aliasToCanonical;
  }

  const aliasToCanonical = new Map<string, string>();
  const courses = await getCollection('cursos');

  for (const course of courses) {
    if (!course.id.endsWith('/_index') && !course.id.endsWith('_index')) continue;
    const canonicalId = normalizeText(course.id.replace(/\/_index$/, ''));
    if (!canonicalId) continue;

    const code = normalizeText((course.data as Record<string, unknown>)?.id || (course.data as Record<string, unknown>)?.code || '');
    const title = normalizeText((course.data as Record<string, unknown>)?.title || '');

    const aliases = [canonicalId, toAliasSlug(canonicalId), code, title, toAliasSlug(title)];
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      if (!normalizedAlias) continue;
      aliasToCanonical.set(normalizeKey(normalizedAlias), canonicalId);
      const slugAlias = toAliasSlug(normalizedAlias);
      if (slugAlias) aliasToCanonical.set(slugAlias, canonicalId);
    }
  }

  cache = {
    loadedAt: now,
    aliasToCanonical,
  };

  return aliasToCanonical;
};

export async function canonicalizeCourseId(value: unknown): Promise<string> {
  const raw = normalizeText(value);
  if (!raw) return '';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  const aliasMap = await ensureAliasMap();
  return (
    aliasMap.get(normalizeKey(decoded))
    || aliasMap.get(toAliasSlug(decoded))
    || decoded
  );
}

export async function canonicalizeCourseSlugPath(
  value: unknown,
  fallbackCourseId = '',
): Promise<string> {
  const raw = normalizeText(value).replace(/^\/+|\/+$/g, '');
  if (!raw) return '';

  const parts = raw.split('/').filter(Boolean);
  if (parts.length === 0) return '';

  const fallback = normalizeText(fallbackCourseId);
  const firstCoursePart = await canonicalizeCourseId(parts[0] || fallback || '');
  if (!firstCoursePart) return raw;

  return [firstCoursePart, ...parts.slice(1)].join('/');
}

export function clearCourseAliasCache(): void {
  cache = null;
}
