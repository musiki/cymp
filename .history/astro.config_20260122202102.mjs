// astro.config.mjs
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

import slugMathRemark from './src/plugins/slug-math-remark.js'
import remarkObsidianCallouts from './src/plugins/remark-obsidian-callouts.mjs'
import remarkMermaid from './src/plugins/remark-mermaid.mjs'
import remarkRefsApa from './src/plugins/remark-refs-apa.mjs'
import remarkEvalBlocks from './src/plugins/remark-eval-blocks.mjs'
import remarkDataviewLite from './src/plugins/remark-dataview-lite.mjs'
import remarkWikiLink from './src/plugins/remark-wiki-link.mjs'

import auth from 'auth-astro';
import vercel from '@astrojs/vercel';


export default defineConfig({
  site: 'https://musiki.github.io/cymp/',
  output: 'server',
  adapter: vercel(),
  integrations: [
    mdx(), 
    auth()
  ],
  markdown: {
    remarkPlugins: [
      remarkGfm,
      slugMathRemark,         // primero traducís $<
      remarkMath,
      remarkObsidianCallouts, // detecta y transforma callouts (Moved to remarkPlugins)
      remarkMermaid,          // luego procesá mermaid si aparece dentro
      remarkEvalBlocks,       // procesa bloques eval
      remarkDataviewLite,     // procesa bloques dataview
      remarkWikiLink,         // procesa wiki links [[Link]]
    ],
    rehypePlugins: [
      rehypeRaw,              // permite inyectar HTML desde remark
      [rehypeKatex, { strict: false }], // Render math even if there are minor LaTeX errors
    ]
  }
})
