import { appendFileSync, existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import * as cheerio from 'cheerio';
import YAML from 'yaml';

const root = process.cwd();
const dist = join(root, 'dist');
const siteUrl = process.env.SITE_URL;
const siteBase = normalizeBase(process.env.SITE_BASE ?? '/');
const legacySiteBase = process.env.LEGACY_SITE_BASE ? normalizeBase(process.env.LEGACY_SITE_BASE) : undefined;
const gaMeasurementId = process.env.PUBLIC_GA_MEASUREMENT_ID;
const pageviewEndpoint = process.env.PUBLIC_PAGEVIEW_ENDPOINT;
const requiredFiles = [
	'404.html',
	'index.html',
	'zh/index.html',
	'en/index.html',
	'about/index.html',
	'zh/about/index.html',
	'en/about/index.html',
	'papers/index.html',
	'zh/papers/index.html',
	'en/papers/index.html',
	'benchmarks/index.html',
	'zh/benchmarks/index.html',
	'en/benchmarks/index.html',
	'zh/blog/methods/index.html',
	'en/blog/methods/index.html',
	'opinions/index.html',
	'zh/opinions/index.html',
	'en/opinions/index.html',
	'timeline/index.html',
	'zh/timeline/index.html',
	'en/timeline/index.html',
	'tags/index.html',
	'zh/tags/index.html',
	'en/tags/index.html',
	'rss.xml',
	'zh/rss.xml',
	'en/rss.xml',
	'sitemap-index.xml',
];

if (siteBase === '/' && legacySiteBase && legacySiteBase !== '/') {
	const legacyDirectory = legacySiteBase.slice(1, -1);
	requiredFiles.push(`${legacyDirectory}/zh/index.html`, `${legacyDirectory}/zh/rss.xml`);
}

const skippedProtocols = /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i;
const unsafeInternalPath = /(?:^|\/)(?:src|node_modules)\//;
const localizedHtmlLang = new Map([
	['zh', 'zh-CN'],
	['en', 'en'],
]);
const errors = [];
const warnings = [];
const contentRoot = join(root, 'src', 'content');
const contentPreservationManifest = join(root, 'docs', 'content-preservation-manifest.json');
const renderedMarkdownPatterns = [
	{
		name: 'strong emphasis marker',
		regex: /\*\*[^*\n]{1,160}\*\*/g,
	},
	{
		name: 'underscore emphasis marker',
		regex: /__[^_\n]{1,160}__/g,
	},
	{
		name: 'Markdown image syntax',
		regex: /!\[[^\]\n]{1,120}\]\([^\s)\n][^)\n]{0,240}\)/g,
	},
	{
		name: 'Markdown link syntax',
		regex: /(?<!!)\[[^\]\n]{1,120}\]\([^\s)\n][^)\n]{0,240}\)/g,
	},
];

function normalizeBase(base) {
	if (!base || base === '/') return '/';
	const withLeading = base.startsWith('/') ? base : `/${base}`;
	return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

async function walk(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walk(full)));
		} else {
			files.push(full);
		}
	}
	return files;
}

function stripBase(pathname) {
	if (siteBase === '/') return pathname;
	if (pathname === siteBase.slice(0, -1)) return '/';
	if (pathname.startsWith(siteBase)) return `/${pathname.slice(siteBase.length)}`;
	return pathname;
}

function localFileFor(pathname) {
	const localPath = decodeURIComponent(stripBase(pathname));
	if (!localPath.startsWith('/')) return undefined;
	if (localPath.endsWith('/')) return join(dist, localPath, 'index.html');
	if (extname(localPath)) return join(dist, localPath);
	return join(dist, localPath, 'index.html');
}

function parseLocalReference(value, currentFile) {
	if (!value || value.startsWith('#') || skippedProtocols.test(value) || value.startsWith('//')) return undefined;

	try {
		const base = new URL(`file://${currentFile}`);
		const url = value.startsWith('/') ? new URL(value, 'https://local.test') : new URL(value, base);
		if (url.protocol !== 'file:' && url.hostname !== 'local.test') return undefined;
		const pathname = url.protocol === 'file:' ? url.pathname.replace(dist, '') || '/' : url.pathname;
		return { pathname, hash: url.hash };
	} catch {
		return undefined;
	}
}

function pageIds($) {
	const ids = new Set();
	$('[id]').each((_, element) => {
		const id = $(element).attr('id');
		if (id) ids.add(id);
	});
	return ids;
}

function annotationValue(value) {
	return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/:/g, '%3A').replace(/,/g, '%2C');
}

