import type { CatalogAsset, Leader } from '../../lib/benchmarkData';
import type { BenchmarkDetailContent, BenchmarkEvidenceContent } from '../../lib/benchmarkDetailData';

export const codeQaSources = {
	paper: 'https://arxiv.org/abs/2605.29277',
	paperHtml: 'https://arxiv.org/html/2605.29277',
	repository: 'https://github.com/Lens-Frontier/code-qa-bench',
	repositoryCommit: 'https://github.com/Lens-Frontier/code-qa-bench/commit/d615139074369bc395eedf879cd68eca2ab63ee8',
	tasks: 'https://github.com/Lens-Frontier/code-qa-bench/tree/d615139074369bc395eedf879cd68eca2ab63ee8/tasks',
	archive: 'https://github.com/Lens-Frontier/code-qa-bench/archive/d615139074369bc395eedf879cd68eca2ab63ee8.zip',
	primaryTasks: 'https://raw.githubusercontent.com/Lens-Frontier/code-qa-bench/d615139074369bc395eedf879cd68eca2ab63ee8/tasks/tasks.json',
	diagnosticTasks: 'https://raw.githubusercontent.com/Lens-Frontier/code-qa-bench/d615139074369bc395eedf879cd68eca2ab63ee8/tasks/tasks_doc_dependent.json',
} as const;

export const codeQaLeaders: Leader[] = [
	{
		model: 'DeepSeek-V4-Pro',
		modelId: 'deepseek-v4-0324',
		score: 89.2,
		ciLow: 88.4,
		ciHigh: 89.9,
		benchmarkVersion: 'arXiv:2605.29277v1',
		protocolVersion: 'code-derivable / code-only',
		publishedAt: '2026-05-28',
		sampleSize: 528,
		evidence: 'reviewed',
		evidenceDepth: 'partial',
		evidenceRef: codeQaSources.paper,
	},
	{
		model: 'Claude Opus 4.6',
		modelId: 'claude-opus-4-6',
		score: 89.1,
		ciLow: 88.5,
		ciHigh: 89.7,
		benchmarkVersion: 'arXiv:2605.29277v1',
		protocolVersion: 'code-derivable / code-only',
		publishedAt: '2026-05-28',
		sampleSize: 528,
		evidence: 'reviewed',
		evidenceDepth: 'partial',
		evidenceRef: codeQaSources.paper,
	},
	{
		model: 'Kimi-K2.6',
		modelId: 'kimi-k2.6-0528',
		score: 87.3,
		ciLow: 86.7,
		ciHigh: 88.0,
		benchmarkVersion: 'arXiv:2605.29277v1',
		protocolVersion: 'code-derivable / code-only',
		publishedAt: '2026-05-28',
		sampleSize: 528,
		evidence: 'reviewed',
		evidenceDepth: 'partial',
		evidenceRef: codeQaSources.paper,
	},
	{
		model: 'Gemini-3.1-Pro',
		modelId: 'gemini-3.1-pro-preview',
		score: 77.2,
		ciLow: 76.1,
		ciHigh: 78.4,
		benchmarkVersion: 'arXiv:2605.29277v1',
		protocolVersion: 'code-derivable / code-only',
		publishedAt: '2026-05-28',
		sampleSize: 528,
		evidence: 'reviewed',
		evidenceDepth: 'partial',
		evidenceRef: codeQaSources.paper,
	},
];

export const codeQaCatalog: Record<'zh' | 'en', CatalogAsset> = {
	zh: {
		id: 'code-qa-bench',
		name: 'Code-QA-Bench',
		category: 'code',
		status: 'released',
		summary: '一个全自动仓库级代码理解基准。它用闭卷、仅代码和含文档三种条件，将真正的代码阅读能力与文档记忆、预训练记忆分开测量。论文在 10 个固定版本的 Python 仓库上发布了 528 个 code-derivable 任务和 100 个 doc-dependent 任务。',
		capability: '在真实代码仓库中定位、追踪并解释实现，同时区分代码阅读、参数记忆与文档利用。',
		source: '10 个 SWE-Bench Python 仓库（固定 commit）',
		judgeMode: 'GPT-5.4 LLM judge · 三轴连续评分',
		tags: ['repository-level QA', 'code understanding', 'coding agent'],
	},
	en: {
		id: 'code-qa-bench',
		name: 'Code-QA-Bench',
		category: 'code',
		status: 'released',
		summary: 'A fully automated repository-level code understanding benchmark. Closed-book, code-only, and documented conditions separate genuine code reading from documentation recall and pretraining memorization. The paper reports 528 code-derivable and 100 doc-dependent tasks across ten pinned Python repositories.',
		capability: 'Locate, trace, and explain implementation details in real repositories while separating code reading, memorization, and documentation use.',
		source: '10 pinned SWE-Bench Python repositories',
		judgeMode: 'GPT-5.4 LLM judge · three-axis continuous score',
		tags: ['repository-level QA', 'code understanding', 'coding agent'],
	},
};

