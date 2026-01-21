import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session as any;
  const currentUser = session?.user;

  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { courseId } = await request.json();
    if (!courseId) return new Response(JSON.stringify({ error: 'Missing courseId' }), { status: 400 });

    const supabase = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

    // Get User ID
    const { data: user } = await supabase.from('User').select('id, role').eq('email', currentUser.email).single();
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });

    // Check existing enrollment
    const { data: existing } = await supabase.from('Enrollment').select('id').eq('userId', user.id).eq('courseId', courseId).single();
    
    if (existing) {
      return new Response(JSON.stringify({ message: 'Already enrolled' }), { status: 200 });
    }

    // Determine role for the course based on the user's global role
    const roleInCourse = user.role === 'teacher' ? 'teacher' : 'student';

    // Insert Enrollment
    const { error } = await supabase.from('Enrollment').insert([{
      userId: user.id,
      courseId: courseId,
      roleInCourse: roleInCourse
    }]);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}