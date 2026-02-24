import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(10, Math.max(0, value));
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      return Math.min(10, Math.max(0, parsed));
    }
  }

  return null;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const POST: APIRoute = async ({ request, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

  try {
    const body = await request.json();

    const evalId = cleanString(body?.evalId);
    const answer = body?.answer;
    const isCorrect = typeof body?.isCorrect === 'boolean' ? body.isCorrect : undefined;
    const courseId = cleanString(body?.courseId);
    const pageSlug = cleanString(body?.pageSlug);
    const feedback = cleanString(body?.feedback);
    const score = normalizeScore(body?.score);
    const markAsGraded = Boolean(body?.markAsGraded) || score !== null;
    const ensureEnrollment = Boolean(body?.ensureEnrollment);

    const targetStudentEmail = cleanString(body?.targetStudentEmail).toLowerCase();
    const targetStudentName = cleanString(body?.targetStudentName);

    const payload =
      body?.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
        ? body.payload
        : { answer, isCorrect };

    if (!evalId) {
      return json({ error: 'evalId required' }, 400);
    }

    // 1) Requester user (create on first login)
    let { data: requesterUser, error: requesterError } = await supabase
      .from('User')
      .select('id, role, email, name, image')
      .eq('email', currentUser.email)
      .maybeSingle();

    if (requesterError) throw requesterError;

    if (!requesterUser) {
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert([
          {
            id: crypto.randomUUID(),
            email: currentUser.email,
            name: currentUser.name || currentUser.email,
            emailVerified: true,
            image: currentUser.image || null,
            role: 'student',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        .select('id, role, email, name, image')
        .single();

      if (createError) throw createError;
      requesterUser = newUser;
    }

    // 2) Decide target student user (teacher can submit on behalf of a student)
    let targetUser = requesterUser;

    if (targetStudentEmail && targetStudentEmail !== requesterUser.email?.toLowerCase()) {
      if (requesterUser.role !== 'teacher') {
        return json({ error: 'Only teachers can submit for another student' }, 403);
      }

      let { data: studentUser, error: studentFindError } = await supabase
        .from('User')
        .select('id, role, email, name, image')
        .eq('email', targetStudentEmail)
        .maybeSingle();

      if (studentFindError) throw studentFindError;

      if (!studentUser) {
        const { data: createdStudent, error: studentCreateError } = await supabase
          .from('User')
          .insert([
            {
              id: crypto.randomUUID(),
              email: targetStudentEmail,
              name: targetStudentName || targetStudentEmail,
              emailVerified: true,
              image: null,
              role: 'student',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ])
          .select('id, role, email, name, image')
          .single();

        if (studentCreateError) throw studentCreateError;
        studentUser = createdStudent;
      }

      targetUser = studentUser;
    }

    // 3) Ensure assignment exists
    const { data: assignment, error: assignmentFindError } = await supabase
      .from('Assignment')
      .select('id, courseId')
      .eq('id', evalId)
      .maybeSingle();

    if (assignmentFindError) throw assignmentFindError;

    const finalCourseId = courseId || assignment?.courseId || 'ejemplo-generative-art';

    if (!assignment) {
      const finalSlug = pageSlug || `${finalCourseId}/assignment/${evalId}`;

      const assignmentBase = {
        id: evalId,
        courseId: finalCourseId,
        slug: finalSlug,
      };

      const withWeight = await supabase.from('Assignment').insert([
        {
          ...assignmentBase,
          weight: 1,
        },
      ]);

      if (withWeight.error) {
        const weightMissing =
          typeof withWeight.error.message === 'string' &&
          withWeight.error.message.toLowerCase().includes('weight');

        if (weightMissing) {
          const withoutWeight = await supabase.from('Assignment').insert([assignmentBase]);
          if (withoutWeight.error) throw withoutWeight.error;
        } else {
          throw withWeight.error;
        }
      }
    }

    let enrolledInCourse = false;
    if (ensureEnrollment && finalCourseId) {
      const { data: existingEnrollment, error: enrollmentFindError } = await supabase
        .from('Enrollment')
        .select('id')
        .eq('userId', targetUser.id)
        .eq('courseId', finalCourseId)
        .maybeSingle();

      if (enrollmentFindError) throw enrollmentFindError;

      if (existingEnrollment) {
        enrolledInCourse = true;
      } else {
        const { error: enrollmentInsertError } = await supabase.from('Enrollment').insert([
          {
            userId: targetUser.id,
            courseId: finalCourseId,
            roleInCourse: 'student',
          },
        ]);

        if (enrollmentInsertError) throw enrollmentInsertError;
        enrolledInCourse = true;
      }
    }

    // 4) Upsert submission
    const { data: existing, error: existingError } = await supabase
      .from('Submission')
      .select('*')
      .eq('userId', targetUser.id)
      .eq('assignmentId', evalId)
      .maybeSingle();

    if (existingError) throw existingError;

    const fallbackBinaryScore = typeof isCorrect === 'boolean' ? (isCorrect ? 1 : 0) : null;
    const finalScore = score !== null ? score : fallbackBinaryScore;

    const baseUpdate: Record<string, unknown> = {
      payload,
      attempts: ((existing?.attempts as number) || 0) + 1,
      submittedAt: new Date(),
    };

    if (finalScore !== null) {
      baseUpdate.score = finalScore;
    }

    if (feedback) {
      baseUpdate.feedback = feedback;
    }

    if (markAsGraded) {
      baseUpdate.gradedAt = new Date();
    }

    let submissionId = '';

    if (existing) {
      const { error: updateError } = await supabase
        .from('Submission')
        .update(baseUpdate)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      submissionId = existing.id;
    } else {
      const insertPayload: Record<string, unknown> = {
        userId: targetUser.id,
        assignmentId: evalId,
        payload,
        attempts: 1,
        submittedAt: new Date(),
      };

      if (finalScore !== null) insertPayload.score = finalScore;
      if (feedback) insertPayload.feedback = feedback;
      if (markAsGraded) insertPayload.gradedAt = new Date();

      const { data: createdSubmission, error: insertError } = await supabase
        .from('Submission')
        .insert([insertPayload])
        .select('id')
        .single();

      if (insertError) throw insertError;
      submissionId = createdSubmission.id;
    }

    return json(
      {
        success: true,
        isCorrect,
        score: finalScore,
        submissionId,
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
        },
        enrolledInCourse,
      },
      200,
    );
  } catch (error: any) {
    console.error('Submission error:', error?.message || error);
    return json({ error: error?.message || 'Submission error' }, 500);
  }
};
