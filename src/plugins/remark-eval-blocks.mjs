import { visit } from 'unist-util-visit';
import yaml from 'js-yaml';

export default function remarkEvalBlocks() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'eval') return;
      
      try {
        const evalData = yaml.load(node.value);
        
        // Escape single quotes in JSON for HTML attribute
        const jsonData = JSON.stringify(evalData).replace(/'/g, '&apos;');
        
        // Transform to custom HTML component
        const replacement = {
          type: 'html',
          value: `<div class="eval-block-wrapper" data-eval='${jsonData}'></div>`
        };
        
        parent.children[index] = replacement;
      } catch (error) {
        console.error('Error parsing eval block:', error);
        // Keep original code block on error
      }
    });
  };
}
