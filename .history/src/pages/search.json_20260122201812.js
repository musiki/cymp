import { getCollection } from 'astro:content';

export async function GET() {
  const content = await getCollection('content');
  // You can also add 'cursos' here if you want them in the global search
  
  const items = content.map(item => {
    // Resolve title: Frontmatter > Filename
    const filename = item.id.split('/').pop()?.replace(/\.[^/.]+$/, '');
    const title = item.data.title || filename || 'Untitled';
    const slug = filename
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const hasDataview = item.body && (item.body.includes('```dataview') || item.body.includes('```dataviewjs'));
    
    return {
      title: title,
      slug: '/' + slug, // Flattened URL
      content: item.body,   // Full text for searching
      type: 'Note',
      hasDataview
    };
  });

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' }
  });
}