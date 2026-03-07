import type { APIRoute } from 'astro';
import { getLiveSnapshot, getLiveSnapshotBySession } from '../../../lib/live/server-store.mjs';

export const GET: APIRoute = async ({ url }) => {
  const courseId = String(url.searchParams.get('courseId') || '').trim();
  const sessionId = String(url.searchParams.get('sessionId') || '').trim();

  const payload = sessionId
    ? getLiveSnapshotBySession(sessionId)
    : getLiveSnapshot(courseId);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
