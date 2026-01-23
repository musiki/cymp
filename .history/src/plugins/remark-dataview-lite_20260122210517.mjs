import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export default function remarkDataviewLite() {
  return (tree, file) => {
    const ROOT = path.resolve(process.cwd(), 'src/content');
    const files = [];
    (function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(md|mdx)$/i.test(e.name)) files.push(p);
      }
    })(ROOT);

    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'dataview' && node.lang !== 'dataviewjs') return;

      const command = node.value.trim();
      let tag = null;

      if (node.lang === 'dataviewjs') {
        const match = command.match(/dv\.pages\(\s*['"]#([^'"]+)['"]\s*\)/);
        if (match) {
          tag = match[1];
        } else {
          // Render as client-side script for generic dataviewjs blocks
          const id = 'dvjs-' + Math.random().toString(36).slice(2);
          // Use JSON.stringify to safely serialize the user's code.
          // We must also escape backticks because we inject this string into a template literal in the generated script.
          const escapedCode = JSON.stringify(command).replace(/<\/script>/g, '<\\/script>');
          
          let filePath = '';
          if (file && file.path) {
             filePath = path.relative(ROOT, file.path).split(path.sep).join('/');
          }

          const script = `
(function() {
  const container = document.getElementById('${id}');
  const ctx = { container: container };
  const dv = { current: () => ({ file: { path: "${filePath}", outlinks: [], inlinks: [] } }) };
  try {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(${escapedCode});
    fn.call(ctx);
  } catch(e) {
    container.innerHTML = '<div style="color:red;border:1px solid red;padding:10px;">DataviewJS Error: '+e.message+'</div>';
  }
})();`;
          parent.children[index] = { type: 'html', value: `<div id="${id}"></div><script type="module" is:inline>${script}</script>` };
          return;
        }
      } else if (node.lang === 'dataview' && command.startsWith('list from #')) {
        tag = command.replace('list from #', '').trim();
      }

      if (tag) {
        const matchingFiles = [];

        for (const file of files) {
          const raw = fs.readFileSync(file, 'utf8');
          const fm = matter(raw);
          const tags = fm.data.tags || [];
          if (tags.includes(tag)) {
            // Flatten slug: use filename only to match [slug].astro routing
            const rawSlug = path.basename(file).replace(/\.(md|mdx)$/i, '');
            const slug = rawSlug
              .trim().toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            
            let title = fm.data.title;
            if (!title) {
              const h1 = raw.match(/^#\s+(.*)$/m);
              if (h1) title = h1[1];
              else title = slug.split('/').pop();
            }
            matchingFiles.push({ slug, title });
          }
        }

        if (matchingFiles.length > 0) {
          const listItems = matchingFiles.map(file => `<li><a href="/${file.slug}">${file.title}</a></li>`).join('');
          const html = `<div class="dvlist"><ul class="dvlist-items">${listItems}</ul></div>`;
          parent.children[index] = { type: 'html', value: html };
        }
      }
    });
  };
}