const specimens = [
	{
		title: 'Where does `ipartfrac` get called, and how does its data flow through `migcdex`, `igcdex`, and `gcdext`?',
		capability: 'Where · data_control_flow',
		context: [
			{ label: 'Task ID', value: 'code-derivable:sympy_gen_03' },
			{ label: 'Repository', value: 'sympy @ 693a559a' },
			{ label: 'Key files', value: 'sympy/functions/elementary/_trigonometric_special.py · trigonometric.py · sympy/core/intfunc.py' },
		],
		input: 'Where does `ipartfrac` get called, and how does its data flow through `migcdex`, `igcdex`, and `gcdext`?',
		assertions: [
			'Identify that ipartfrac is called in cos._eval_rewrite_as_sqrt, not directly in the sin implementation.',
			'Explain that ipartfrac uses functools.reduce with a multiplication function to compute the denominator product.',
			'Explain that complement values are constructed with denom // x and passed to migcdex.',
		],
	},
	{
		title: 'How does pytest handle finalizer failures during fixture teardown, and how are multiple exceptions from different teardown stages combined?',
		capability: 'How · system_design',
		context: [
			{ label: 'Task ID', value: 'code-derivable:pytest_gen_04' },
			{ label: 'Repository', value: 'pytest @ 8ecf49ec' },
			{ label: 'Key files', value: 'src/_pytest/fixtures.py · src/_pytest/runner.py · src/_pytest/skipping.py' },
		],
		input: 'How does pytest handle finalizer failures during fixture teardown, and how are multiple exceptions from different teardown stages combined?',
		assertions: [
			'Explain that FixtureDef.finish() runs all finalizers even when some fail and collects exceptions.',
			'Identify that finalizers are popped in LIFO order.',
			'Identify that multiple failures are wrapped in a BaseExceptionGroup with the exception list reversed.',
		],
	},
	{
		title: "What is the role and architecture of `_normalize_path` in xarray's backend system, and where is it used across the codebase?",
		capability: 'What · architecture_exploration',
		context: [
			{ label: 'Task ID', value: 'code-derivable:xarray_gen_01' },
			{ label: 'Repository', value: 'xarray @ 92601de1' },
			{ label: 'Key files', value: 'xarray/backends/common.py · xarray/core/utils.py · xarray/backends/api.py' },
		],
		input: "What is the role and architecture of `_normalize_path` in xarray's backend system, and where is it used across the codebase?",
		assertions: [
			'Describe the three overload signatures and the implementation accepting os.PathLike | str | T.',
			'Describe the os.fspath and local-path expansion transformations.',
			'Explain that is_remote_uri detects remote URIs and leaves them unchanged.',
		],
	},
	{
		title: 'Why is `ogrinspect` split into a public function and a private `_ogrinspect` generator, and how does the management command exploit that design?',
		capability: 'Why · purpose_exploration',
		context: [
			{ label: 'Task ID', value: 'code-derivable:django_gen_06' },
			{ label: 'Repository', value: 'django @ 856c9153' },
			{ label: 'Key files', value: 'django/contrib/gis/utils/ogrinspect.py · management/commands/ogrinspect.py · gdal/geomtype.py' },
		],
		input: 'Why is `ogrinspect` split into a public function and a private `_ogrinspect` generator, and how does the management command exploit that design?',
		assertions: [
			'Explain that _ogrinspect yields model-definition lines while ogrinspect joins them into a string.',
			'Explain why the management command calls _ogrinspect directly before appending the mapping dictionary.',
			'Identify get_func_args(_ogrinspect) as the mechanism used to filter accepted CLI options.',
		],
	},
];

