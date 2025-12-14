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
import remarkRefsApa from './src/plugins/remark-refs-apa.mjs';


import db from '@astrojs/db';


export default defineConfig({
  site: 'https://musiki.github.io/cymp/',
  output: 'static',
  integrations: [mdx(), db()],
  markdown: {
    remarkPlugins: [
      remarkGfm,
      slugMathRemark,         // primero traducís $<
      remarkMath,
      remarkMermaid,          // luego procesá mermaid si aparece dentro
    ],
    rehypePlugins: [
      rehypeRaw,              // permite inyectar HTML desde remark
      remarkObsidianCallouts, // detecta y transforma callouts
      rehypeKatex,
    ]
  }
})