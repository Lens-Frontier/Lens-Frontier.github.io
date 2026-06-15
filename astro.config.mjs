// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMermaid from './src/lib/remark-mermaid.mjs';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isUserPage = repositoryName?.endsWith('.github.io');
const base =
	process.env.SITE_BASE ??
	(process.env.GITHUB_ACTIONS && repositoryName && !isUserPage
		? `/${repositoryName}`
		: '/');

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL ?? 'https://example.com',
	base,
	devToolbar: {
		enabled: false,
	},
	integrations: [sitemap()],
	markdown: {
		remarkPlugins: [remarkMermaid],
		shikiConfig: {
			theme: 'github-light',
		},
	},
});
