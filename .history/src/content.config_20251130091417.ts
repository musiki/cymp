import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
		}),
});

const content = defineCollection({
	// Load all Markdown and MDX files from content directories
	loader: glob({ base: './src/content', pattern: '**/*.{md,mdx}', exclude: ['blog/**'] }),
	// Schema for Obsidian-based content
	schema: z.object({
		tag: z.string().or(z.array(z.string())).optional(),
		title: z.string().optional(),
		subtitle: z.string().optional(),
		author: z.string().or(z.array(z.string())).optional(),
		authors: z.string().or(z.array(z.string())).optional(),
		category: z.string().or(z.array(z.string())).optional(),
		publisher: z.string().optional(),
		totalPage: z.number().optional(),
		coverUrl: z.string().optional(),
		coverSmallUrl: z.string().optional(),
		publish: z.number().or(z.string()).optional(),
		colabs: z.string().or(z.array(z.string())).optional(),
		description: z.string().optional(),
		link: z.string().optional(),
		isbn10: z.string().optional(),
		isbn13: z.string().optional(),
	}).passthrough(), // Allow any additional fields from Obsidian YAML
});

export const collections = { blog, content };
