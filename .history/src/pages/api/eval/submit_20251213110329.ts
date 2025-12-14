import type { APIRoute } from 'astro';
import { db, Submission, User, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { evalId, answer, isCorrect } = await request.json();
    
    if (!evalId) {
      return new Response(JSON.stringify({ error: 'evalId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get user from DB
    const [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));

    if (!dbUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if submission already exists
    const existing = await db
      .select()
      .from(Submission)
      .where(eq(Submission.userId, dbUser.id))
      .where(eq(Submission.assignmentId, evalId));

    if (existing.length > 0) {
      // Update existing submission (increment attempts)
      const currentAttempts = existing[0].attempts || 0;
      await db
        .update(Submission)
        .set({
          payload: { answer, isCorrect },
          score: isCorrect ? 1 : 0,
          attempts: currentAttempts + 1,
          submittedAt: new Date(),
        })
        .where(eq(Submission.id, existing[0].id));
    } else {
      // Create new submission
      await db.insert(Submission).values({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        assignmentId: evalId,
        payload: { answer, isCorrect },
        score: isCorrect ? 1 : 0,
        attempts: 1,
        submittedAt: new Date(),
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      isCorrect 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Submission error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save submission' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
