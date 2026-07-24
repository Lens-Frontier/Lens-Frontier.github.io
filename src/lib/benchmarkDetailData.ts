import type { Language } from './site';
import { codeQaDetails, codeQaEvidence } from '../data/benchmarks/codeQaBench';

export interface TaskFamily {
	title: string;
	description: string;
	count?: number;
}

export interface TaskContextItem {
	label: string;
	value: string;
}

export interface TaskSpecimen {
	title: string;
	capability: string;
	context: TaskContextItem[];
	input: string;
	assertions: string[];
	expected?: string[];
	repository?: {
		name: string;
		commit: string;
		language: string;
		fileCount: number;
		tree: string[];
	};
}

export interface BenchmarkDetailContent {
	families: TaskFamily[];
	specimens: TaskSpecimen[];
}

export interface ConditionScoreRow {
	model: string;
	taskSet: 'code-derivable' | 'doc-dependent';
	taskCount: number;
	closedBook: number;
	codeOnly: number;
	documented: number;
	confidenceIntervals: {
		closedBook: [number, number];
		codeOnly: [number, number];
		documented: [number, number];
	};
}

export interface CategoryScoreRow {
	category: string;
	closedBook: number;
	codeOnly: number;
	documented: number;
}

export interface VersionRecord {
	version: string;
	date: string;
	note: string;
}

export interface MethodRecord {
	title: string;
	description: string;
}

export interface TrustRecord {
	title: string;
	state: string;
	description: string;
}

export interface SourceRecord {
	label: string;
	href: string;
	role?: 'primary' | 'technical';
}

export interface PublicDataCardField {
	label: string;
	value: string;
	note?: string;
}

export interface PublicDataCard {
	summary: string;
	status: string;
	statusTone?: 'verified' | 'limited';
	fields: PublicDataCardField[];
	boundary: string;
}

export interface DatasetDownload {
	label: string;
	description: string;
	href: string;
	format: string;
	size?: string;
	primary?: boolean;
}

export interface DatasetSchemaField {
	name: string;
	type: string;
	required: boolean;
	description: string;
}

export interface ReproductionStep {
	title: string;
	description: string;
	command: string;
}

export interface DatasetResource {
	format: string;
	files: number;
	downloads: DatasetDownload[];
	schema: DatasetSchemaField[];
	reproduction: ReproductionStep[];
}

export interface BenchmarkEvidenceContent {
	taskTotal: number;
	conditionScores: ConditionScoreRow[];
	categoryScores: CategoryScoreRow[];
	findings: string[];
	limitations: string[];
	method: MethodRecord[];
	trustRecords: TrustRecord[];
	sources: SourceRecord[];
	versions: VersionRecord[];
	publicDataCard: PublicDataCard;
	dataset: DatasetResource;
	technicalRecord: Record<string, string | number>;
}

/**
 * Add only publication-approved Task and Evidence records backed by public sources.
 * Missing entries intentionally render as pending instead of synthetic content.
 */
const publishedDetails: Partial<Record<string, Record<Language, BenchmarkDetailContent>>> = {
	'code-qa-bench': codeQaDetails,
};
const publishedEvidence: Partial<Record<string, Record<Language, BenchmarkEvidenceContent>>> = {
	'code-qa-bench': codeQaEvidence,
};

export function benchmarkDetailContent(id: string, lang: Language): BenchmarkDetailContent {
	return publishedDetails[id]?.[lang] ?? { families: [], specimens: [] };
}

export function benchmarkEvidenceContent(id: string, lang: Language): BenchmarkEvidenceContent | null {
	return publishedEvidence[id]?.[lang] ?? null;
}
