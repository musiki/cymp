import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const DELETE: APIRoute = async ({ params, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const submissionId = params.id;
  if (!submissionId) {
    return json({ error: 'Submission id required' }, 400);
  }

  const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

  try {
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', currentUser.email)
      .single();

    if (userError || !user) {
      return json({ error: 'User not found' }, 404);
    }

    const { data: submission, error: submissionError } = await supabase
      .from('Submission')
      .select('id')
      .eq('id', submissionId)
      .eq('userId', user.id)
      .single();

    if (submissionError || !submission) {
      return json({ error: 'Submission not found' }, 404);
    }

    const { error: deleteError } = await supabase
      .from('Submission')
      .delete()
      .eq('id', submissionId)
      .eq('userId', user.id);

    if (deleteError) throw deleteError;

    return json({ success: true }, 200);
  } catch (error: any) {
    console.error('Error deleting submission:', error?.message || error);
    return json({ error: 'Failed to delete submission' }, 500);
  }
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