function summaryValue(value) {
	return value.replace(/`/g, '\\`');
}

function excerpt(text, index, length) {
	const start = Math.max(0, index - 54);
	const end = Math.min(text.length, index + length + 54);
	return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function renderedMarkdownWarnings($, rel) {
	const found = [];

	for (const element of $('.article-body').toArray()) {
		const article = $(element).clone();
		article.find('pre, code, kbd, samp, script, style, svg').remove();
		const text = article.text();

		for (const pattern of renderedMarkdownPatterns) {
			for (const match of text.matchAll(pattern.regex)) {
				found.push({
					rel,
					message: `${pattern.name} may not have rendered: "${excerpt(text, match.index ?? 0, match[0].length)}"`,
				});
				if (found.length >= 5) break;
			}
			if (found.length >= 5) break;
		}

		const lines = text.split(/\n/);
		for (let index = 0; index < lines.length - 1 && found.length < 5; index += 1) {
			const current = lines[index];
			const next = lines[index + 1];
			const hasTableRow = current.includes('|') && current.split('|').length >= 3;
			const hasSeparator = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(next);
			if (hasTableRow && hasSeparator) {
				found.push({
					rel,
					message: `Markdown table may not have rendered near: "${excerpt(`${current} ${next}`, 0, current.length + next.length)}"`,
				});
			}
		}
	}

	return found;
}

function emitWarnings(items) {
	if (!items.length) return;

	console.warn('\nRendered Markdown warnings (non-blocking):');
	for (const item of items) {
		console.warn(`- ${item.rel}: ${item.message}`);
		if (process.env.GITHUB_ACTIONS === 'true') {
			console.warn(`::warning file=${annotationValue(item.rel)},title=Possible unrendered Markdown::${annotationValue(item.message)}`);
		}
	}

	if (process.env.GITHUB_STEP_SUMMARY) {
		const rows = items
			.map((item) => `- \`${summaryValue(item.rel)}\`: \`${summaryValue(item.message)}\``)
			.join('\n');
		appendFileSync(
			process.env.GITHUB_STEP_SUMMARY,
			`\n## Rendered Markdown Warnings\n\nNon-blocking warnings for article text that may contain Markdown syntax which did not render as intended.\n\n${rows}\n`,
		);
	}
}

async function publishedSourceArticles() {
	const files = (await walk(contentRoot)).filter((file) => /\.(?:md|mdx)$/.test(file));
	const articles = [];

	for (const file of files) {
		const source = await readFile(file, 'utf8');
		const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!match) continue;

		const data = YAML.parse(match[1]) ?? {};
		if (data.draft === true) continue;

		const sourceRel = relative(contentRoot, file).split('\\').join('/');
		const [collection, ...slugParts] = sourceRel.replace(/\.(?:md|mdx)$/, '').split('/');
		const slug = slugParts.join('/');
		if (!collection || !slug || !localizedHtmlLang.has(data.lang)) continue;

		articles.push({ collection, slug, lang: data.lang, title: data.title });
	}

	return articles;
}

async function preservedArticles() {
	if (!existsSync(contentPreservationManifest)) {
		errors.push('Content preservation manifest is missing: docs/content-preservation-manifest.json');
		return [];
	}

	try {
		const manifest = JSON.parse(await readFile(contentPreservationManifest, 'utf8'));
		if (!Array.isArray(manifest.articles)) throw new Error('articles must be an array');
		return manifest.articles;
	} catch (error) {
		errors.push(`Content preservation manifest is invalid: ${error instanceof Error ? error.message : String(error)}`);
		return [];
	}
}

for (const file of requiredFiles) {
	if (!existsSync(join(dist, file))) {
		errors.push(`Required build output is missing: dist/${file}`);
	}
}

const files = await walk(dist);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const file of htmlFiles) {
	const rel = relative(root, file);
	const distRel = relative(dist, file).split('\\').join('/');
	const html = await readFile(file, 'utf8');
	if (html.includes('<title>Page moved | Lens Frontier</title>')) continue;
	const $ = cheerio.load(html);
	const ids = pageIds($);
	const firstSegment = distRel.split('/')[0];

	if (!$('title').text().trim()) {
		errors.push(`Missing page title: ${rel}`);
	}
	if (!$('meta[name="description"]').attr('content')?.trim()) {
		errors.push(`Missing meta description: ${rel}`);
	}
	if (siteUrl) {
		const canonical = $('link[rel="canonical"]').attr('href');
		if (!canonical?.startsWith(new URL(siteBase, siteUrl).toString())) {
			errors.push(`Canonical URL does not match SITE_URL/SITE_BASE: ${rel}`);
		}
	}
	if (localizedHtmlLang.has(firstSegment)) {
		const expectedLang = localizedHtmlLang.get(firstSegment);
		if ($('html').attr('lang') !== expectedLang) {
			errors.push(`Localized page has wrong html lang (${expectedLang} expected): ${rel}`);
		}
		if ($('link[rel="alternate"][hreflang]').length < 2) {
			errors.push(`Localized page should expose zh/en alternate links: ${rel}`);
		}
	}
	if (html.includes('googletagmanager.com/gtm.js') || html.includes('googletagmanager.com/ns.html')) {
		errors.push(`Legacy Google Tag Manager should not be emitted: ${rel}`);
	}
	if (gaMeasurementId) {
		const hasGaScript = html.includes('googletagmanager.com/gtag/js') && html.includes(gaMeasurementId);
		if (!hasGaScript || !html.includes("gtag('config'")) {
			errors.push(`Missing Google Analytics measurement ${gaMeasurementId}: ${rel}`);
		}
	} else if (html.includes('googletagmanager.com/gtag/js') || html.includes("gtag('config'")) {
		errors.push(`Google Analytics should not be emitted without PUBLIC_GA_MEASUREMENT_ID: ${rel}`);
	}
	if (!pageviewEndpoint && (html.includes('lens-frontier:pageview') || html.includes('data-article-views'))) {
		errors.push(`Pageview tracking should not be emitted without PUBLIC_PAGEVIEW_ENDPOINT: ${rel}`);
	}
	warnings.push(...renderedMarkdownWarnings($, rel));

	for (const element of $('a[href], link[href], script[src], img[src]').toArray()) {
		const attr = element.tagName === 'script' || element.tagName === 'img' ? 'src' : 'href';
		const value = $(element).attr(attr)?.trim();
		const label = `${element.tagName}[${attr}]`;

		if (!value) {
			errors.push(`Empty ${label}: ${rel}`);
			continue;
		}
		if (value.endsWith('.md') || unsafeInternalPath.test(value)) {
			errors.push(`Build output links to source-only path: ${value} in ${rel}`);
		}

		const local = parseLocalReference(value, file);
		if (!local) continue;

		const targetFile = localFileFor(local.pathname);
		if (!targetFile || !existsSync(targetFile)) {
			errors.push(`Broken internal ${label}: ${value} in ${rel}`);
			continue;
		}
		if (local.hash && targetFile === file) {
			const id = decodeURIComponent(local.hash.slice(1));
			if (id && !ids.has(id)) {
				errors.push(`Broken same-page anchor: ${value} in ${rel}`);
			}
		}
	}
}

