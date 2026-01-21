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

  // Verify user is a teacher
  const { data: user } = await supabase.from('User').select('role').eq('email', currentUser.email).single();
  
  if (!user || user.role !== 'teacher') {
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
    const { error } = await supabase.from('Submission')
      .update({
        score: numericScore,
        gradedAt: new Date(),
      }).eq('id', submissionId);

    if (error) throw error;

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
