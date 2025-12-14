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

  // Verify user is a teacher
  const [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));
  
  if (!dbUser || dbUser.role !== 'teacher') {
    return new Response(JSON.stringify({ error: 'Unauthorized - Teacher only' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { submissionId, score } = body;
    
    if (!submissionId || score === undefined || score === null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const numericScore = parseFloat(score);
    
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      return new Response(JSON.stringify({ error: 'Invalid score (must be 0-10)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the submission
    await db.update(Submission)
      .set({
        score: numericScore,
        gradedAt: new Date(),
        gradedBy: dbUser.id,
      })
      .where(eq(Submission.id, submissionId));

    return new Response(JSON.stringify({ 
      success: true,
      score: numericScore 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    return new Response(JSON.stringify({ error: 'Failed to update grade' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