export const codeQaDetails: Record<'zh' | 'en', BenchmarkDetailContent> = {
	zh: {
		families: [
			{ title: 'Code-derivable', description: '主任务集；答案经过 code-only 审核，应能从去除文档后的代码中恢复。', count: 528 },
			{ title: 'Doc-dependent', description: '诊断任务集；答案有意依赖文档，用来测量文档带来的增益。', count: 100 },
		],
		specimens,
	},
	en: {
		families: [
			{ title: 'Code-derivable', description: 'Primary task set. Answers pass a code-only audit and should be recoverable from stripped source.', count: 528 },
			{ title: 'Doc-dependent', description: 'Diagnostic task set intentionally requiring documentation to measure documentation utility.', count: 100 },
		],
		specimens,
	},
};

const conditionScores: BenchmarkEvidenceContent['conditionScores'] = [
	{ model: 'Claude Opus 4.6', taskSet: 'code-derivable', taskCount: 528, closedBook: 56.0, codeOnly: 89.1, documented: 91.8, confidenceIntervals: { closedBook: [54.8, 57.1], codeOnly: [88.5, 89.7], documented: [91.2, 92.2] } },
	{ model: 'DeepSeek-V4-Pro', taskSet: 'code-derivable', taskCount: 528, closedBook: 44.2, codeOnly: 89.2, documented: 89.9, confidenceIntervals: { closedBook: [43.0, 45.5], codeOnly: [88.4, 89.9], documented: [89.3, 90.5] } },
	{ model: 'Kimi-K2.6', taskSet: 'code-derivable', taskCount: 528, closedBook: 51.4, codeOnly: 87.3, documented: 88.2, confidenceIntervals: { closedBook: [50.1, 52.7], codeOnly: [86.7, 88.0], documented: [87.4, 88.9] } },
	{ model: 'Gemini-3.1-Pro', taskSet: 'code-derivable', taskCount: 528, closedBook: 48.2, codeOnly: 77.2, documented: 75.5, confidenceIntervals: { closedBook: [46.8, 49.7], codeOnly: [76.1, 78.4], documented: [74.2, 76.6] } },
	{ model: 'Claude Opus 4.6', taskSet: 'doc-dependent', taskCount: 100, closedBook: 68.2, codeOnly: 87.3, documented: 95.3, confidenceIntervals: { closedBook: [64.3, 71.9], codeOnly: [84.7, 89.8], documented: [94.1, 96.5] } },
	{ model: 'DeepSeek-V4-Pro', taskSet: 'doc-dependent', taskCount: 100, closedBook: 55.7, codeOnly: 86.7, documented: 92.8, confidenceIntervals: { closedBook: [51.4, 59.7], codeOnly: [83.3, 89.8], documented: [90.3, 94.7] } },
	{ model: 'Kimi-K2.6', taskSet: 'doc-dependent', taskCount: 100, closedBook: 63.9, codeOnly: 85.9, documented: 95.0, confidenceIntervals: { closedBook: [59.7, 68.1], codeOnly: [82.5, 89.0], documented: [93.7, 96.2] } },
	{ model: 'Gemini-3.1-Pro', taskSet: 'doc-dependent', taskCount: 100, closedBook: 63.6, codeOnly: 84.0, documented: 89.3, confidenceIntervals: { closedBook: [59.2, 67.9], codeOnly: [80.8, 87.1], documented: [86.4, 91.7] } },
];

const categoryScores: BenchmarkEvidenceContent['categoryScores'] = [
	{ category: 'What', closedBook: 48.4, codeOnly: 86.0, documented: 86.3 },
	{ category: 'Why', closedBook: 53.6, codeOnly: 83.7, documented: 84.0 },
	{ category: 'Where', closedBook: 47.9, codeOnly: 86.3, documented: 87.4 },
	{ category: 'How', closedBook: 50.0, codeOnly: 86.9, documented: 87.6 },
];

