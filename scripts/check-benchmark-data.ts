import { benchmarkCatalog } from '../src/lib/benchmarkData.ts';
import { benchmarkDetailContent, benchmarkEvidenceContent } from '../src/lib/benchmarkDetailData.ts';

const languages = ['zh', 'en'] as const;
const allowedStatuses = new Set(['released', 'preview', 'building', 'planned']);
const allowedEvidence = new Set(['verified', 'reviewed', 'pending']);
const failures: string[] = [];

for (const lang of languages) {
	const catalog = benchmarkCatalog(lang);
	const ids = new Set<string>();

	for (const bench of catalog) {
		if (ids.has(bench.id)) failures.push(`${lang}: duplicate benchmark id ${bench.id}`);
		ids.add(bench.id);

		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bench.id)) failures.push(`${lang}: invalid benchmark id ${bench.id}`);
		if (!allowedStatuses.has(bench.status)) failures.push(`${bench.id}: invalid status ${bench.status}`);
		if (!bench.name.trim() || !bench.summary.trim() || !bench.capability.trim()) failures.push(`${bench.id}: missing required display copy`);

		const models = new Set<string>();
		for (const [index, result] of (bench.leaders ?? []).entries()) {
			if (models.has(result.model)) failures.push(`${bench.id}: duplicate model ${result.model}`);
			models.add(result.model);
			if (!Number.isFinite(result.score) || result.score < 0 || result.score > 100) failures.push(`${bench.id}: score outside 0-100 for ${result.model}`);
			if (!result.benchmarkVersion.trim() || !result.protocolVersion.trim()) failures.push(`${bench.id}: missing benchmark or protocol version for ${result.model}`);
			if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(result.publishedAt)) failures.push(`${bench.id}: invalid publication date for ${result.model}`);
			if (!Number.isInteger(result.sampleSize) || result.sampleSize < 1) failures.push(`${bench.id}: invalid sample size for ${result.model}`);
			if (result.ciLow !== undefined && result.ciLow > result.score) failures.push(`${bench.id}: CI lower bound exceeds score for ${result.model}`);
			if (result.ciHigh !== undefined && result.ciHigh < result.score) failures.push(`${bench.id}: CI upper bound is below score for ${result.model}`);
			if (!result.evidenceRef.trim()) failures.push(`${bench.id}: missing evidence reference for ${result.model}`);
			if (!allowedEvidence.has(result.evidence)) failures.push(`${bench.id}: invalid evidence state for ${result.model}`);
			if (index > 0 && result.score > (bench.leaders?.[index - 1]?.score ?? 100)) failures.push(`${bench.id}: leaderboard is not sorted descending`);
		}

		const detail = benchmarkDetailContent(bench.id, lang);
		if (bench.leaders?.length && !detail.families.length) failures.push(`${bench.id}: public results require task families for ${lang}`);
		const research = benchmarkEvidenceContent(bench.id, lang);
		if (bench.status === 'released' && !research) failures.push(`${bench.id}: released benchmark requires method, evidence, analysis, and version records for ${lang}`);
		if (research) {
			const familyTotal = detail.families.reduce((sum, family) => sum + (family.count ?? 0), 0);
			if (familyTotal !== research.taskTotal) failures.push(`${bench.id}: task family total ${familyTotal} does not match evidence total ${research.taskTotal} for ${lang}`);
			if (!research.method.length || !research.trustRecords.length || !research.sources.length || !research.versions.length) failures.push(`${bench.id}: incomplete method/evidence/source/version records for ${lang}`);
			if (!research.publicDataCard.summary.trim() || !research.publicDataCard.fields.length || !research.publicDataCard.boundary.trim()) failures.push(`${bench.id}: incomplete public Data Card for ${lang}`);
			if (!research.dataset.format.trim() || research.dataset.files < 1) failures.push(`${bench.id}: invalid dataset format or file count for ${lang}`);
			if (!research.dataset.downloads.length || !research.dataset.downloads.some((item) => item.primary)) failures.push(`${bench.id}: dataset requires downloads and one primary snapshot for ${lang}`);
			if (!research.dataset.schema.length) failures.push(`${bench.id}: dataset schema is empty for ${lang}`);
			if (!research.dataset.reproduction.length) failures.push(`${bench.id}: reproduction steps are empty for ${lang}`);
			const schemaNames = new Set<string>();
			for (const field of research.dataset.schema) {
				if (schemaNames.has(field.name)) failures.push(`${bench.id}: duplicate dataset field ${field.name} for ${lang}`);
				schemaNames.add(field.name);
				if (!field.name.trim() || !field.type.trim() || !field.description.trim()) failures.push(`${bench.id}: incomplete dataset schema field for ${lang}`);
			}
			for (const resource of research.dataset.downloads) {
				if (!resource.label.trim() || !resource.description.trim() || !resource.format.trim()) failures.push(`${bench.id}: incomplete dataset download record for ${lang}`);
				try { new URL(resource.href); } catch { failures.push(`${bench.id}: invalid dataset download URL for ${lang}`); }
			}
			for (const step of research.dataset.reproduction) {
				if (!step.title.trim() || !step.description.trim() || !step.command.trim()) failures.push(`${bench.id}: incomplete reproduction step for ${lang}`);
			}
			for (const row of research.conditionScores) {
				for (const key of ['closedBook', 'codeOnly', 'documented'] as const) {
					const score = row[key];
					const [low, high] = row.confidenceIntervals[key];
					if (score < 0 || score > 100 || low > score || high < score) failures.push(`${bench.id}: invalid ${row.taskSet}/${row.model}/${key} score or CI`);
				}
			}
		}
	}
}

const zhIds = benchmarkCatalog('zh').map((bench) => bench.id);
const enIds = benchmarkCatalog('en').map((bench) => bench.id);
if (zhIds.join('\n') !== enIds.join('\n')) failures.push('Chinese and English benchmark catalogs do not expose the same ids in the same order');

if (failures.length) {
	console.error('Benchmark data checks failed:');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(`Benchmark data checks passed (${zhIds.length} catalog entries).`);
