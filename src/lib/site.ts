export const languages = ['zh', 'en'] as const;
export type Language = (typeof languages)[number];

export const defaultLanguage: Language = 'zh';
export const repositoryUrl = import.meta.env.PUBLIC_REPOSITORY_URL ?? 'https://github.com/Lens-Frontier/blog';

export const sites: Record<Language, { title: string; description: string; htmlLang: string; locale: string }> = {
	zh: {
		title: 'Lens Frontier',
		description: '把真实任务、验证协议和评测证据沉淀成可追溯的数据产品。',
		htmlLang: 'zh-CN',
		locale: 'zh-CN',
	},
	en: {
		title: 'Lens Frontier',
		description: 'A traceable data platform for real tasks, validation protocols, and evaluation evidence.',
		htmlLang: 'en',
		locale: 'en-US',
	},
};

export const site = sites[defaultLanguage];

export const ui = {
	zh: {
		brandTagline: '评测数据平台',
		nav: {
			leaderboard: '榜单',
			dataCards: 'Data Cards',
			benchmarks: 'Benchmarks',
			insights: 'Insights',
			blog: '博客',
			about: '关于',
		},
		footer: {
			line: '可追溯任务、验证协议与证据包。',
			timeline: '时间线',
			about: '关于',
			rss: 'RSS',
			github: 'GitHub',
		},
		collectionLabels: {
			papers: '论文',
			benchmarks: '评测方法',
			opinions: '洞察',
		},
		home: {
			eyebrow: 'evaluation data platform',
			title: '让模型能力评测，变成可追溯的数据产品。',
			description:
				'Lens Frontier 把真实任务、验证协议、judge 依据和评测证据沉淀成可复现的 Data Card，服务模型能力评估、研究复盘和复杂 benchmark 建设。',
			channels: '频道',
			latest: '最新内容',
			timeline: '时间线',
			emptyTitle: '暂无内容。',
			emptyBody: '第一篇研究论文、方法文章或 benchmark 分析会出现在这里。',
			scopeTitle: 'Editorial Scope',
			scopeBody:
				'这里发布 Lens Frontier 的研究成果、评测方法和模型分析。文章不需要给出终局结论，但必须说明证据、版本和适用边界。',
			styleTitle: 'House Style',
			styleBody: '主要围绕 benchmark 和 evaluation：结论可以保留，证据必须充分；少一点榜单口号，多一点方法、版本和上下文。',
		},
		channels: {
			papers: {
				label: '研究论文',
				description: 'Lens Frontier 团队发表的论文与预印本。',
			},
			opinions: {
				label: '洞察',
				description: '围绕模型评测、数据与真实任务的分析。',
			},
			benchmarks: {
				label: '评测方法',
				description: '评测设计、数据构建、验证机制和 judge 方案。',
			},
		},
		pages: {
			papers: {
				title: '论文',
				description: 'Lens Frontier 发布的论文、预印本与研究成果。',
				eyebrow: '研究成果',
				body: '发布我们在评测数据、Benchmark 设计和模型能力分析上的论文与预印本，并同步说明研究问题、方法、实验、限制和相关资源。',
				emptyTitle: '论文正在准备中。',
				emptyBody: '首篇公开论文将在发布后出现在这里。',
			},
			benchmarks: {
				title: '评测方法',
				description: '评测设计、数据构建、验证机制与 judge 方法。',
				eyebrow: '方法与协议',
				body: '说明评测问题如何被转化为任务、数据、指标和验证机制，并保留方法的适用边界、风险与版本。',
				emptyTitle: '暂无评测方法。',
				emptyBody: '第一篇评测方法将在发布后出现在这里。',
			},
			opinions: {
				title: '洞察',
				description: '围绕 benchmark、评测数据和模型能力的分析与判断。',
				eyebrow: '研究分析',
				body: '分析 benchmark、evaluation 和真实任务之间的差距。结论可以保留，但需要把事实、推断和不确定性分开。',
				emptyTitle: '暂无评测洞察。',
				emptyBody: '第一篇评测洞察会出现在这里。',
			},
			timeline: {
				title: '时间线',
				description: '全部论文、方法文章和 benchmark 分析的发布时间线。',
				eyebrow: '全部内容',
				body: '按时间汇总 Lens Frontier 的论文、评测方法、数据集版本和模型分析，保留每项研究成果的发布与修订脉络。',
				emptyTitle: '暂无内容。',
				emptyBody: '第一项研究成果将在发布后出现在这里。',
			},
			blog: {
				title: '博客',
				description: '研究论文、评测方法、版本更新和模型洞察。',
				eyebrow: '研究发布',
				body: 'Blog 汇集 Lens Frontier 的论文、方法文章、数据集版本与模型分析；主页继续聚焦榜单和 Benchmark 数据产品。',
				emptyTitle: '暂无内容。',
				emptyBody: '第一项研究发布将在这里出现。',
			},
			tags: {
				title: '标签',
				description: '主题标签索引。',
				eyebrow: '主题索引',
				body: '用标签连接论文、评测方法、数据集版本和模型分析。',
				emptyTitle: '暂无标签。',
				emptyBody: '发布第一篇内容后，标签索引会自动出现。',
				tagDescription: (tag: string) => `标签 ${tag} 下的内容。`,
				relatedCount: (count: number) => `${count} 篇相关内容。`,
			},
			about: {
				title: '关于',
				description: '关于 Lens Frontier。',
				eyebrow: '关于',
				dek: 'Lens Frontier 聚焦 frontier AI systems 的独立评测研究与可验证数据实践。',
				paragraphs: [
					'我们构建真实任务 Benchmark、运行模型评测，并把任务定义、协议版本、judge 依据和运行证据组织成可复核的 Data Card。榜单负责展示能力差异，证据链负责解释每个分数为何成立。',
					'我们发布自己的研究论文、评测方法、数据集版本和模型分析。所有公开结论尽量保留来源、实验设置、限制与不确定性，让研究成果可以被复现、质疑和继续使用。',
				],
			},
		},
		article: {
			views: '阅读',
			viewsLoading: '读取中',
			paper: '论文',
			code: '代码',
			spec: {
				date: '日期',
				updated: '更新',
				paperAuthors: '论文作者',
				venue: '发表位置',
				benchmarks: '基准评测',
				tasks: '任务',
				status: '状态',
				area: '领域',
				metric: '指标',
				version: '版本',
				risk: '风险',
				stance: '立场',
			},
			paperStatuses: {
				working: '工作论文',
				preprint: '预印本',
				accepted: '已接收',
				published: '已发表',
			},
		},
		languageNames: {
			zh: '中文',
			en: 'EN',
		},
	},
	en: {
		brandTagline: 'evaluation data platform',
		nav: {
			leaderboard: 'Leaderboard',
			dataCards: 'Data Cards',
			benchmarks: 'Benchmarks',
			insights: 'Insights',
			blog: 'Blog',
			about: 'About',
		},
		footer: {
			line: 'Traceable tasks, protocols, and evidence packs.',
			timeline: 'Timeline',
			about: 'About',
			rss: 'RSS',
			github: 'GitHub',
		},
		collectionLabels: {
			papers: 'Paper',
			benchmarks: 'Method',
			opinions: 'Insight',
		},
		home: {
			eyebrow: 'evaluation data platform',
			title: 'Turn model evaluation into a traceable data product.',
			description:
				'Lens Frontier turns real tasks, validation protocols, judge evidence, and evaluation records into reproducible Data Cards for model assessment, research review, and benchmark construction.',
			channels: 'Channels',
			latest: 'Latest Writing',
			timeline: 'timeline',
			emptyTitle: 'No publications yet.',
			emptyBody: 'The first research paper, method article, or benchmark analysis will appear here.',
			scopeTitle: 'Editorial Scope',
			scopeBody:
				'We publish Lens Frontier research, evaluation methods, and model analysis. An article does not need the final word, but it must show its evidence, version, and scope.',
			styleTitle: 'House Style',
			styleBody:
				'Mostly about benchmarks and evaluation: less leaderboard theater, more task context, evidence, and boundary conditions.',
		},
		channels: {
			papers: {
				label: 'Research Papers',
				description: 'Papers and preprints published by Lens Frontier.',
			},
			opinions: {
				label: 'Insights',
				description: 'Analysis of model evaluation, data, and real tasks.',
			},
			benchmarks: {
				label: 'Methods',
				description: 'Evaluation design, data construction, verification, and judge methodology.',
			},
		},
		pages: {
			papers: {
				title: 'Papers',
				description: 'Papers, preprints, and research outputs published by Lens Frontier.',
				eyebrow: 'research outputs',
				body: 'Our papers and preprints on evaluation data, benchmark design, and model capability, with the research question, method, experiments, limitations, and related resources made explicit.',
				emptyTitle: 'Papers are in preparation.',
				emptyBody: 'Our first public paper will appear here after release.',
			},
			benchmarks: {
				title: 'Evaluation Methods',
				description: 'Evaluation design, data construction, verification, and judge methodology.',
				eyebrow: 'methods and protocols',
				body: 'How evaluation questions become tasks, data, metrics, and verification mechanisms, with scope, risks, and versions made explicit.',
				emptyTitle: 'No evaluation methods yet.',
				emptyBody: 'The first evaluation method will appear here after publication.',
			},
			opinions: {
				title: 'Insights',
				description: 'Analysis and judgment around benchmarks, evaluation data, and model capability.',
				eyebrow: 'research analysis',
				body: 'Analysis of the gap between benchmarks, evaluation, and real tasks. Conclusions may remain provisional, but facts, inference, and uncertainty stay separated.',
				emptyTitle: 'No opinions yet.',
				emptyBody: 'The first opinion piece will appear here.',
			},
			timeline: {
				title: 'Timeline',
				description: 'All papers, method articles, and benchmark analyses in publication order.',
				eyebrow: 'all writing',
				body: 'A time-ordered view of Lens Frontier papers, evaluation methods, dataset versions, and model analyses, preserving the release and revision history of each research output.',
				emptyTitle: 'No writing yet.',
				emptyBody: 'The first research output will appear here after publication.',
			},
			blog: {
				title: 'Blog',
				description: 'Research papers, evaluation methods, release notes, and model insights.',
				eyebrow: 'research publications',
				body: 'The Blog gathers Lens Frontier papers, method articles, dataset releases, and model analyses while the homepage stays focused on leaderboards and benchmark data products.',
				emptyTitle: 'No writing yet.',
				emptyBody: 'The first research publication will appear here.',
			},
			tags: {
				title: 'Tags',
				description: 'Topic index.',
				eyebrow: 'index terms',
				body: 'Tags connect papers, evaluation methods, dataset releases, and model analyses.',
				emptyTitle: 'No tags yet.',
				emptyBody: 'The tag index will appear after the first article is published.',
				tagDescription: (tag: string) => `Content tagged ${tag}.`,
				relatedCount: (count: number) => `${count} related ${count === 1 ? 'piece' : 'pieces'}.`,
			},
			about: {
				title: 'About',
				description: 'About Lens Frontier.',
				eyebrow: 'about',
				dek: 'Lens Frontier develops independent evaluations and verifiable data practices for frontier AI systems.',
				paragraphs: [
					'We build real-task benchmarks, run model evaluations, and organize task definitions, protocol versions, judge rationale, and run evidence into reviewable Data Cards. Leaderboards show capability differences; the evidence chain explains why each score holds.',
					'We publish our own papers, evaluation methods, dataset releases, and model analyses. Public claims retain their sources, experimental settings, limits, and uncertainty so the work can be reproduced, challenged, and reused.',
				],
			},
		},
		article: {
			views: 'Views',
			viewsLoading: 'Loading',
			paper: 'Paper',
			code: 'Code',
			spec: {
				date: 'Date',
				updated: 'Updated',
				paperAuthors: 'Paper Authors',
				venue: 'Venue',
				benchmarks: 'Benchmarks',
				tasks: 'Tasks',
				status: 'Status',
				area: 'Area',
				metric: 'Metric',
				version: 'Version',
				risk: 'Risk',
				stance: 'Stance',
			},
			paperStatuses: {
				working: 'Working paper',
				preprint: 'Preprint',
				accepted: 'Accepted',
				published: 'Published',
			},
		},
		languageNames: {
			zh: '中文',
			en: 'EN',
		},
	},
} as const;