const technicalRecord = {
	benchmark_id: 'code-qa-bench',
	release: 'arXiv:2605.29277v1',
	repository_commit: 'd615139074369bc395eedf879cd68eca2ab63ee8',
	primary_task_set: 'code-derivable',
	primary_condition: 'code-only',
	primary_tasks: 528,
	diagnostic_tasks: 100,
	total_tasks: 628,
	repositories: 10,
	repository_language: 'Python',
	conditions: 'closed-book / code-only / documented',
	primary_metric: 'mean((accuracy + completeness + specificity) / 15)',
	score_scale: '0-100 (paper reports 0-1)',
	judge_model: 'GPT-5.4',
	generation_model: 'Claude Opus 4.6',
	agent_tools: 'read_file / list_directory / search_code',
	max_turns: 60,
	max_tokens_per_response: 4096,
	bootstrap_resamples: 10000,
	bootstrap_seed: 42,
	human_validation: 'Not performed in v1',
	code_task_verification: '203 pass / 325 warn / 0 fail retained',
	result_artifacts: 'Aggregate tables in paper; task-level run outputs are not committed at the reviewed repository commit',
	repository_license: 'MIT',
	paper_license: 'CC BY 4.0',
};

const datasetSchema = {
	zh: [
		{ name: 'id', type: 'string', required: true, description: '任务在所属任务集中的唯一标识。' },
		{ name: 'repo', type: 'string', required: true, description: '任务对应的固定版本代码仓库。' },
		{ name: 'question', type: 'string', required: true, description: '提供给被评模型的仓库级代码理解问题。' },
		{ name: 'category', type: 'enum', required: true, description: '问题类别：what、why、where 或 how。' },
		{ name: 'sub_type', type: 'string', required: true, description: '更细粒度的能力类型，例如 architecture_exploration。' },
		{ name: 'gold_answer', type: 'string', required: true, description: '由工具型生成流程产出的参考答案。' },
		{ name: 'rubric', type: 'string[]', required: true, description: 'Judge 逐项核对模型答案的评分要点。' },
		{ name: 'key_files', type: 'string[]', required: true, description: '支持答案的关键仓库文件路径。' },
		{ name: 'source_doc', type: 'string', required: true, description: '用于确定任务主题的原始文档片段。' },
		{ name: 'verification_verdict', type: 'enum', required: true, description: '自动审核结论：pass、warn 或 fail。' },
		{ name: 'verification_issues', type: 'string[]', required: true, description: '自动审核发现的问题与证据边界。' },
		{ name: 'strip_verify_leakage', type: 'number', required: false, description: '移除文档后仍可能残留的泄漏估计。' },
	],
	en: [
		{ name: 'id', type: 'string', required: true, description: 'Unique task identifier within its task set.' },
		{ name: 'repo', type: 'string', required: true, description: 'Pinned source repository used by the task.' },
		{ name: 'question', type: 'string', required: true, description: 'Repository-level code question presented to the evaluated model.' },
		{ name: 'category', type: 'enum', required: true, description: 'Question category: what, why, where, or how.' },
		{ name: 'sub_type', type: 'string', required: true, description: 'More specific capability type such as architecture_exploration.' },
		{ name: 'gold_answer', type: 'string', required: true, description: 'Reference answer produced by the tool-equipped generation workflow.' },
		{ name: 'rubric', type: 'string[]', required: true, description: 'Atomic criteria used by the judge to score a model answer.' },
		{ name: 'key_files', type: 'string[]', required: true, description: 'Repository paths supporting the reference answer.' },
		{ name: 'source_doc', type: 'string', required: true, description: 'Original documentation excerpt used to establish the task topic.' },
		{ name: 'verification_verdict', type: 'enum', required: true, description: 'Automated audit verdict: pass, warn, or fail.' },
		{ name: 'verification_issues', type: 'string[]', required: true, description: 'Issues and evidence boundaries found by automated verification.' },
		{ name: 'strip_verify_leakage', type: 'number', required: false, description: 'Estimated leakage remaining after documentation stripping.' },
	],
} as const;

