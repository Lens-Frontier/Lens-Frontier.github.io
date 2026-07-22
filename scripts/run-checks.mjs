import { spawnSync } from 'node:child_process';

const target = process.argv[2] ?? 'all';
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const validTargets = new Set(['all', 'syntax', 'quality']);
const failures = [];
const skipped = [];

if (!validTargets.has(target)) {
	console.error(`Unknown check target: ${target}`);
	console.error(`Expected one of: ${[...validTargets].join(', ')}`);
	process.exit(1);
}

function run(label, command, args) {
	console.log(`\n==> ${label}`);
	console.log(`$ ${[command, ...args].join(' ')}`);

	const result = spawnSync(command, args, {
		stdio: 'inherit',
		env: process.env,
	});

	if (result.error) {
		failures.push(`${label}: ${result.error.message}`);
		return false;
	}

	if (result.signal) {
		failures.push(`${label}: terminated by ${result.signal}`);
		return false;
	}

	if (result.status !== 0) {
		failures.push(`${label}: exited with ${result.status}`);
		return false;
	}

	return true;
}

function runPnpm(label, script) {
	return run(label, pnpm, [script]);
}

function skip(label, reason) {
	skipped.push(`${label}: ${reason}`);
	console.log(`\n==> ${label}`);
	console.log(`Skipped: ${reason}`);
}

function runSyntaxChecks() {
	runPnpm('Astro and TypeScript check', 'check:types');
	runPnpm('Pageview Worker syntax and behavior check', 'check:worker');
}

function runQualityChecks() {
	runPnpm('Markdown lint', 'check:markdown');
	runPnpm('Content rules', 'check:content');
	runPnpm('Benchmark data rules', 'check:bench');
	runPnpm('Sensitive content scan', 'check:sensitive');
	runPnpm('Asset hard limits', 'check:assets');
	runPnpm('Image recommendations', 'images:check');
	runPnpm('Analytics smoke build', 'check:analytics');

	const cleaned = runPnpm('Clean Astro build outputs', 'clean:astro');
	const built = cleaned ? runPnpm('Production build', 'build') : false;
	if (built) {
		runPnpm('Built dist checks', 'check:dist');
	} else {
		skip('Built dist checks', 'production build did not complete');
	}
}

if (target === 'all' || target === 'syntax') {
	runSyntaxChecks();
}

if (target === 'all' || target === 'quality') {
	runQualityChecks();
}

if (skipped.length) {
	console.log('\nSkipped checks:');
	for (const item of skipped) {
		console.log(`- ${item}`);
	}
}

if (failures.length) {
	console.error('\nFailed checks:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log('\nAll requested checks passed.');
