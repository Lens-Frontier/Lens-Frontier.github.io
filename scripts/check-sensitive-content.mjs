import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ignoredBinaryExts = new Set([
	'.avif',
	'.gif',
	'.ico',
	'.jpeg',
	'.jpg',
	'.pdf',
	'.png',
	'.webp',
	'.woff',
	'.woff2',
]);

const sensitiveFilePatterns = [
	{
		name: 'environment file',
		test: (file) => /(^|\/)\.env(?:\..*)?$/.test(file) && !/(^|\/)\.env\.(example|sample|template)$/.test(file),
	},
	{
		name: 'Cloudflare local vars file',
		test: (file) => /(^|\/)\.dev\.vars(?:\..*)?$/.test(file),
	},
	{
		name: 'private key or certificate bundle',
		test: (file) => /\.(pem|key|p12|pfx)$/i.test(file),
	},
	{
		name: 'private working document',
		test: (file) =>
			/(^|\/)(?:internal|private|confidential)(?:[-_.\/]|$)/i.test(file) ||
			/(^|\/)[^/]*(?:intake|handoff|working-notes)[^/]*$/i.test(file),
	},
];

const contentPatterns = [
	{
		name: 'private key block',
		regex: /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/g,
	},
	{
		name: 'GitHub token',
		regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b/g,
	},
	{
		name: 'GitHub fine-grained token',
		regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
	},
	{
		name: 'AWS access key',
		regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
	},
	{
		name: 'Google API key',
		regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
	},
	{
		name: 'OpenAI API key',
		regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
	},
	{
		name: 'Anthropic API key',
		regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
	},
	{
		name: 'Slack token',
		regex: /\bxox(?:[abprs]|c)-[A-Za-z0-9-]{20,}\b/g,
	},
	{
		name: 'internal-looking host',
		regex: /\b(?:https?:\/\/)?(?:[A-Za-z0-9-]+\.)*(?:[A-Za-z0-9-]+-int|internal|intranet|corp)(?:\.[A-Za-z0-9-]+)+(?:[/?#][^\s`'"<>]*)?/gi,
	},
	{
		name: 'local user path',
		regex: /(?:\/Users\/[^/\s]+|\/home\/[^/\s]+|[A-Z]:\\Users\\[^\\\s]+)(?:[/\\][^\s`'"<>]*)?/g,
	},
];

function extname(file) {
	const index = file.lastIndexOf('.');
	return index === -1 ? '' : file.slice(index).toLowerCase();
}

function isBinary(buffer) {
	return buffer.includes(0);
}

function lineColumn(text, index) {
	const prefix = text.slice(0, index);
	const lines = prefix.split('\n');
	return { line: lines.length, column: lines.at(-1).length + 1 };
}

const { stdout } = await execFileAsync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
	maxBuffer: 20 * 1024 * 1024,
});
const files = stdout.split('\0').filter(Boolean);
const errors = [];

for (const file of files) {
	if (!existsSync(file)) continue;

	for (const rule of sensitiveFilePatterns) {
		if (rule.test(file)) {
			errors.push(`${file}: sensitive file type should not be committed (${rule.name})`);
		}
	}

	if (ignoredBinaryExts.has(extname(file))) continue;

	let buffer;
	try {
		buffer = await readFile(file);
	} catch (error) {
		if (error.code === 'ENOENT') continue;
		throw error;
	}
	if (isBinary(buffer)) continue;

	const text = buffer.toString('utf8');
	for (const rule of contentPatterns) {
		rule.regex.lastIndex = 0;
		for (const match of text.matchAll(rule.regex)) {
			const { line, column } = lineColumn(text, match.index ?? 0);
			errors.push(`${file}:${line}:${column}: ${rule.name}`);
		}
	}
}

if (errors.length) {
	console.error(errors.map((error) => `- ${error}`).join('\n'));
	process.exit(1);
}

console.log('Sensitive content checks passed.');