const rss = join(dist, 'rss.xml');
if (existsSync(rss)) {
	const text = await readFile(rss, 'utf8');
	if (!text.includes('<rss') || !text.includes('<channel>')) {
		errors.push('RSS output is not a valid RSS channel: dist/rss.xml');
	}
}

for (const article of await publishedSourceArticles()) {
	const localizedRel = `${article.lang}/blog/${article.slug}/index.html`;
	const previousLocalizedRel = `${article.lang}/${article.collection}/${article.slug}/index.html`;
	const legacyRel = `${article.collection}/${article.slug}/index.html`;
	const localizedFile = join(dist, localizedRel);
	const previousLocalizedFile = join(dist, previousLocalizedRel);
	const legacyFile = join(dist, legacyRel);

	if (!existsSync(localizedFile)) {
		errors.push(`Published source article is missing its localized page: dist/${localizedRel}`);
		continue;
	}
	if (!existsSync(legacyFile)) {
		errors.push(`Published source article is missing its legacy redirect: dist/${legacyRel}`);
	}
	if (!existsSync(previousLocalizedFile)) {
		errors.push(`Published source article is missing its previous localized redirect: dist/${previousLocalizedRel}`);
	}

	const html = await readFile(localizedFile, 'utf8');
	const $ = cheerio.load(html);
	const expectedArticleId = `${article.collection}/${article.slug}`;
	if ($('[data-analytics-article-id]').attr('data-analytics-article-id') !== expectedArticleId) {
		errors.push(`Article analytics id changed for ${localizedRel}; expected ${expectedArticleId}`);
	}

	const localizedRss = join(dist, article.lang, 'rss.xml');
	if (!existsSync(localizedRss)) {
		errors.push(`Localized RSS is missing for article: dist/${localizedRel}`);
		continue;
	}
	const rssText = await readFile(localizedRss, 'utf8');
	const expectedRssPath = `${article.lang}/blog/${article.slug}/`;
	if (!rssText.includes(expectedRssPath)) {
		errors.push(`Published source article is missing from ${article.lang} RSS: ${expectedRssPath}`);
	}
}

for (const article of await preservedArticles()) {
	const source = typeof article.source === 'string' ? article.source : '';
	const route = typeof article.route === 'string' ? article.route : '';
	if (!source || !route || source.startsWith('/') || route.startsWith('/') || source.includes('..') || route.includes('..')) {
		errors.push(`Unsafe preserved article entry: ${JSON.stringify(article)}`);
		continue;
	}
	if (!existsSync(join(contentRoot, source))) {
		errors.push(`Preserved article source is missing: src/content/${source}`);
	}
	if (!existsSync(join(dist, route))) {
		errors.push(`Preserved article route is missing: dist/${route}`);
	}
}

emitWarnings(warnings);

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exit(1);
}

console.log(warnings.length ? `Dist checks passed with ${warnings.length} non-blocking rendered Markdown warning(s).` : 'Dist checks passed.');
