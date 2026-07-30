import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import YAML from 'yaml';

const root = process.cwd();
const collections = ['papers', 'benchmarks', 'opinions'];
const tagPattern = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/;
const languagePattern = /^(zh|en)$/;
const translationKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const markdownImagePattern = /!\[([^\]\n]*)\]\(([^)\n]+)\)/g;
const htmlImagePattern = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
const remotePattern = /^(?:https?:|mailto:|#)/i;
const seenTranslationKeys = new Map();

async function filesIn(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	return entries.filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name)).map((entry) => entry.name);
}

function parseFrontmatter(text, file) {
	if (!text.startsWith('---\n')) {
		throw new Error(`${file} must start with YAML frontmatter.`);
	}

	const end = text.indexOf('\n---', 4);
	if (end === -1) {
		throw new Error(`${file} has no closing frontmatter marker.`);
	}

	return {
		data: YAML.parse(text.slice(4, end)) ?? {},
		body: text.slice(end + 4).trim(),
		bodyRaw: text.slice(end + 4),
		bodyStartLine: text.slice(0, end + 4).split('\n').length,
	};
}

function cleanImageTarget(value) {
	return value.trim().replace(/^<|>$/g, '').split(/\s+/)[0].split(/[?#]/)[0];
}

function articleImages(text) {
	const images = [...text.matchAll(markdownImagePattern)].map((match) => ({
		alt: match[1].trim(),
		target: cleanImageTarget(match[2]),
	}));
	for (const match of text.matchAll(htmlImagePattern)) {
		const tag = match[0];
		const alt = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
		images.push({
			alt: (alt?.[1] ?? alt?.[2] ?? '').trim(),
			target: cleanImageTarget(match[1] ?? match[2] ?? match[3] ?? ''),
		});
	}
	return images.filter((image) => image.target);
}

function hasMeaningfulImageAlt(alt) {
	if (alt.length < 5) return false;
	return !/^(?:image|photo|picture|figure|图|图片|照片|配图)$/i.test(alt);
}

function dateTime(value) {
	const date = value instanceof Date ? value : new Date(value);
	const time = date.getTime();
	return Number.isFinite(time) ? time : null;
}

function chineseQuoteErrors(text, startLine, file) {
	const quoteErrors = [];
	let inFence = false;
	let openQuoteLine = 0;

	for (const [index, line] of text.split('\n').entries()) {
		const lineNumber = startLine + index;
		if (/^ {0,3}(?:```|~~~)/.test(line)) {
			inFence = !inFence;
			continue;
		}
		if (inFence) continue;

		let reportedLine = false;
		const reportLine = (message) => {
			if (reportedLine) return;
			quoteErrors.push(message);
			reportedLine = true;
		};

		for (const char of line) {
			if (char === '“') {
				if (openQuoteLine) {
					reportLine(
						`Chinese quote opened before closing previous quote: ${file}:${lineNumber}. Use paired “...” quotes.`,
					);
				}
				openQuoteLine = lineNumber;
			} else if (char === '”') {
				if (!openQuoteLine) {
					reportLine(
						`Chinese quote closes before it opens: ${file}:${lineNumber}. Use “ for opening and ” for closing.`,
					);
				} else {
					openQuoteLine = 0;
				}
			}
		}
	}

	if (openQuoteLine) {
		quoteErrors.push(`Chinese quote opened but never closed: ${file}:${openQuoteLine}. Use paired “...” quotes.`);
	}

	return quoteErrors;
}

const errors = [];

for (const collection of collections) {
	const contentDir = join(root, 'src', 'content', collection);
	for (const filename of await filesIn(contentDir)) {
		const slug = filename.replace(/\.(md|mdx)$/, '');
		const file = join(contentDir, filename);
		const relFile = relative(root, file);
		const text = await readFile(file, 'utf8');
		let parsed;

		try {
			parsed = parseFrontmatter(text, relFile);
		} catch (error) {
			errors.push(error.message);
			continue;
		}

		const { data, body, bodyRaw, bodyStartLine } = parsed;
		if (!Object.hasOwn(data, 'lang')) {
			errors.push(`Article must declare lang: "zh" or "en": ${relFile}`);
		} else if (typeof data.lang !== 'string' || !languagePattern.test(data.lang)) {
			errors.push(`Article lang must be "zh" or "en": ${relFile}`);
		}
		if (
			Object.hasOwn(data, 'translationKey') &&
			(typeof data.translationKey !== 'string' || !translationKeyPattern.test(data.translationKey))
		) {
			errors.push(`translationKey must use lowercase kebab-case: ${relFile}`);
		}
		if (typeof data.translationKey === 'string' && typeof data.lang === 'string') {
			const key = `${collection}:${data.translationKey}:${data.lang}`;
			const previous = seenTranslationKeys.get(key);
			if (previous) {
				errors.push(`Duplicate translationKey for ${data.lang}: ${relFile} and ${previous}`);
			} else {
				seenTranslationKeys.set(key, relFile);
			}
		}
		if (!body) {
			errors.push(`Article body is empty: ${relFile}`);
		}
		if (!/^##\s+\S/m.test(body)) {
			errors.push(`Article should include at least one level-2 section heading: ${relFile}`);
		}
		errors.push(...chineseQuoteErrors(bodyRaw, bodyStartLine, relFile));
		if (typeof data.title === 'string' && data.title.trim().length > 80) {
			errors.push(`Title is too long (${data.title.trim().length} chars > 80): ${relFile}`);
		}
		if (typeof data.summary === 'string') {
			const length = data.summary.trim().length;
			if (length < 12 || length > 220) {
				errors.push(`Summary should be 12-220 chars (${length} chars): ${relFile}`);
			}
		}
		if (Object.hasOwn(data, 'updated')) {
			const publishedAt = dateTime(data.date);
			const updatedAt = dateTime(data.updated);
			if (updatedAt === null) {
				errors.push(`updated must be a valid date: ${relFile}`);
			} else if (publishedAt !== null && updatedAt < publishedAt) {
				errors.push(`updated should not be earlier than date: ${relFile}`);
			}
		}
		if (Array.isArray(data.tags)) {
			for (const tag of data.tags) {
				if (typeof tag !== 'string' || !tagPattern.test(tag)) {
					errors.push(`Tag must use lowercase kebab-case or dotted form: ${tag} in ${relFile}`);
				}
			}
		}

		const expectedAssetDir = resolve(root, 'src', 'assets', 'posts', collection, slug);
		for (const { target, alt } of articleImages(text)) {
			if (!hasMeaningfulImageAlt(alt)) {
				errors.push(`Article image needs a descriptive alt text (not a generic label): ${target} in ${relFile}`);
			}
			if (remotePattern.test(target)) continue;
			if (target.startsWith('/')) {
				errors.push(`Article image should use a relative path, not an absolute path: ${target} in ${relFile}`);
				continue;
			}

			const resolved = resolve(dirname(file), decodeURIComponent(target));
			if (!existsSync(resolved)) {
				errors.push(`Article image does not exist: ${target} in ${relFile}`);
				continue;
			}
			if (!resolved.startsWith(`${expectedAssetDir}/`)) {
				errors.push(
					`Article image should live under src/assets/posts/${collection}/${slug}/: ${target} in ${relFile}`,
				);
			}
		}
	}
}

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exit(1);
}

console.log('Content checks passed.');
