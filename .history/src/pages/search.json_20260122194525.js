import { getCollection } from 'astro:content';

export async function GET() {
  const content = await getCollection('content');
  // You can also add 'cursos' here if you want them in the global search
  
  const items = content.map(item => {
    // Resolve title: Frontmatter > Filename
    const filename = item.id.split('/').pop()?.replace(/\.[^/.]+$/, '');
    const title = item.data.title || filename || 'Untitled';
    
    return {
      title: title,
      slug: '/' + filename, // Flattened URL
      content: item.body,   // Full text for searching
      type: 'Note'
    };
  });

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' }
  });
}