const datasetDownloads = {
	zh: [
		{ label: '代码与任务快照', description: '固定提交 d615139 的完整仓库归档。', href: codeQaSources.archive, format: 'ZIP', size: '约 5 MB', primary: true },
		{ label: 'Code-derivable', description: '主榜单使用的 528 个任务。', href: codeQaSources.primaryTasks, format: 'JSON', size: '4.0 MB' },
		{ label: 'Doc-dependent', description: '测量文档增益的 100 个诊断任务。', href: codeQaSources.diagnosticTasks, format: 'JSON', size: '400 KB' },
	],
	en: [
		{ label: 'Code and task snapshot', description: 'Complete repository archive at pinned commit d615139.', href: codeQaSources.archive, format: 'ZIP', size: 'about 5 MB', primary: true },
		{ label: 'Code-derivable', description: 'The 528-task primary leaderboard set.', href: codeQaSources.primaryTasks, format: 'JSON', size: '4.0 MB' },
		{ label: 'Doc-dependent', description: 'The 100-task diagnostic set for documentation utility.', href: codeQaSources.diagnosticTasks, format: 'JSON', size: '400 KB' },
	],
} as const;

const reproduction = {
	zh: [
		{ title: '安装', description: '创建环境并以 editable 模式安装仓库。', command: 'uv venv\nsource .venv/bin/activate\nuv pip install -e ".[dev]"' },
		{ title: '准备仓库', description: '根据 repos.json 获取固定版本仓库并生成 stripped 版本。', command: 'code-qa-bench setup-repos\ncode-qa-bench strip-repos' },
		{ title: '运行模型', description: '运行主任务集的 Code-only 条件；模型凭证配置在 config.json。', command: 'code-qa-bench run --model my-model --condition stripped' },
		{ title: '评分与报告', description: '使用 Judge 对已保存回答评分并生成聚合报告。', command: 'code-qa-bench judge results/my-model.json --judge-model judge-model\ncode-qa-bench report results/my-model_judged_by_judge-model.json' },
	],
	en: [
		{ title: 'Install', description: 'Create an environment and install the repository in editable mode.', command: 'uv venv\nsource .venv/bin/activate\nuv pip install -e ".[dev]"' },
		{ title: 'Prepare repositories', description: 'Fetch pinned repositories from repos.json and build stripped variants.', command: 'code-qa-bench setup-repos\ncode-qa-bench strip-repos' },
		{ title: 'Run a model', description: 'Run the primary task set in the Code-only condition; credentials live in config.json.', command: 'code-qa-bench run --model my-model --condition stripped' },
		{ title: 'Judge and report', description: 'Score saved answers with a judge and produce an aggregate report.', command: 'code-qa-bench judge results/my-model.json --judge-model judge-model\ncode-qa-bench report results/my-model_judged_by_judge-model.json' },
	],
} as const;

