import type { APIRoute } from 'astro';
import { db, Enrollment, User, eq, and } from 'astro:db';

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

  try {
    // Get user from DB
    const [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));

    if (!dbUser) {
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

    if (existing.length > 0) {
      return new Response(JSON.stringify({ message: 'Already enrolled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create enrollment
    await db.insert(Enrollment).values({
      userId: dbUser.id,
      courseId: courseId,
      roleInCourse: 'student',
    });

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
