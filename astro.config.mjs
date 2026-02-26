// astro.config.mjs
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

import slugMathRemark from './src/plugins/slug-math-remark.js'
import rehypeObsidianCallouts from './src/plugins/remark-obsidian-callouts.mjs'
import remarkMermaid from './src/plugins/remark-mermaid.mjs'
import remarkRefsApa from './src/plugins/remark-refs-apa.mjs'
import remarkEvalBlocks from './src/plugins/remark-eval-blocks.mjs'
import remarkDataviewLite from './src/plugins/remark-dataview-lite.mjs'
import remarkWikiLink from './src/plugins/remark-wiki-link.mjs'
import remarkLily from './src/plugins/remark-lily.mjs'

import auth from 'auth-astro';
import vercel from '@astrojs/vercel';

const localhostUrlRe = /^https?:\/\/(?:localhost|127(?:\.\d+){3}|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i;
const vercelSite = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const authSite = process.env.AUTH_URL && !localhostUrlRe.test(process.env.AUTH_URL)
  ? process.env.AUTH_URL
  : undefined;
const site = process.env.SITE_URL || authSite || vercelSite || 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'server',
  adapter: vercel(),
  // Auth.js already validates CSRF tokens for auth endpoints.
  // Astro's origin guard can false-positive behind Vercel/proxies.
  security: {
    checkOrigin: false,
  },
  integrations: [
    mdx(), 
    auth({ injectEndpoints: false })
  ],
  markdown: {
    shikiConfig: {
      langAlias: {
        'dataview': 'javascript',
        'dataviewjs': 'javascript',
        'ref': 'text',
        'run-python': 'python',
      }
    },
    remarkPlugins: [
      remarkGfm,
      slugMathRemark,         // primero traducís $<
      remarkMath,
      remarkMermaid,          // luego procesá mermaid si aparece dentro
      remarkEvalBlocks,       // procesa bloques eval
      remarkDataviewLite,     // procesa bloques dataview
      remarkWikiLink,         // procesa wiki links [[Link]]
      remarkLily,             // procesa bloques lilypond
    ],
    rehypePlugins: [
      rehypeObsidianCallouts, // detecta y transforma callouts tipo GitHub/Obsidian
      rehypeRaw,              // permite inyectar HTML desde remark
      [rehypeKatex, { strict: false }], // Render math even if there are minor LaTeX errors
    ]
  }
})
