import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const DELETE: APIRoute = async ({ params, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;
  if (!currentUser?.email) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const targetUserId = String(params.id || '').trim();
  if (!targetUserId) {
    return json({ error: 'User id required' }, 400);
  }

  const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

  try {
    const { data: requester, error: requesterError } = await supabase
      .from('User')
      .select('id, role')
      .eq('email', currentUser.email)
      .maybeSingle();

    if (requesterError) throw requesterError;
    if (!requester) return json({ error: 'Requester user not found' }, 404);

    const requesterRole = String(requester.role || '').trim().toLowerCase();
    if (requesterRole !== 'teacher') {
      return json({ error: 'Only teachers can delete users' }, 403);
    }

    if (requester.id === targetUserId) {
      return json({ error: 'Cannot delete current teacher account' }, 400);
    }

    const { data: targetUser, error: targetUserError } = await supabase
      .from('User')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetUserError) throw targetUserError;
    if (!targetUser) return json({ error: 'User not found' }, 404);

    const { error: submissionsDeleteError } = await supabase
      .from('Submission')
      .delete()
      .eq('userId', targetUserId);
    if (submissionsDeleteError) throw submissionsDeleteError;

    const { error: enrollmentsDeleteError } = await supabase
      .from('Enrollment')
      .delete()
      .eq('userId', targetUserId);
    if (enrollmentsDeleteError) throw enrollmentsDeleteError;

    const { error: userDeleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', targetUserId);
    if (userDeleteError) throw userDeleteError;

    return json({ success: true }, 200);
  } catch (error: any) {
    console.error('Error deleting user:', error?.message || error);
    return json({ error: error?.message || 'Failed to delete user' }, 500);
  }
};

