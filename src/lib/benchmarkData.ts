import type { Language } from './site';
import { codeQaCatalog } from '../data/benchmarks/codeQaBench';
import { publishedLeaderboards } from './benchmarkResults';

export type CategoryId =
	| 'code'
	| 'workflows'
	| 'domains'
	| 'multimodal'
	| 'reasoning'
	| 'simulation'
	| 'integrity';

export type AssetStatus = 'released' | 'preview' | 'building' | 'planned';

export interface Leader {
	model: string;
	modelId?: string;
	score: number;
	benchmarkVersion: string;
	protocolVersion: string;
	publishedAt: string;
	sampleSize: number;
	evidence: 'verified' | 'reviewed' | 'pending';
	evidenceDepth: 'full' | 'partial';
	evidenceRef: string;
	ciLow?: number;
	ciHigh?: number;
}

export interface CatalogAsset {
	id: string;
	name: string;
	category: CategoryId;
	status: AssetStatus;
	summary: string;
	capability: string;
	source: string;
	judgeMode: string;
	/** Present only after the corresponding public results pass release review. */
	leaders?: Leader[];
	tags: string[];
}

export const categoryLabelMap: Record<CategoryId, string> = {
	code: 'Code & Repo Agents',
	workflows: 'Agent Workflows',
	domains: 'Professional Domains',
	multimodal: 'Multimodal & Perception',
	reasoning: 'Reasoning & Science',
	simulation: 'Simulation & Games',
	integrity: 'Evaluation Integrity',
};

export const statusLabelMap: Record<AssetStatus, string> = {
	released: 'Released',
	preview: 'Preview',
	building: 'Building',
	planned: 'Planned',
};

/**
 * Only reviewed, intentionally public Bench entries belong here.
 * Unpublished or provisional records must be excluded.
 */
export const publishedBenchmarkCatalog: Record<Language, CatalogAsset[]> = {
	zh: [codeQaCatalog.zh],
	en: [codeQaCatalog.en],
};

export function categoryLabels(lang: Language): Record<CategoryId, string> {
	return lang === 'zh'
		? {
				code: '代码与仓库 Agent',
				workflows: '真实工作流',
				domains: '专业领域',
				multimodal: '多模态理解',
				reasoning: '推理与科学',
				simulation: '仿真与游戏',
				integrity: '评测可信度',
			}
		: categoryLabelMap;
}

export function statusLabels(lang: Language): Record<AssetStatus, string> {
	return lang === 'zh'
		? { released: '已发布', preview: '预览版', building: '建设中', planned: '计划中' }
		: statusLabelMap;
}

export function evidenceLabels(lang: Language): Record<Leader['evidence'], string> {
	return lang === 'zh'
		? { verified: '已验证', reviewed: '已复核', pending: '待复核' }
		: { verified: 'Verified', reviewed: 'Reviewed', pending: 'Pending' };
}

export function benchmarkCatalog(lang: Language): CatalogAsset[] {
	return publishedBenchmarkCatalog[lang].map((asset) => ({
		...asset,
		leaders: publishedLeaderboards[asset.id],
	}));
}

export function catalogByCategory(lang: Language) {
	const catalog = benchmarkCatalog(lang);
	const labels = categoryLabels(lang);
	const order: CategoryId[] = ['code', 'workflows', 'domains', 'multimodal', 'reasoning', 'simulation', 'integrity'];
	return order
		.map((category) => ({
			category,
			label: labels[category],
			assets: catalog.filter((asset) => asset.category === category),
		}))
		.filter((group) => group.assets.length > 0);
}

export function leaderboardAssets(lang: Language) {
	return benchmarkCatalog(lang).filter(
		(asset): asset is CatalogAsset & { leaders: Leader[] } => Boolean(asset.leaders?.length),
	);
}
