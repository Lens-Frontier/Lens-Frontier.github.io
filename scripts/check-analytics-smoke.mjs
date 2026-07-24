import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const smokeSlug = 'analytics-smoke';
const smokeTranslationSlug = 'analytics-smoke-en';
const smokeFile = join(root, 'src', 'content', 'opinions', `${smokeSlug}.md`);
const smokeTranslationFile = join(root, 'src', 'content', 'opinions', `${smokeTranslationSlug}.md`);
const smokeOutput = join(root, 'dist', 'zh', 'blog', smokeSlug, 'index.html');
const smokeTranslationOutput = join(root, 'dist', 'en', 'blog', smokeTranslationSlug, 'index.html');
const analyticsEnv = {
	PUBLIC_GA_MEASUREMENT_ID: 'G-ZK42116ZXB',
	PUBLIC_PAGEVIEW_ENDPOINT: 'https://example.test/pageview',
	PUBLIC_PAGEVIEW_COUNT_ENDPOINT: 'https://example.test/views',
	PUBLIC_PAGEVIEW_SITE_ID: 'lens-frontier',
};

const smokeArticle = `---
title: "Analytics Smoke"
lang: "zh"
translationKey: "analytics-smoke"
date: 2026-05-21
summary: "Temporary article used only by CI to verify analytics output."
authors:
  - github: "mattheliu"
stance: "Temporary smoke test."
tags: ["evaluation"]
---

## Smoke

This temporary article is created by CI and removed before the final production build.

| Metric | What It Means | Caveat |
| --- | --- | --- |
| Win rate | Pairwise preference | Sensitive to prompt mix |
| Pass rate | Task completion | Can hide partial failures |

> A short quote used to verify blockquote rendering.

![Smoke figure](data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22320%22%20height=%22180%22%3E%3Crect%20width=%22320%22%20height=%22180%22%20fill=%22%23ede8dc%22/%3E%3C/svg%3E)

- Evidence
- Limit

1. Build
2. Inspect

\`inline code\`

\`\`\`txt
model: example
score: 0.73
\`\`\`

---
`;

const smokeTranslation = `---
title: "Analytics Smoke EN"
lang: "en"
translationKey: "analytics-smoke"
date: 2026-05-21
summary: "Temporary English article used only by CI to verify translated language switching."
authors:
  - github: "mattheliu"
stance: "Temporary smoke test."
tags: ["evaluation"]
---

## Smoke

This temporary article is created by CI and removed before the final production build.
`;

function run(command, args, env = {}) {
	const result = spawnSync(command, args, {
		cwd: root,
		env: { ...process.env, ...env },
		stdio: 'inherit',
	});

	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
	}
}

function assertIncludes(html, needle, label) {
	if (!html.includes(needle)) {
		throw new Error(`Smoke article is missing ${label}: ${needle}`);
	}
}

function assertNotIncludes(html, needle, label) {
	if (html.includes(needle)) {
		throw new Error(`Smoke article should not include ${label}: ${needle}`);
	}
}

if (existsSync(smokeFile)) {
	throw new Error(`Refusing to overwrite existing smoke file: ${smokeFile}`);
}

if (existsSync(smokeTranslationFile)) {
	throw new Error(`Refusing to overwrite existing smoke file: ${smokeTranslationFile}`);
}

try {
	await mkdir(join(root, 'src', 'content', 'opinions'), { recursive: true });
	await writeFile(smokeFile, smokeArticle);
	await writeFile(smokeTranslationFile, smokeTranslation);

	run('pnpm', ['clean:astro']);
	run('pnpm', ['build'], analyticsEnv);

	const html = await readFile(smokeOutput, 'utf8');
	const translationHtml = await readFile(smokeTranslationOutput, 'utf8');
	assertIncludes(html, 'googletagmanager.com/gtag/js', 'Google Analytics script');
	assertIncludes(html, 'G-ZK42116ZXB', 'Google Analytics measurement id');
	assertIncludes(html, "gtag('config'", 'Google Analytics config call');
	assertIncludes(html, 'data-article-views', 'article read-count markup');
	assertIncludes(html, 'data-view-count', 'article read-count value target');
	assertIncludes(html, 'https://example.test/views', 'pageview count endpoint');
	assertIncludes(html, 'https://example.test/pageview', 'pageview event endpoint');
	assertIncludes(html, 'opinions/analytics-smoke', 'article id');
	assertNotIncludes(html, 'lens-frontier:pageview:v2:', 'client-side pageview dedupe key');
	assertIncludes(html, 'lens-frontier:pageview-recorded', 'pageview refresh event');
	assertIncludes(html, '__lensFrontierRecordedPageviews', 'recorded pageview marker');
	assertIncludes(html, 'renderViewCount', 'direct read-count update');
	assertIncludes(html, 'refreshRequestId', 'stale read-count request guard');
	assertIncludes(html, 'lf_article_scroll_depth', 'article scroll-depth analytics event');
	assertIncludes(html, 'lf_article_engaged_read', 'article engaged-read analytics event');
	assertIncludes(html, 'lf_content_discovery', 'content discovery analytics event');
	assertIncludes(html, 'lf_article_resource_click', 'article resource analytics event');
	assertIncludes(html, 'lf_article_image_open', 'article image-open analytics event');
	assertIncludes(html, 'lf_language_switch', 'language switch analytics event');
	assertIncludes(html, '<table>', 'Markdown table rendering');
	assertIncludes(html, '<thead>', 'Markdown table header rendering');
	assertIncludes(html, '<blockquote>', 'Markdown blockquote rendering');
	assertIncludes(html, '<pre', 'Markdown fenced code rendering');
	assertIncludes(html, '<hr', 'Markdown thematic break rendering');
	assertIncludes(html, '/en/blog/analytics-smoke-en/', 'translated English language switch path');
	assertIncludes(translationHtml, '/zh/blog/analytics-smoke/', 'translated Chinese language switch path');
	assertIncludes(html, 'data-image-lightbox', 'article image lightbox markup');
	assertIncludes(html, 'lightboxTrigger', 'article image lightbox script');

	run('pnpm', ['check:dist'], analyticsEnv);
} finally {
	await rm(smokeFile, { force: true });
	await rm(smokeTranslationFile, { force: true });
}

console.log('Analytics smoke checks passed.');
