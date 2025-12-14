import type { APIRoute } from 'astro';
import { db, Submission, User, Assignment, eq, and } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  console.log('[API] /api/eval/submit called');
  
  const session = (locals as any).session;
  const currentUser = session?.user;

  console.log('[API] Current user:', currentUser?.email);

  if (!currentUser?.email) {
    console.log('[API] Not authenticated');
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { evalId, answer, isCorrect } = body;
    
    console.log('[API] Request body:', { evalId, answer, isCorrect });
    
    if (!evalId) {
      console.log('[API] Missing evalId');
      return new Response(JSON.stringify({ error: 'evalId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get user from DB, create if doesn't exist
    let [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));

    if (!dbUser) {
      console.log('[API] User not found in DB, creating...');
      // Create user on first submission
      await db.insert(User).values({
        id: crypto.randomUUID(),
        email: currentUser.email,
        name: currentUser.name || currentUser.email,
        emailVerified: true,
        image: currentUser.image || null,
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Fetch the newly created user
      [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));
      console.log('[API] User created:', dbUser.id);
    } else {
      console.log('[API] DB User found:', dbUser.id);
    }

    if (!dbUser) {
      console.log('[API] Failed to create user');
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure Assignment exists (auto-create if doesn't exist)
    const [assignment] = await db.select().from(Assignment).where(eq(Assignment.id, evalId));
    
    if (!assignment) {
      console.log('[API] Assignment not found, auto-creating...');
      // Try to infer courseId from evalId pattern
      // Assuming evalId format like "gen-art-u1-q1" or "mcq2-01-mayor"
      // For now, default to 'ejemplo-generative-art' - could be improved
      const inferredCourseId = 'ejemplo-generative-art';
      const inferredSlug = `${inferredCourseId}/assignment/${evalId}`;
      
      await db.insert(Assignment).values({
        id: evalId,
        courseId: inferredCourseId,
        slug: inferredSlug,
        type: 'multiple-choice',
        weight: 1,
      });
      console.log('[API] Assignment auto-created:', evalId);
    }

    // Check if submission already exists
    const existing = await db
      .select()
      .from(Submission)
      .where(and(
        eq(Submission.userId, dbUser.id),
        eq(Submission.assignmentId, evalId)
      ));

    console.log('[API] Existing submissions:', existing.length);

    if (existing.length > 0) {
      // Update existing submission (increment attempts)
      console.log('[API] Updating existing submission');
      const currentAttempts = existing[0].attempts || 0;
      await db
        .update(Submission)
        .set({
          payload: JSON.stringify({ answer, isCorrect }), // Convert to JSON string
          score: isCorrect ? 1 : 0,
          attempts: currentAttempts + 1,
          submittedAt: new Date(),
        })
        .where(eq(Submission.id, existing[0].id));
      console.log('[API] Updated successfully, new attempts:', currentAttempts + 1);
    } else {
      // Create new submission
      console.log('[API] Creating new submission');
      const newId = crypto.randomUUID();
      await db.insert(Submission).values({
        id: newId,
        userId: dbUser.id,
        assignmentId: evalId,
        payload: JSON.stringify({ answer, isCorrect }), // Convert to JSON string
        score: isCorrect ? 1 : 0,
        attempts: 1,
        submittedAt: new Date(),
      });
      console.log('[API] Created successfully with ID:', newId);
    }

    console.log('[API] Submission saved successfully');
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
