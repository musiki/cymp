// astro.config.mjs
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// importamos el plugin que traduce los delimitadores personalizados
import slugMathRemark from './src/plugins/slug-math-remark.js'

export default defineConfig({
  site: 'https://musiki.github.io/cymp/',
  output: 'static',                   // build estático integrado
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [
      slugMathRemark, // primero traducimos $< >$ a $ $
      remarkMath
    ],
    rehypePlugins: [rehypeKatex]
  }
})

