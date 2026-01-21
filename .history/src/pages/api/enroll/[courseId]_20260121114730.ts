import type { APIRoute } from 'astro';
import { db, Enrollment, User, eq, and } from 'astro:db';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ params, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const courseId = params.courseId;

  if (!courseId) {
    return new Response(JSON.stringify({ error: 'Course ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

  try {
    // Get user from DB
    const [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));
    // Get user
    const { data: user } = await supabase.from('User').select('id, role').eq('email', currentUser.email).single();

    if (!dbUser) {
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already enrolled
    const existing = await db
      .select()
      .from(Enrollment)
      .where(and(
        eq(Enrollment.userId, dbUser.id),
        eq(Enrollment.courseId, courseId)
      ));
    const { data: existing } = await supabase.from('Enrollment').select('id').eq('userId', user.id).eq('courseId', courseId).single();

    if (existing.length > 0) {
    if (existing) {
      return new Response(JSON.stringify({ message: 'Already enrolled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create enrollment - teachers enroll as teachers
    await db.insert(Enrollment).values({
      id: crypto.randomUUID(),
      userId: dbUser.id,
    // Create enrollment
    await supabase.from('Enrollment').insert([{
      userId: user.id,
      courseId: courseId,
      roleInCourse: dbUser.role === 'teacher' ? 'teacher' : 'student',
      enrolledAt: new Date(),
    });
      roleInCourse: user.role === 'teacher' ? 'teacher' : 'student',
    }]);

    return new Response(JSON.stringify({ success: true, message: 'Enrolled successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    return new Response(JSON.stringify({ error: 'Failed to enroll' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