export function isLanguage(value: unknown): value is Language {
	return typeof value === 'string' && languages.includes(value as Language);
}

export function languageFrom(value: unknown): Language {
	return isLanguage(value) ? value : defaultLanguage;
}

export function siteFor(lang: Language) {
	return sites[lang];
}

export function path(input = '/') {
	const base = import.meta.env.BASE_URL || '/';
	const normalizedBase = base.endsWith('/') ? base : `${base}/`;
	const normalizedInput = input.replace(/^\/+/, '');
	return input === '/' ? normalizedBase : `${normalizedBase}${normalizedInput}`;
}

export function localizedPath(lang: Language, input = '/') {
	const normalizedInput = input.startsWith('/') ? input : `/${input}`;
	return path(`/${lang}${normalizedInput === '/' ? '/' : normalizedInput}`);
}

export function formatDate(date: Date, lang: Language = defaultLanguage) {
	return new Intl.DateTimeFormat(sites[lang].locale, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
	return b.data.date.getTime() - a.data.date.getTime();
}

export function tagPath(tag: string, lang: Language = defaultLanguage) {
	return localizedPath(lang, `/blog/tags/${encodeURIComponent(tag)}/`);
}

export function entryPath(_collection: 'papers' | 'benchmarks' | 'opinions', id: string, lang: Language = defaultLanguage) {
	return localizedPath(lang, `/blog/${id}/`);
}
