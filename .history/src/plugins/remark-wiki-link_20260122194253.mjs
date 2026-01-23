import { visit } from 'unist-util-visit';

export default function remarkWikiLink() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const value = node.value;
      if (!value.includes('[[')) return;

      const regex = /\[\[([^[\]]+?)\]\]/g;
      let match;
      let lastIndex = 0;
      const nodes = [];

      while ((match = regex.exec(value)) !== null) {
        if (match.index > lastIndex) {
          nodes.push({ type: 'text', value: value.slice(lastIndex, match.index) });
        }

        const content = match[1];
        let target = content;
        let label = content;

        if (content.includes('|')) {
          const parts = content.split('|');
          target = parts[0];
          label = parts.slice(1).join('|');
        }

        // Flatten logic: strip folder paths, keep only filename + anchor
        // e.g. "folder/Note" -> "Note", "folder/Note#Header" -> "Note#Header"
        const slug = target.split('/').pop().trim();
        const url = '/' + slug;

        nodes.push({ type: 'link', url: url, children: [{ type: 'text', value: label }] });
        lastIndex = regex.lastIndex;
      }

      if (nodes.length > 0) {
        if (lastIndex < value.length) nodes.push({ type: 'text', value: value.slice(lastIndex) });
        parent.children.splice(index, 1, ...nodes);
        return index + nodes.length;
      }
    });
  };
}
