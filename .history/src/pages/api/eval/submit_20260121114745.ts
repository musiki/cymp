import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

  try {
    const body = await request.json();
    const { evalId, answer, isCorrect, courseId, pageSlug } = body;
    
    if (!evalId) {
      return new Response(JSON.stringify({ error: 'evalId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 1. Get User (Create if not exists)
    let { data: user } = await supabase.from('User').select('id').eq('email', currentUser.email).single();

    if (!user) {
      const { data: newUser, error: createError } = await supabase.from('User').insert([{
        id: crypto.randomUUID(),
        email: currentUser.email,
        name: currentUser.name || currentUser.email,
        emailVerified: true,
        image: currentUser.image || null,
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      }]).select().single();

      if (createError) throw createError;
      user = newUser;
    }

    // 2. Ensure Assignment exists
    const { data: assignment } = await supabase.from('Assignment').select('id').eq('id', evalId).single();
    
    if (!assignment) {
      const finalCourseId = courseId || 'ejemplo-generative-art';
      const finalSlug = pageSlug || `${finalCourseId}/assignment/${evalId}`;
      
      await supabase.from('Assignment').insert([{
        id: evalId,
        courseId: finalCourseId,
        slug: finalSlug
      }]);
    }

    // 3. Handle Submission (Upsert logic)
    const { data: existing } = await supabase.from('Submission').select('*').eq('userId', user.id).eq('assignmentId', evalId).single();

    if (existing) {
      await supabase.from('Submission').update({
        score: isCorrect ? 1 : 0,
        attempts: (existing.attempts || 0) + 1,
        submittedAt: new Date(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('Submission').insert([{
        userId: user.id,
        assignmentId: evalId,
        score: isCorrect ? 1 : 0,
        attempts: 1,
        submittedAt: new Date(),
      }]);
    }

    return new Response(JSON.stringify({ 
      success: true,
      isCorrect 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Submission error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