export const codeQaEvidence: Record<'zh' | 'en', BenchmarkEvidenceContent> = {
	zh: {
		taskTotal: 628,
		conditionScores,
		categoryScores,
		publicDataCard: {
			summary: '面向真实 Python 仓库的代码理解数据集，通过三种上下文条件区分预训练记忆、代码阅读和文档利用。',
			status: '论文已发布 · 证据部分可复核',
			statusTone: 'limited',
			fields: [
				{ label: '任务与规模', value: '628 个仓库级问答任务', note: '528 个 code-derivable 主任务 + 100 个 doc-dependent 诊断任务' },
				{ label: '覆盖范围', value: 'Python · 10 个公开仓库', note: '每个仓库固定到可复现的 commit 快照' },
				{ label: 'Verify 机制', value: 'Gold answer + rubric', note: 'GPT-5.4 按 Accuracy、Completeness、Specificity 三轴评分' },
				{ label: '榜单指标', value: 'Code-only mean · 0–100', note: '主榜单统计 528 个 code-derivable 任务的归一化均分' },
				{ label: '公开许可', value: '仓库 MIT · 论文 CC BY 4.0', note: '任务文件随公开仓库发布，未单列额外许可' },
				{ label: '当前版本', value: 'Paper v1 · 2026-05-28', note: 'Repository snapshot d615139' },
			],
			boundary: '任务与聚合结果可以公开核对；逐任务模型输出、judge 记录和人工验证尚未完整公开。',
		},
		dataset: {
			format: 'JSON',
			files: 2,
			downloads: [...datasetDownloads.zh],
			schema: [...datasetSchema.zh],
			reproduction: [...reproduction.zh],
		},
		findings: [
			'在主任务集的 code-only 条件下，DeepSeek-V4-Pro（89.2）与 Claude Opus 4.6（89.1）接近，Gemini-3.1-Pro 为 77.2。',
			'代码访问相对闭卷平均提升约 23 个百分点，说明结果主要来自主动阅读仓库，而不只是预训练记忆。',
			'Doc-dependent 任务中，documented 相对 code-only 平均提升 7.1 个百分点；文档增益在四个模型上方向一致。',
			'Code-derivable 任务中，documented 与 code-only 的均值差仅约 0.6 个百分点，符合“答案可由代码恢复”的设计目标。',
			'有代码访问时 specificity 接近饱和，模型差异更多由 accuracy 与 completeness 拉开。',
		],
		limitations: [
			'v1 只使用一个 GPT-5.4 judge，尚无多 judge 一致性或与人工评分的相关性研究。',
			'任务生成由 Claude Opus 4.6 完成，存在 generator-evaluatee overlap；论文通过异源 judge 和三条件设计缓解，但没有完全消除。',
			'没有人工验证。528 个 code-derivable 任务中 203 个为 pass、325 个为 warn，warn 表示存在轻微不精确但未达到事实矛盾。',
			'当前范围仅覆盖 Python 和单一 commit 快照；移除文档还可能影响检查 __doc__ 的测试。',
			'主任务集已有明显天花板效应，三个模型在 code-only 条件下达到 87% 以上。',
		],
		method: [
			{ title: 'Answer first', description: '从文档片段确定主题，工具型 agent 先探索真实代码并生成带文件与控制流证据的 gold answer，再派生问题和 rubric。' },
			{ title: 'Code-only audit', description: '使用 AST 和 tokenize 移除 docstring、注释与文档文件，并对 gold answer 做 code-only 可恢复性审核。' },
			{ title: 'Three conditions', description: '同一任务分别在 closed-book、code-only 和 documented 条件下运行，以拆分记忆、代码阅读与文档利用。' },
			{ title: 'Three-axis judge', description: 'GPT-5.4 按 Accuracy、Completeness、Specificity 各 0-5 分评分；三轴归一化后按任务简单平均。' },
		],
		trustRecords: [
			{ title: '任务与仓库', state: '公开可核对', description: '仓库提交了 528 个 code-derivable 和 100 个 doc-dependent 任务，并固定 10 个上游仓库 commit。' },
			{ title: '榜单与区间', state: '论文报告', description: '页面分数和 95% CI 来自 arXiv:2605.29277v1；CI 使用 10,000 次 bootstrap（seed 42）。' },
			{ title: '运行级证据', state: '部分公开', description: '论文提供聚合表，但被审查的公开仓库提交中没有逐任务模型输出和 judge 结果，因此不标记为 fully verified。' },
			{ title: '人工复核', state: '未完成', description: 'v1 未进行人工验证，也没有报告 inter-judge agreement；这是正式比较时必须保留的限制。' },
		],
		sources: [
			{ label: '论文', href: codeQaSources.paper, role: 'primary' },
			{ label: 'GitHub 仓库', href: codeQaSources.repository, role: 'primary' },
			{ label: '任务文件', href: codeQaSources.tasks, role: 'primary' },
			{ label: '固定提交', href: codeQaSources.repositoryCommit, role: 'technical' },
		],
		versions: [
			{ version: 'Paper v1', date: '2026-05-28', note: 'arXiv:2605.29277v1 发布，报告 628 个任务、4 个模型和 3 个评测条件。' },
			{ version: 'Repository snapshot', date: '2026-06-16', note: '公开仓库初始提交 d615139，包含框架、固定仓库配置和两份任务文件。' },
		],
		technicalRecord,
	},
	en: {
		taskTotal: 628,
		conditionScores,
		categoryScores,
		publicDataCard: {
			summary: 'A repository-level Python code understanding dataset that separates memorization, source reading, and documentation use through three context conditions.',
			status: 'Paper released · evidence partially reproducible',
			statusTone: 'limited',
			fields: [
				{ label: 'Tasks & scale', value: '628 repository-level QA tasks', note: '528 code-derivable primary tasks + 100 doc-dependent diagnostics' },
				{ label: 'Coverage', value: 'Python · 10 public repositories', note: 'Each repository is pinned to a reproducible commit snapshot' },
				{ label: 'Verification', value: 'Gold answer + rubric', note: 'GPT-5.4 scores Accuracy, Completeness, and Specificity' },
				{ label: 'Leaderboard metric', value: 'Code-only mean · 0–100', note: 'Normalized mean over 528 code-derivable tasks' },
				{ label: 'Public licenses', value: 'Repository MIT · paper CC BY 4.0', note: 'Task files ship with the repository; no separate task license is declared' },
				{ label: 'Current version', value: 'Paper v1 · 2026-05-28', note: 'Repository snapshot d615139' },
			],
			boundary: 'Tasks and aggregate results are publicly inspectable; per-task model outputs, judge records, and human validation are not yet fully public.',
		},
		dataset: {
			format: 'JSON',
			files: 2,
			downloads: [...datasetDownloads.en],
			schema: [...datasetSchema.en],
			reproduction: [...reproduction.en],
		},
		findings: [
			'On the primary code-only metric, DeepSeek-V4-Pro (89.2) and Claude Opus 4.6 (89.1) are effectively tied, while Gemini-3.1-Pro scores 77.2.',
			'Code access adds about 23 points over closed-book on average, indicating that performance mainly comes from active repository reading rather than memorization.',
			'On doc-dependent tasks, documented beats code-only by 7.1 points on average, with the same direction across all four models.',
			'On code-derivable tasks, documented and code-only differ by only about 0.6 points on average, matching the intended code-recoverability property.',
			'Specificity is near ceiling with repository access; accuracy and completeness carry most of the remaining discrimination.',
		],
		limitations: [
			'Version 1 uses a single GPT-5.4 judge and reports no inter-judge agreement or human-correlation study.',
			'Claude Opus 4.6 generated the tasks and is also evaluated, creating generator-evaluatee overlap that the design mitigates but does not remove.',
			'There is no human validation. Of 528 code-derivable tasks, 203 pass automated verification and 325 retain a warn verdict for minor imprecision.',
			'The scope is Python-only and uses single-commit snapshots; documentation removal may also affect tests that inspect __doc__.',
			'The primary set already shows ceiling effects, with three models above 87% in code-only.',
		],
		method: [
			{ title: 'Answer first', description: 'A documentation chunk sets the topic; a tool-equipped agent explores real source and writes a code-evidenced gold answer before deriving the question and rubric.' },
			{ title: 'Code-only audit', description: 'AST and tokenize remove docstrings, comments, and documentation files, followed by an audit of whether each gold answer remains code-recoverable.' },
			{ title: 'Three conditions', description: 'Each task runs closed-book, code-only, and documented to separate memorization, code reading, and documentation use.' },
			{ title: 'Three-axis judge', description: 'GPT-5.4 scores Accuracy, Completeness, and Specificity from 0-5; normalized per-task scores are averaged equally.' },
		],
		trustRecords: [
			{ title: 'Tasks and repositories', state: 'Publicly inspectable', description: 'The repository includes 528 code-derivable and 100 doc-dependent tasks plus pinned commits for ten upstream repositories.' },
			{ title: 'Scores and intervals', state: 'Paper-reported', description: 'Scores and 95% CIs come from arXiv:2605.29277v1; intervals use 10,000 bootstrap resamples with seed 42.' },
			{ title: 'Run-level evidence', state: 'Partially public', description: 'The paper reports aggregate tables, but the reviewed public commit does not include task-level model outputs or judge results, so results are not marked fully verified.' },
			{ title: 'Human review', state: 'Not performed', description: 'Version 1 reports neither human validation nor inter-judge agreement; both remain explicit limits on formal comparison.' },
		],
		sources: [
			{ label: 'Paper', href: codeQaSources.paper, role: 'primary' },
			{ label: 'GitHub repository', href: codeQaSources.repository, role: 'primary' },
			{ label: 'Task files', href: codeQaSources.tasks, role: 'primary' },
			{ label: 'Pinned commit', href: codeQaSources.repositoryCommit, role: 'technical' },
		],
		versions: [
			{ version: 'Paper v1', date: '2026-05-28', note: 'arXiv:2605.29277v1 reports 628 tasks, four models, and three evaluation conditions.' },
			{ version: 'Repository snapshot', date: '2026-06-16', note: 'Initial public commit d615139 includes the framework, pinned repository config, and both task files.' },
		],
		technicalRecord,
	},
};
