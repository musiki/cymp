import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export default function remarkDataviewLite() {
  return (tree) => {
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
      if (command.startsWith('list from #')) {
        const tag = command.replace('list from #', '').trim();
        const matchingFiles = [];

        for (const file of files) {
          const raw = fs.readFileSync(file, 'utf8');
          const fm = matter(raw);
          const tags = fm.data.tags || [];
          if (tags.includes(tag)) {
            const rel = file.slice(ROOT.length + 1);
            const posix = rel.split(path.sep).join('/');
            const slug = posix.replace(/\.(md|mdx)$/i, '');
            const title = fm.data.title || slug.split('/').pop();
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
