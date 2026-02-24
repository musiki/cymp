import type { Session } from '@auth/core/types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEntry } from 'astro:content';

export type ForumDbUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
};

export type ForumCourseAccess = {
  canRead: boolean;
  canWrite: boolean;
  isPublicCourse: boolean;
  isEnrolled: boolean;
  isTeacher: boolean;
};

type ServerClientOptions = {
  requireServiceRole?: boolean;
};

function clampLength(value: string, maxLength: number): string {
  if (maxLength <= 0) return value;
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function normalizeDbUser(row: any): ForumDbUser {
  return {
    id: String(row.id),
    email: row.email ?? null,
    name: row.name ?? null,
    role: row.role ?? null,
  };
}

function isClearlyPublishableSupabaseKey(key: string): boolean {
  return key.startsWith('sb_publishable_');
}

export function createSupabaseServerClient(options: ServerClientOptions = {}): SupabaseClient {
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_KEY;
  const fallbackKey = import.meta.env.SUPABASE_KEY;
  const apiKey = serviceRoleKey || fallbackKey;
  if (!apiKey) {
    throw new Error('SUPABASE_SERVER_KEY_MISSING');
  }
  if (options.requireServiceRole && isClearlyPublishableSupabaseKey(apiKey)) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY_REQUIRED_FOR_FORUM');
  }

  return createClient(import.meta.env.SUPABASE_URL, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function cleanString(value: unknown, maxLength = 240): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  return clampLength(raw, maxLength);
}

export function cleanBody(value: unknown, maxLength = 4000): string {
  const raw = typeof value === 'string' ? value : '';
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  return clampLength(normalized, maxLength);
}

export async function ensureDbUserFromSession(
  supabase: SupabaseClient,
  session: Session | null | undefined,
): Promise<ForumDbUser | null> {
  const email = cleanString(session?.user?.email ?? '', 320);
  if (!email) return null;

  const { data: existing, error: existingError } = await supabase
    .from('User')
    .select('id, email, name, role')
    .eq('email', email)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return normalizeDbUser(existing);

  const now = new Date().toISOString();
  const insertPayload = {
    id: crypto.randomUUID(),
    email,
    name: cleanString(session?.user?.name ?? email, 160),
    emailVerified: true,
    image: session?.user?.image ?? null,
    role: 'student',
    createdAt: now,
    updatedAt: now,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('User')
    .insert([insertPayload])
    .select('id, email, name, role')
    .single();

  if (!insertError && inserted) {
    return normalizeDbUser(inserted);
  }

  if (insertError && insertError.code !== '23505') {
    throw insertError;
  }

  // Concurrent first-login writes can trigger a duplicate key race.
  const { data: refetched, error: refetchError } = await supabase
    .from('User')
    .select('id, email, name, role')
    .eq('email', email)
    .single();

  if (refetchError) throw refetchError;
  return normalizeDbUser(refetched);
}

async function isPublicCourse(courseId: string): Promise<boolean> {
  if (!courseId) return false;

  try {
    const courseEntry = await getEntry('cursos', `${courseId}/_index`);
    return Boolean(courseEntry?.data?.public);
  } catch {
    return false;
  }
}

export async function getForumCourseAccess(
  supabase: SupabaseClient,
  user: ForumDbUser,
  courseId: string,
): Promise<ForumCourseAccess> {
  const isTeacher = user.role === 'teacher';
  const isPublic = await isPublicCourse(courseId);

  if (isTeacher) {
    return {
      canRead: true,
      canWrite: true,
      isPublicCourse: isPublic,
      isEnrolled: true,
      isTeacher: true,
    };
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('Enrollment')
    .select('id')
    .eq('userId', user.id)
    .eq('courseId', courseId)
    .maybeSingle();

  if (enrollmentError) throw enrollmentError;

  const isEnrolled = Boolean(enrollment);

  return {
    canRead: isEnrolled || isPublic,
    canWrite: isEnrolled,
    isPublicCourse: isPublic,
    isEnrolled,
    isTeacher: false,
  };
}
