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
	// Load all Markdown and MDX files from content directories (excluding blog and cursos)
	loader: glob({ base: './src/content', pattern: '**/!(blog|cursos)/**/*.{md,mdx}' }),
	// Schema for Obsidian-based content - very flexible to handle various YAML frontmatter
	schema: z.object({
		tag: z.string().or(z.array(z.string())).optional().nullable(),
		title: z.string().optional().nullable(),
		subtitle: z.string().optional().nullable(),
		author: z.string().or(z.array(z.string())).optional().nullable(),
		authors: z.string().or(z.array(z.string())).optional().nullable(),
		category: z.string().or(z.array(z.string())).optional().nullable(),
		publisher: z.string().optional().nullable(),
		totalPage: z.number().optional().nullable(),
		coverUrl: z.string().optional().nullable(),
		coverSmallUrl: z.string().optional().nullable(),
		publish: z.union([z.number(), z.string(), z.date()]).optional().nullable(),
		colabs: z.string().or(z.array(z.string())).optional().nullable(),
		description: z.string().optional().nullable(),
		link: z.string().optional().nullable(),
		isbn10: z.string().or(z.number()).optional().nullable(),
		isbn13: z.string().or(z.number()).optional().nullable(),
	}).passthrough(), // Allow any additional fields from Obsidian YAML
});

const cursos = defineCollection({
	// Load all course content
	loader: glob({ base: './src/content/cursos', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		// Course index fields
		type: z.enum(['course', 'lesson', 'assignment']).optional(),
		title: z.string(),
		description: z.string().optional(),
		instructor: z.string().optional(),
		level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
		duration: z.string().optional(),
		public: z.boolean().optional().default(false),
		coverImage: z.string().optional(),
		tags: z.array(z.string()).optional(),
		
		// Lesson/Assignment fields
		chapter: z.string().optional(),
		order: z.number().optional(),
		assignment: z.boolean().optional().default(false),
		points: z.number().optional(),
		visibility: z.enum(['public', 'enrolled-only']).optional(),
	}).passthrough(),
});

export const collections = { blog, content, cursos };
