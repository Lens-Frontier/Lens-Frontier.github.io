import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const activeBase = normalizeBase(process.env.SITE_BASE ?? '/');
const legacyBase = process.env.LEGACY_SITE_BASE ? normalizeBase(process.env.LEGACY_SITE_BASE) : undefined;
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');

function normalizeBase(base) {
	if (!base || base === '/') return '/';
	const withLeading = base.startsWith('/') ? base : `/${base}`;
	return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

function escapeHtml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

async function walk(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(full)));
		else files.push(full);
	}
	return files;
}

function routeFor(relativeFile) {
	if (relativeFile === 'index.html') return '/';
	if (relativeFile.endsWith('/index.html')) return `/${relativeFile.slice(0, -'index.html'.length)}`;
	return `/${relativeFile}`;
}

function redirectDocument(target) {
	const escapedTarget = escapeHtml(target);
	const canonical = siteUrl ? `${siteUrl}${target}` : target;
	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width" />
		<meta name="robots" content="noindex" />
		<meta name="description" content="This Lens Frontier page has moved to a new address." />
		<meta http-equiv="refresh" content="0; url=${escapedTarget}" />
		<link rel="canonical" href="${escapeHtml(canonical)}" />
		<title>Page moved | Lens Frontier</title>
	</head>
	<body>
		<p>This page has moved to <a href="${escapedTarget}">${escapedTarget}</a>.</p>
		<script>location.replace(${JSON.stringify(target)} + location.search + location.hash);</script>
	</body>
</html>
`;
}

if (!legacyBase || activeBase !== '/' || legacyBase === '/') {
	console.log('Legacy base redirects skipped.');
	process.exit(0);
}

const legacyDirectory = join(dist, legacyBase.slice(1, -1));
const sourceFiles = (await walk(dist)).filter((file) => !file.startsWith(`${legacyDirectory}/`));
let redirects = 0;
let copiedFeeds = 0;

for (const source of sourceFiles) {
	const relativeFile = relative(dist, source).split('\\').join('/');
	const extension = extname(relativeFile);
	const destination = join(legacyDirectory, relativeFile);

	if (existsSync(destination)) continue;

	if (extension === '.html') {
		await mkdir(dirname(destination), { recursive: true });
		await writeFile(destination, redirectDocument(routeFor(relativeFile)), 'utf8');
		redirects += 1;
		continue;
	}

	if (extension === '.xml') {
		await mkdir(dirname(destination), { recursive: true });
		await copyFile(source, destination);
		copiedFeeds += 1;
	}
}

const existingLegacyIndex = join(legacyDirectory, 'index.html');
if (existsSync(existingLegacyIndex)) {
	const existing = await readFile(existingLegacyIndex, 'utf8');
	if (!existing.includes('Page moved | Lens Frontier')) {
		console.log(`Kept existing route at ${legacyBase}; it takes precedence over the historical homepage URL.`);
	}
}

console.log(`Generated ${redirects} legacy redirects and copied ${copiedFeeds} XML feeds under ${legacyBase}.`);
