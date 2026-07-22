import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { authorIdPattern, hasAuthorId } from './data/authors';

const author = z.object({
	id: z.string().regex(authorIdPattern).optional(),
	name: z.string().min(1).optional(),
	github: z.string().min(1).optional(),
	avatar: z.string().min(1).optional(),
	url: z.url().optional(),
}).refine((value) => value.id || value.name || value.github, {
	message: 'Author needs id, name, or github.',
}).refine((value) => !value.id || hasAuthorId(value.id), {
	message: 'Unknown author id. Add it to src/data/authors.ts or use inline name/github.',
});

const shared = z.object({
	title: z.string(),
	lang: z.enum(['zh', 'en']).default('zh'),
	translationKey: z.string().optional(),
	date: z.coerce.date(),
	updated: z.coerce.date().optional(),
	summary: z.string(),
	authors: z.array(author).min(1),
	tags: z.array(z.string()).min(1),
	draft: z.boolean().default(false),
});

const papers = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/papers' }),
	schema: shared.extend({
		paperAuthors: z.array(z.string()).default([]),
		venue: z.string().optional(),
		paperUrl: z.url().optional(),
		codeUrl: z.url().optional(),
		benchmarks: z.array(z.string()).default([]),
		tasks: z.array(z.string()).default([]),
		status: z.enum(['working', 'preprint', 'accepted', 'published']).default('preprint'),
	}),
});

const benchmarks = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/benchmarks' }),
	schema: shared.extend({
		area: z.string(),
		metric: z.string(),
		version: z.string().optional(),
		risk: z.enum(['low', 'medium', 'high']).default('medium'),
		status: z.enum(['active', 'aging', 'saturated', 'watch']).default('active'),
	}),
});

const opinions = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/opinions' }),
	schema: shared.extend({
		stance: z.string().optional(),
	}),
});

export const collections = { papers, benchmarks, opinions };
