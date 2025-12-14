import type { APIRoute } from "astro";
import { db, Submission, eq, and } from "astro:db";

export const prerender = false;

export const POST: APIRoute = async ({ request, params, locals }) => {
  const session = locals.session as any;
  
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { assignmentId } = params;
  if (!assignmentId) {
    return new Response(JSON.stringify({ error: "Assignment ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const data = await request.json();
    const { answers } = data;

    // Check if user already has a submission for this assignment
    const existingSubmissions = await db
      .select()
      .from(Submission)
      .where(eq(Submission.userId, session.user.id))
      .where(eq(Submission.assignmentId, assignmentId));

    const submissionId = `${session.user.id}-${assignmentId}-${Date.now()}`;
    const attempts = existingSubmissions.length + 1;

    // Create new submission
    await db.insert(Submission).values({
      id: submissionId,
      userId: session.user.id,
      assignmentId: assignmentId,
      payload: answers,
      attempts: attempts,
      submittedAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        attempts,
        message: "Respuestas guardadas exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error saving submission:", error);
    return new Response(
      JSON.stringify({ error: "Error al guardar las respuestas" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// GET previous submissions
export const GET: APIRoute = async ({ params, locals }) => {
  const session = locals.session;
  
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { assignmentId } = params;
  if (!assignmentId) {
    return new Response(JSON.stringify({ error: "Assignment ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const submissions = await db
      .select()
      .from(Submission)
      .where(eq(Submission.userId, session.user.id))
      .where(eq(Submission.assignmentId, assignmentId))
      .orderBy(Submission.submittedAt);

    return new Response(JSON.stringify({ submissions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return new Response(
      JSON.stringify({ error: "Error al cargar las respuestas" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
