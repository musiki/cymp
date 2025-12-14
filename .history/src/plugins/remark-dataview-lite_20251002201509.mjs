// src/plugins/remark-dataview-lite.mjs
import { visit } from 'unist-util-visit';

export default function remarkDataviewLite(options = {}) {
  const { getByTag, files = [] } = options;
  
  if (typeof getByTag !== 'function') {
    throw new Error('[remark-dataview-lite] options.getByTag(tag) es requerido');
  }

  // match: list from #energía  | list from #energia
  const LIST_RE = /^list\s+from\s+#([\p{L}\p{N}_\-]+)$/iu;

  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if ((node.lang || '').toLowerCase() !== 'dataview') return;

      const q = String(node.value || '').trim();
      const m = q.match(LIST_RE);
      if (!m) return; // por ahora solo soportamos "list from #tag"

      const tag = m[1];
      const items = getByTag(tag, { files });

      const html = [
        `<div class="dvlist" data-tag="${tag}">`,
        `<div class="dvlist-header">Resultados para <code>#${tag}</code> (${items.length})</div>`,
        `<ul class="dvlist-items">`,
        ...items.map(it => {
          const meta = [];
          if (it.year) meta.push(it.year);
          if (it.person) meta.push(it.person);
          const metaTxt = meta.length ? ` <span class="meta">— ${meta.join(' · ')}</span>` : '';
          return `<li><a href="/${encodeURI(it.slug)}">${escapeHtml(it.title)}</a>${metaTxt}</li>`;
        }),
        `</ul>`,
        `</div>`
      ].join('\n');

      parent.children.splice(index, 1, { type: 'html', value: html });
    });
  };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}