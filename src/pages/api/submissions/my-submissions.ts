import type { APIRoute } from 'astro';
import { db, Submission, User, eq } from 'astro:db';

export const GET: APIRoute = async ({ request, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get user from DB
    const [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));

    if (!dbUser) {
      return new Response(JSON.stringify({ submissions: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all submissions for this user
    const submissions = await db
      .select()
      .from(Submission)
      .where(eq(Submission.userId, dbUser.id));

    // Transform to a more usable format
    const submissionsMap = submissions.reduce((acc: any, sub) => {
      acc[sub.assignmentId] = {
        id: sub.id,
        answer: sub.payload,
        score: sub.score,
        attempts: sub.attempts,
        submittedAt: sub.submittedAt,
        gradedAt: sub.gradedAt,
      };
      return acc;
    }, {});

    return new Response(JSON.stringify({ submissions: submissionsMap }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch submissions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
