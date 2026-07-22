import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { chartTheme } from './chartTheme';
import { copyOrDownloadSnapshot, createShareSnapshot } from './shareSnapshot';

echarts.use([BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

type ViewMode = 'ranking' | 'compare';
type RankingSelectionMode = 'default' | 'all' | 'custom';

const explorer = document.querySelector<HTMLElement>('[data-observatory]');

if (explorer) {
	const boards: any[] = JSON.parse(document.querySelector('#obs-board-data')?.textContent || '[]');
	const ui = JSON.parse(document.querySelector('#obs-ui-copy')?.textContent || '{}');
	const chartNode = explorer.querySelector<HTMLElement>('[data-leader-chart]');
	const chart = chartNode ? echarts.init(chartNode, undefined, { renderer: 'canvas' }) : null;
	const chartCanvas = explorer.querySelector<HTMLElement>('[data-chart-canvas]');
	const filterPanel = explorer.querySelector<HTMLElement>('[data-filter-panel]');
	const filterToggle = explorer.querySelector<HTMLButtonElement>('[data-filter-toggle]');
	const filterToggleLabel = explorer.querySelector<HTMLElement>('[data-filter-toggle-label]');
	const filterToggleBoardCount = explorer.querySelector<HTMLElement>('[data-filter-toggle-board-count]');
	const filterToggleModelCount = explorer.querySelector<HTMLElement>('[data-filter-toggle-model-count]');
	const filterPanelBoardCount = explorer.querySelector<HTMLElement>('[data-filter-panel-board-count]');
	const filterPanelModelCount = explorer.querySelector<HTMLElement>('[data-filter-panel-model-count]');
	const filterRecommended = explorer.querySelector<HTMLButtonElement>('[data-filter-recommended]');
	const filterAll = explorer.querySelector<HTMLButtonElement>('[data-filter-all]');
	const boardRecommended = explorer.querySelector<HTMLButtonElement>('[data-board-recommended]');
	const boardAll = explorer.querySelector<HTMLButtonElement>('[data-board-all]');
	const filterTitle = explorer.querySelector<HTMLElement>('[data-filter-title]');
	const boardFilterTitle = explorer.querySelector<HTMLElement>('[data-board-filter-title]');
	const modelSearchInput = explorer.querySelector<HTMLInputElement>('[data-model-search]');
	const boardSearchInput = explorer.querySelector<HTMLInputElement>('[data-board-search]');
	const boardSelectedCount = explorer.querySelector<HTMLElement>('[data-board-selected-count]');
	const modelSelectedCount = explorer.querySelector<HTMLElement>('[data-model-selected-count]');
	const emptyState = explorer.querySelector<HTMLElement>('[data-chart-empty]');
	const detailLink = explorer.querySelector<HTMLAnchorElement>('[data-atlas-detail]');
	const detailLabel = explorer.querySelector<HTMLElement>('[data-detail-label]');
	const activeBoardSignal = explorer.querySelector<HTMLElement>('[data-active-board-signal]');
	const benchSignalNote = explorer.querySelector<HTMLElement>('[data-bench-signal-note]');
	const compareSelectionDock = explorer.querySelector<HTMLElement>('[data-compare-selection]');
	const compareSelectionList = explorer.querySelector<HTMLElement>('[data-compare-selection-list]');
	const compareSelectionCount = explorer.querySelector<HTMLElement>('[data-compare-selection-count]');
	const compareSelectionReset = explorer.querySelector<HTMLButtonElement>('[data-compare-selection-reset]');
	const rankingTitle = explorer.querySelector<HTMLElement>('[data-ranking-title]');
	const rankingNote = explorer.querySelector<HTMLElement>('[data-ranking-note]');
	const rankingCount = explorer.querySelector<HTMLElement>('[data-ranking-count]');
	const rankingUnit = explorer.querySelector<HTMLElement>('[data-ranking-unit]');
	const shareChartButton = explorer.querySelector<HTMLButtonElement>('[data-share-chart]');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const defaultModelLimit = 8;
	const maxCompareModels = 4;
	const minCompareBoards = 2;
	const maxCompareBoards = 6;
	const defaultCompareBoards = 4;
	const leaderboardBoards = boards.filter((board) => board.leaders.length > 0);
	const allModelNames = [...new Set(leaderboardBoards.flatMap((board) => board.leaders.map((leader: any) => leader.model)))] as string[];
	const resultFor = (model: string, board: any) => board?.leaders.find((leader: any) => leader.model === model) || null;
	const modelStats = allModelNames
		.map((model) => {
			const ranks = leaderboardBoards.map((board) => resultFor(model, board)?.rank).filter((rank): rank is number => Number.isFinite(rank));
			return {
				model,
				coverage: ranks.length,
				averageRank: ranks.reduce((sum, rank) => sum + rank, 0) / Math.max(1, ranks.length),
			};
		})
		.sort((a, b) => a.averageRank - b.averageRank || b.coverage - a.coverage || a.model.localeCompare(b.model));
	const modelNames = modelStats.map((item) => item.model);
	const coverageThreshold = Math.max(2, Math.ceil(leaderboardBoards.length * 0.6));
	const recommendedCandidates = modelStats.filter((item) => item.coverage >= coverageThreshold);
	const recommendedModelNames = (recommendedCandidates.length ? recommendedCandidates : modelStats)
		.slice(0, defaultModelLimit)
		.map((item) => item.model);
	const recommendedBoardIds = leaderboardBoards.slice(0, 8).map((board) => board.id) as string[];
	const defaultModelsForBoard = (board: any) => (board?.leaders || []).slice(0, defaultModelLimit).map((leader: any) => leader.model) as string[];
	const evaluatedModelsForBoard = (board: any) => (board?.leaders || []).map((leader: any) => leader.model) as string[];

	let viewMode: ViewMode = 'ranking';
	let rankingSelectionMode: RankingSelectionMode = 'default';
	let compareSelectionMode: 'default' | 'custom' = 'default';
	let modelSearchTerm = '';
	let boardSearchTerm = '';
	let rankingModelNames = new Set<string>(defaultModelsForBoard(leaderboardBoards[0]));
	let compareModelNames = new Set<string>(recommendedModelNames.slice(0, maxCompareModels));
	let compareSelectionOrder = [...compareModelNames];
	let compareColorSlotByModel = new Map(compareSelectionOrder.map((model, index) => [model, index]));
	let compareBoardIds = new Set<string>(leaderboardBoards.slice(0, defaultCompareBoards).map((board) => board.id));
	let visibleBoardIds = new Set<string>(leaderboardBoards.map((board) => board.id));
	let activeBoardName = leaderboardBoards[0]?.name || boards[0]?.name || '';
	let selectedPoint: any = null;
	let focusedCompareModel = '';
	let lastChartViewportWidth = 0;

	const matchesModelSearch = (model: string) => model.toLowerCase().includes(modelSearchTerm.toLowerCase());
	const matchesBoardSearch = (board: any) => {
		if (!boardSearchTerm) return true;
		const haystack = [board.name, board.capability, board.summary, board.categoryLabel].join(' ').toLowerCase();
		return haystack.includes(boardSearchTerm.toLowerCase());
	};
	const visibleBoards = () => leaderboardBoards.filter((board) => visibleBoardIds.has(board.id));
	const activeBoard = () => boards.find((board) => board.name === activeBoardName && visibleBoardIds.has(board.id)) || visibleBoards()[0] || null;
	const selectedCompareBoards = () => leaderboardBoards.filter((board) => visibleBoardIds.has(board.id) && compareBoardIds.has(board.id)).slice(0, maxCompareBoards);
	const selectedCompareModels = () => modelNames.filter((model) => compareModelNames.has(model)).slice(0, maxCompareModels);
	const compareRelevantModels = () => {
		const compareBoards = selectedCompareBoards();
		return modelNames.filter((model) => compareBoards.some((board) => resultFor(model, board)));
	};
	const relevantModels = () => {
		if (viewMode === 'compare') return compareRelevantModels();
		return evaluatedModelsForBoard(activeBoard());
	};
	const setCompareModels = (models: string[]) => {
		const available = new Set(modelNames);
		const nextModels = [...new Set(models)].filter((model) => available.has(model)).slice(-maxCompareModels);
		compareModelNames = new Set(nextModels);
		compareSelectionOrder = [...nextModels];
		compareColorSlotByModel = new Map(nextModels.map((model, index) => [model, index]));
		if (focusedCompareModel && !compareModelNames.has(focusedCompareModel)) focusedCompareModel = '';
	};
	const nextCompareColorSlot = () => {
		const usedSlots = new Set(compareColorSlotByModel.values());
		for (let slot = 0; slot < maxCompareModels; slot += 1) {
			if (!usedSlots.has(slot)) return slot;
		}
		return 0;
	};
	const stableLegendWindow = (availableModels: string[], selectedModels: Set<string>, limit: number) => {
		const chosen = new Set(availableModels.slice(0, limit));
		for (const model of availableModels) {
			if (!selectedModels.has(model) || chosen.has(model)) continue;
			const replacement = [...chosen].reverse().find((candidate) => !selectedModels.has(candidate));
			if (!replacement) continue;
			chosen.delete(replacement);
			chosen.add(model);
		}
		return availableModels.filter((model) => chosen.has(model));
	};
	const resultMeta = (model: string, board: any) => {
		const result = resultFor(model, board);
		if (!result) return null;
		return {
			model,
			brand: result.brand,
			board: board.name,
			rank: result.rank,
			score: result.score,
			evidence: result.evidenceLabel,
			href: board.href,
		};
	};

	const syncModeControls = () => {
		const isCompare = viewMode === 'compare';
		explorer.classList.toggle('is-compare-mode', isCompare);
		explorer.querySelectorAll<HTMLButtonElement>('[data-chart-mode]').forEach((button) => {
			button.setAttribute('aria-pressed', String(button.dataset.chartMode === viewMode));
		});
		if (filterToggleLabel) filterToggleLabel.textContent = ui.switchBenchmark;
		if (filterTitle) filterTitle.textContent = ui.filterTitle;
		if (boardFilterTitle) boardFilterTitle.textContent = ui.benchFilters;
		if (benchSignalNote) benchSignalNote.textContent = isCompare ? ui.compareBenchFilters : ui.signalNote;
		if (filterAll) {
			filterAll.disabled = isCompare;
			filterAll.title = isCompare ? ui.compareLimit : '';
		}
	};

	const syncModelControls = () => {
		const selectedModels = viewMode === 'compare' ? compareModelNames : rankingModelNames;
		const availableModels = relevantModels();
		const availableModelNames = new Set(availableModels);
		const selectedAvailableCount = availableModels.filter((model) => selectedModels.has(model)).length;
		const coverageBoards = viewMode === 'compare' ? selectedCompareBoards() : [activeBoard()].filter(Boolean);
		explorer.querySelectorAll<HTMLInputElement>('[data-model-check]').forEach((input) => {
			const row = input.closest<HTMLElement>('[data-model-row]');
			const coverage = coverageBoards.filter((board) => resultFor(input.value, board)).length;
			input.checked = selectedModels.has(input.value);
			input.disabled = false;
			row?.toggleAttribute('hidden', !availableModelNames.has(input.value) || !matchesModelSearch(input.value));
			const coverageNode = row?.querySelector<HTMLElement>('[data-model-coverage]');
			if (coverageNode) {
				coverageNode.textContent = `${coverage}/${coverageBoards.length}`;
				coverageNode.title = `${ui.coverage} ${coverage}/${coverageBoards.length}`;
			}
			if (row) row.title = `${ui.coverage} ${coverage}/${coverageBoards.length}`;
		});
		if (modelSelectedCount) modelSelectedCount.textContent = viewMode === 'compare' ? `${selectedAvailableCount}/${maxCompareModels}` : `${selectedAvailableCount}/${availableModels.length}`;
		if (filterToggleModelCount) filterToggleModelCount.textContent = String(selectedAvailableCount);
		if (filterPanelModelCount) filterPanelModelCount.textContent = String(selectedAvailableCount);
		if (filterRecommended) filterRecommended.setAttribute('aria-pressed', String(viewMode === 'compare' ? compareSelectionMode === 'default' : rankingSelectionMode === 'default'));
		if (filterAll) filterAll.setAttribute('aria-pressed', String(viewMode === 'ranking' && rankingSelectionMode === 'all'));
	};

	const syncBoardControls = () => {
		explorer.querySelectorAll<HTMLInputElement>('[data-board-pick]').forEach((input) => {
			const board = boards.find((item) => item.id === input.value);
			input.type = 'checkbox';
			input.removeAttribute('name');
			input.checked = visibleBoardIds.has(input.value);
			input.closest<HTMLElement>('[data-board-row]')?.toggleAttribute('hidden', !board || !matchesBoardSearch(board));
		});
		if (boardSelectedCount) boardSelectedCount.textContent = `${visibleBoardIds.size}/${leaderboardBoards.length}`;
		if (filterToggleBoardCount) filterToggleBoardCount.textContent = String(visibleBoardIds.size);
		if (filterPanelBoardCount) filterPanelBoardCount.textContent = String(visibleBoardIds.size);
		const recommendedSet = new Set(recommendedBoardIds);
		const usesRecommendedBoards = visibleBoardIds.size === recommendedSet.size && [...visibleBoardIds].every((id) => recommendedSet.has(id));
		boardRecommended?.setAttribute('aria-pressed', String(usesRecommendedBoards));
		boardAll?.setAttribute('aria-pressed', String(visibleBoardIds.size === leaderboardBoards.length));
		explorer.querySelectorAll<HTMLButtonElement>('[data-bench-signal]').forEach((button) => {
			button.toggleAttribute('hidden', !visibleBoardIds.has(button.dataset.benchSignal || ''));
		});
	};

	const renderCompareSelection = () => {
		if (!compareSelectionDock || !compareSelectionList) return;
		const isCompare = viewMode === 'compare';
		compareSelectionDock.toggleAttribute('hidden', !isCompare);
		if (!isCompare) return;

		const selectedBoards = selectedCompareBoards();
		const canRemove = selectedBoards.length > minCompareBoards;
		const buttons = selectedBoards.map((board) => {
			const button = document.createElement('button');
			const label = document.createElement('span');
			const remove = document.createElement('i');
			button.type = 'button';
			button.dataset.compareSelectionRemove = board.id;
			button.disabled = !canRemove;
			button.setAttribute('aria-label', `${ui.removeBenchmark} ${board.name}`);
			button.title = canRemove ? `${ui.removeBenchmark} ${board.name}` : ui.minimumCompareBenchmarks;
			label.textContent = board.name;
			remove.textContent = '×';
			remove.setAttribute('aria-hidden', 'true');
			button.append(label, remove);
			return button;
		});
		compareSelectionList.replaceChildren(...buttons);
		if (compareSelectionCount) compareSelectionCount.textContent = String(selectedBoards.length);
	};

	const applyRankingPreset = (mode: Exclude<RankingSelectionMode, 'custom'>, board = activeBoard()) => {
		rankingSelectionMode = mode;
		rankingModelNames = new Set<string>(mode === 'all' ? evaluatedModelsForBoard(board) : defaultModelsForBoard(board));
	};

	const updateRankingDetails = (board: any, entries: any[]) => {
		if (activeBoardSignal) activeBoardSignal.textContent = board?.name || ui.noResult;
		if (rankingTitle) rankingTitle.textContent = ui.rankedResults;
		if (rankingNote) rankingNote.textContent = ui.scoreReading;
		if (rankingCount) rankingCount.textContent = String(entries.length);
		if (rankingUnit) rankingUnit.textContent = ui.models;
		if (detailLink) detailLink.href = board?.href || detailLink.dataset.libraryHref || '/';
		if (detailLabel) detailLabel.textContent = ui.openBench;

		explorer.querySelectorAll<HTMLButtonElement>('[data-bench-signal]').forEach((button) => {
			const signalBoard = boards.find((item) => item.id === button.dataset.benchSignal);
			button.setAttribute('aria-pressed', String(signalBoard?.name === board?.name));
			button.disabled = false;
			button.removeAttribute('title');
		});
	};

	const updateCompareDetails = (selectedBoards: any[]) => {
		if (activeBoardSignal) activeBoardSignal.textContent = `${selectedBoards.length} ${ui.benchmarkUnit}`;
		if (rankingTitle) rankingTitle.textContent = ui.crossCompare;
		if (rankingNote) rankingNote.textContent = ui.compareCaution;
		if (rankingCount) rankingCount.textContent = String(selectedBoards.length);
		if (rankingUnit) rankingUnit.textContent = ui.benchmarkUnit;
		if (detailLink) detailLink.href = detailLink.dataset.libraryHref || '/';
		if (detailLabel) detailLabel.textContent = ui.openLibrary;

		explorer.querySelectorAll<HTMLButtonElement>('[data-bench-signal]').forEach((button) => {
			const isSelected = compareBoardIds.has(button.dataset.benchSignal || '');
			button.setAttribute('aria-pressed', String(isSelected));
			button.disabled = compareBoardIds.size >= maxCompareBoards && !isSelected;
			button.title = button.disabled ? ui.compareBoardLimit : '';
		});
	};

	const prepareChartSize = (minimumWidth = 0) => {
		if (!chart || !chartNode) return 0;
		const viewportWidth = chartCanvas?.clientWidth || window.innerWidth;
		const chartWidth = Math.max(viewportWidth, minimumWidth);
		chartNode.style.width = `${chartWidth}px`;
		chartCanvas?.classList.toggle('is-wide-chart', chartWidth > viewportWidth + 1);
		chart.resize({ width: chartWidth, height: chartCanvas?.clientHeight || undefined });
		return chartWidth;
	};

	const rankingEntries = (board: any) => {
		const availableModels = evaluatedModelsForBoard(board);
		return board
			? availableModels.filter((model) => rankingModelNames.has(model))
				.map((model) => ({ model, result: resultFor(model, board) }))
				.filter((entry) => entry.result)
				.sort((a, b) => a.result.rank - b.result.rank || b.result.score - a.result.score)
			: [];
	};

	const renderRankingChart = () => {
		if (!chart || !chartNode) return;
		const theme = chartTheme();
		const board = activeBoard();
		const availableModels = evaluatedModelsForBoard(board);
		const entries = rankingEntries(board);
		const narrow = window.innerWidth < 640;
		const compact = window.innerWidth < 980;
		const chartWidth = prepareChartSize(narrow ? 720 : 0);
		const rankByModel = new Map(entries.map((entry) => [entry.model, entry.result.rank]));
		const selectedModel = selectedPoint?.board === board?.name ? selectedPoint.model : '';
		const legendSelected = Object.fromEntries(availableModels.map((model) => [model, rankingModelNames.has(model)]));
		const legendModels = stableLegendWindow(availableModels, rankingModelNames, Math.min(10, availableModels.length));
		const brandByModel = new Map(availableModels.map((model) => [model, resultFor(model, board)?.brand || null]));
		const legendBrandStyles = Object.fromEntries(legendModels.flatMap((model, index) => {
			const brand = brandByModel.get(model);
			if (!brand?.icon) return [];
			return [[`rankBrand${index}`, {
				width: 14,
				height: 14,
				align: 'center',
				verticalAlign: 'middle',
				borderRadius: 2,
				backgroundColor: { image: brand.icon },
				padding: [0, 2, 0, 0],
			}]];
		}));
		const legendWidth = compact
			? Math.max(620, chartWidth - 36)
			: Math.min(1020, Math.max(820, chartWidth - 150));
		const estimatedLegendColumns = narrow
			? 4
			: compact
				? Math.max(3, Math.min(4, Math.floor(legendWidth / 160)))
				: 5;
		const estimatedLegendRows = Math.ceil(legendModels.length / estimatedLegendColumns);
		const chartGridTop = Math.max(narrow ? 124 : compact ? 118 : 122, 44 + estimatedLegendRows * (narrow ? 22 : 24));

		chart.setOption({
			animationDuration: reducedMotion ? 0 : 620,
			animationDurationUpdate: reducedMotion ? 0 : 460,
			animationEasing: 'cubicOut',
			animationEasingUpdate: 'cubicInOut',
			grid: { left: narrow ? 128 : 186, right: narrow ? 48 : 68, top: chartGridTop, bottom: 46 },
			legend: {
				type: 'plain',
				top: 12,
				left: 'center',
				width: legendWidth,
				data: legendModels,
				selected: legendSelected,
				selector: compact ? false : [
					{ type: 'inverse', title: ui.quickDefaultModels },
					{ type: 'all', title: ui.allModels },
				],
				selectorPosition: 'end',
				selectorItemGap: narrow ? 6 : 8,
				selectorLabel: {
					color: theme.muted,
					borderColor: theme.lineStrong,
					borderWidth: 1,
					borderRadius: 0,
					padding: narrow ? [4, 6] : [5, 8],
					fontSize: narrow ? 10 : 11,
				},
				itemWidth: narrow ? 9 : 10,
				itemHeight: 7,
				itemGap: narrow ? 9 : compact ? 10 : 14,
				inactiveColor: theme.inactive,
				textStyle: {
					color: theme.soft,
					fontSize: narrow ? 11 : 12,
					fontWeight: 650,
					lineHeight: narrow ? 20 : 22,
					rich: {
						...legendBrandStyles,
						rankLegendLabel: {
							width: narrow ? 118 : compact ? 130 : 146,
							color: theme.soft,
							fontSize: narrow ? 11 : 12,
							fontWeight: 650,
							lineHeight: narrow ? 20 : 22,
							verticalAlign: 'middle',
							overflow: 'truncate',
						},
					},
				},
				formatter: (value: string) => {
					const maxLength = narrow ? 17 : 28;
					const modelLabel = value.length > maxLength ? `${value.slice(0, maxLength - 2)}…` : value;
					const modelIndex = legendModels.indexOf(value);
					const brandToken = brandByModel.get(value)?.icon ? `{rankBrand${modelIndex}| } ` : '';
					return `${brandToken}{rankLegendLabel|${modelLabel}}`;
				},
			},
			tooltip: {
				trigger: 'item',
				backgroundColor: theme.tooltip,
				borderWidth: 0,
				padding: [10, 12],
				textStyle: { color: theme.tooltipInk, fontSize: 12 },
				formatter: (params: any) => {
					const meta = params.data?.meta;
					if (!meta) return '';
					const brand = meta.brand?.icon
						? `<img src="${meta.brand.icon}" alt="" width="18" height="18" style="display:block;flex:0 0 auto;background:#fff;border-radius:3px;padding:2px" />`
						: '';
					return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">${brand}<strong>#${meta.rank} ${meta.model}</strong></div>${meta.board}<br>${ui.score} ${meta.score.toFixed(1)} · ${meta.evidence}`;
				},
			},
			xAxis: {
				type: 'value', min: 0, max: 100, interval: 20,
				axisLine: { show: true, lineStyle: { color: theme.axis } },
				axisTick: { show: false },
				axisLabel: { color: theme.faint, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: narrow ? 10 : 11 },
				splitLine: { lineStyle: { color: theme.grid } },
			},
			yAxis: {
				type: 'category', inverse: true, data: entries.map((entry) => entry.model),
				axisLine: { show: false }, axisTick: { show: false },
				axisLabel: {
				margin: 12, width: narrow ? 114 : 170, overflow: 'truncate',
				formatter: (value: string) => `{rank|#${rankByModel.get(value)}}  {model|${value}}`,
				rich: {
					rank: { color: theme.faint, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: narrow ? 10 : 11 },
					model: { color: theme.ink, fontSize: narrow ? 11 : 13, fontWeight: 680 },
					},
				},
			},
				series: availableModels.map((model) => {
				const entryIndex = entries.findIndex((entry) => entry.model === model);
				const selected = selectedModel === model;
				return {
					name: model,
					type: 'bar',
					stack: 'model-ranking',
					barWidth: entries.length > 14 ? 11 : entries.length > 10 ? 14 : 19,
					showBackground: true,
					backgroundStyle: { color: theme.surfaceSoft },
					itemStyle: {
						color: selected || entryIndex === 0 ? theme.accent : theme.soft,
						opacity: selected || entryIndex === 0 ? 1 : Math.max(0.58, 0.94 - Math.max(0, entryIndex) * 0.035),
					},
					label: {
						show: true, position: 'right', distance: 7, color: theme.ink,
					fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: narrow ? 11 : 12, fontWeight: 750,
						formatter: (params: any) => Number.isFinite(params.value) ? Number(params.value).toFixed(1) : '',
					},
					emphasis: { focus: 'series', itemStyle: { color: theme.accent, opacity: 1 } },
					animationDelay: reducedMotion ? 0 : (index: number) => index * 36,
					data: entries.map((entry) => entry.model === model ? {
						value: entry.result.score,
						meta: resultMeta(entry.model, board),
					} : null),
				};
			}),
		}, { notMerge: true });

		const hasChartContent = entries.length > 0;
		emptyState?.toggleAttribute('hidden', hasChartContent);
		chartNode.toggleAttribute('hidden', !hasChartContent);
		chartNode.setAttribute('aria-label', `${board?.name || ui.noResult} · ${entries.length} ${ui.models}`);
		updateRankingDetails(board, entries);
	};

	const renderCompareChart = () => {
		if (!chart || !chartNode) return;
		const theme = chartTheme();
		const selectedBoards = selectedCompareBoards();
		const selectedModels = selectedCompareModels();
		const availableModels = compareRelevantModels();
		const narrow = window.innerWidth < 640;
		const compact = window.innerWidth < 980;
		const minimumWidth = selectedBoards.length * (narrow ? 142 : compact ? 150 : 154) + 96;
		const chartWidth = prepareChartSize(minimumWidth);
		const palette = theme.palette;
		const coverageByModel = new Map(availableModels.map((model) => [
			model,
			selectedBoards.filter((board) => resultFor(model, board)).length,
		]));
		const brandByModel = new Map(availableModels.map((model) => [
			model,
			selectedBoards.map((board) => resultFor(model, board)?.brand).find(Boolean) || null,
		]));
		const legendModels = narrow
			? stableLegendWindow(availableModels, compareModelNames, defaultModelLimit)
			: availableModels;
		const legendBrandStyles = Object.fromEntries(legendModels.flatMap((model, index) => {
			const brand = brandByModel.get(model);
			if (!brand?.icon) return [];
			return [[`brand${index}`, {
				width: 14,
				height: 14,
				align: 'center',
				verticalAlign: 'middle',
				borderRadius: 2,
				backgroundColor: { image: brand.icon },
				padding: [0, 2, 0, 0],
			}]];
		}));
		const legendWidth = compact
			? Math.max(600, chartWidth - 36)
			: Math.min(1160, Math.max(760, chartWidth - 54));
		const estimatedLegendColumns = narrow
			? Math.max(3, Math.min(4, Math.floor(legendWidth / 160)))
			: Math.max(3, Math.min(6, Math.floor(Number(legendWidth) / 170)));
		const estimatedLegendRows = Math.ceil(legendModels.length / estimatedLegendColumns);
		const chartGridTop = Math.max(narrow ? 144 : compact ? 132 : 124, 58 + estimatedLegendRows * (narrow ? 25 : 24));

		chart.setOption({
			animationDuration: reducedMotion ? 0 : 660,
			animationDurationUpdate: reducedMotion ? 0 : 480,
			animationEasing: 'cubicOut',
			animationEasingUpdate: 'cubicInOut',
			color: palette,
			grid: { left: narrow ? 50 : 62, right: 30, top: chartGridTop, bottom: narrow ? 112 : 102 },
			legend: {
				type: 'plain',
				top: 12,
				left: 'center',
				width: legendWidth,
				data: legendModels,
				selected: Object.fromEntries(availableModels.map((model) => [model, compareModelNames.has(model)])),
				itemWidth: narrow ? 9 : 10,
				itemHeight: 7,
				itemGap: narrow ? 9 : 8,
				inactiveColor: theme.inactive,
				textStyle: {
					color: theme.soft,
					fontSize: 11,
					fontWeight: 650,
					lineHeight: 20,
					rich: {
						...legendBrandStyles,
						legendModel: {
							width: narrow ? 84 : compact ? 104 : 112,
							color: theme.soft,
							fontSize: 11,
							fontWeight: 650,
							lineHeight: 20,
							verticalAlign: 'middle',
							overflow: 'truncate',
						},
						coverage: { color: theme.accent, fontSize: narrow ? 10 : 11, fontWeight: 720, padding: [0, 0, 0, 3] },
					},
				},
				formatter: (value: string) => {
					const compactValue = value.replace(/\s+Instruct$/i, '');
					const maxLength = narrow ? 12 : compact ? 18 : 20;
					const modelLabel = compactValue.length > maxLength ? `${compactValue.slice(0, maxLength - 2)}…` : compactValue;
					const modelIndex = legendModels.indexOf(value);
					const brandToken = brandByModel.get(value)?.icon ? `{brand${modelIndex}| } ` : '';
					return `${brandToken}{legendModel|${modelLabel}} {coverage|${coverageByModel.get(value) || 0}/${selectedBoards.length}}`;
				},
			},
			tooltip: {
				trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: theme.accentSoft } },
				backgroundColor: theme.tooltip, borderWidth: 0, padding: [10, 12],
				textStyle: { color: theme.tooltipInk, fontSize: 12 },
				formatter: (params: any[]) => {
					const rows = params.filter((item) => Number.isFinite(item.data?.value));
					if (!rows.length) return '';
					const scoreRows = rows.map((item) => {
						const meta = item.data?.meta;
						const brand = meta?.brand?.icon
							? `<img src="${meta.brand.icon}" alt="" width="16" height="16" style="display:block;flex:0 0 auto;background:#fff;border-radius:3px;padding:1px" />`
							: '<span style="display:block;width:16px;height:16px"></span>';
						return `<div style="display:grid;grid-template-columns:auto 16px minmax(130px,1fr) auto;align-items:center;gap:7px;margin-top:8px">${item.marker}${brand}<span>${item.seriesName}</span><strong style="font-variant-numeric:tabular-nums">${Number(item.data.value).toFixed(1)}</strong></div>`;
					}).join('');
					return `<div style="display:flex;justify-content:space-between;gap:24px;padding-bottom:2px"><strong>${rows[0].axisValue}</strong><span style="color:#a5afac">${rows.length} ${ui.modelUnit}</span></div>${scoreRows}`;
				},
			},
			xAxis: {
				type: 'category', data: selectedBoards.map((board) => board.name),
				axisLine: { lineStyle: { color: theme.axis } }, axisTick: { show: false },
				axisLabel: {
					interval: 0, margin: 16, color: theme.soft, fontSize: narrow ? 10 : 11, fontWeight: 650,
					formatter: (value: string) => value.length > 18 ? `${value.slice(0, 16)}…` : value,
				},
			},
			yAxis: {
				type: 'value', min: 0, max: 100, interval: 20,
				axisLine: { show: false }, axisTick: { show: false },
				axisLabel: { color: theme.faint, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: narrow ? 10 : 11 },
				splitLine: { lineStyle: { color: theme.grid } },
			},
			series: availableModels.map((model) => {
				const modelIndex = selectedModels.indexOf(model);
				const colorSlot = compareColorSlotByModel.get(model);
				const seriesColor = colorSlot === undefined ? theme.muted : palette[colorSlot % palette.length];
				const isFocused = !focusedCompareModel || focusedCompareModel === model;
				return {
					name: model,
					type: 'bar',
					barMaxWidth: selectedModels.length > 2 ? 24 : 32,
					barGap: '18%',
					z: focusedCompareModel === model ? 5 : 1,
					itemStyle: { color: seriesColor, opacity: isFocused ? 1 : 0.2 },
					label: {
						show: true, position: 'top', distance: 5, color: seriesColor, opacity: isFocused ? 1 : 0.2,
					fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: narrow ? 10 : 11, fontWeight: 720,
						formatter: (params: any) => Number.isFinite(params.data?.value) ? Number(params.data.value).toFixed(1) : '',
					},
					emphasis: {
						focus: 'series',
						itemStyle: { opacity: isFocused ? 1 : 0.2 },
						label: { opacity: isFocused ? 1 : 0.2 },
					},
					blur: {
						itemStyle: { opacity: focusedCompareModel ? 0.12 : 0.18 },
						label: { opacity: focusedCompareModel ? 0.12 : 0.18 },
					},
					animationDelay: reducedMotion ? 0 : (index: number) => index * 46 + Math.max(0, modelIndex) * 60,
					data: selectedBoards.map((board) => {
						const result = resultFor(model, board);
						return result ? { value: result.score, meta: resultMeta(model, board) } : { value: null };
					}),
				};
			}),
		}, { notMerge: true });

		const hasChartContent = selectedBoards.length > 0 && selectedModels.length > 0;
		emptyState?.toggleAttribute('hidden', hasChartContent);
		chartNode.toggleAttribute('hidden', !hasChartContent);
		const focusDescription = focusedCompareModel ? ` · ${ui.focusedModel || 'Focused'} ${focusedCompareModel}` : '';
		chartNode.setAttribute('aria-label', `${selectedBoards.length} ${ui.benchmarkUnit} · ${selectedModels.length} ${ui.modelUnit}${focusDescription}`);
		if (focusedCompareModel) chartNode.dataset.focusedModel = focusedCompareModel;
		else delete chartNode.dataset.focusedModel;
		updateCompareDetails(selectedBoards);
	};

	const renderChart = () => {
		syncModeControls();
		if (viewMode === 'compare') renderCompareChart();
		else renderRankingChart();
		syncBoardControls();
		syncModelControls();
		renderCompareSelection();
	};

	const safeFilename = (value: string) => value
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80) || 'leaderboard';

	const shareCurrentChart = async () => {
		if (!chart || !shareChartButton) return;
		const idleLabel = ui.shareImage || 'Copy share image';
		shareChartButton.disabled = true;
		shareChartButton.textContent = ui.sharingImage || 'Generating…';
		try {
			const exportTheme = chartTheme();
			const snapshotTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
			const isCompare = viewMode === 'compare';
			const board = activeBoard();
			const selectedBoards = selectedCompareBoards();
			const selectedModels = selectedCompareModels();
			const entries = rankingEntries(board);
			const title = isCompare
				? ui.comparisonTitle
				: `${board?.name || ui.rankingTitle} · ${ui.rankedResults}`;
			const subtitle = isCompare
				? selectedBoards.map((item) => item.name).join(' · ')
				: board?.capability || ui.chartCompactNote;
			const meta = isCompare
				? [`${selectedBoards.length} ${ui.benchmarkUnit}`, `${selectedModels.length} ${ui.modelUnit}`, ui.compareCaution]
				: [`${entries.length} ${ui.modelUnit}`, ui.scoreAxis, ui.preview || 'PUBLIC PREVIEW'];
			const chartDataUrl = chart.getDataURL({
				type: 'png',
				pixelRatio: 2,
				backgroundColor: exportTheme.surface,
			});
			const blob = await createShareSnapshot({
				title,
				subtitle,
				meta,
				chartDataUrl,
				sourceUrl: window.location.href,
				statusLabel: ui.preview || 'PUBLIC PREVIEW',
				theme: snapshotTheme,
			});
			const result = await copyOrDownloadSnapshot(blob, `lens-frontier-${safeFilename(title)}.png`);
			shareChartButton.textContent = result === 'copied' ? ui.shareCopied : ui.shareDownloaded;
		} catch (error) {
			console.error('Unable to export leaderboard snapshot.', error);
			shareChartButton.textContent = ui.shareFailed || 'Export failed';
		} finally {
			shareChartButton.disabled = false;
			window.setTimeout(() => { shareChartButton.textContent = idleLabel; }, 2400);
		}
	};

	const closeFilter = () => {
		filterPanel?.setAttribute('hidden', '');
		filterToggle?.setAttribute('aria-expanded', 'false');
	};

	const openFilter = () => {
		filterPanel?.removeAttribute('hidden');
		filterToggle?.setAttribute('aria-expanded', 'true');
		requestAnimationFrame(() => modelSearchInput?.focus());
	};

	const toggleCompareBoard = (boardId: string) => {
		if (!visibleBoardIds.has(boardId)) return;
		if (compareBoardIds.has(boardId)) {
			if (compareBoardIds.size > minCompareBoards) compareBoardIds.delete(boardId);
			return;
		}
		if (compareBoardIds.size >= maxCompareBoards) return;
		compareBoardIds.add(boardId);
	};

	const reconcileVisibleBoards = () => {
		const remainingBoards = visibleBoards();
		if (!remainingBoards.some((board) => board.name === activeBoardName)) activeBoardName = remainingBoards[0]?.name || '';
		const board = activeBoard();
		if (rankingSelectionMode !== 'custom') applyRankingPreset(rankingSelectionMode === 'all' ? 'all' : 'default', board);
		else {
			const evaluated = new Set(evaluatedModelsForBoard(board));
			if (![...rankingModelNames].some((model) => evaluated.has(model))) applyRankingPreset('default', board);
		}

		compareBoardIds = new Set([...compareBoardIds].filter((id) => visibleBoardIds.has(id)));
		for (const remainingBoard of remainingBoards) {
			if (compareBoardIds.size >= Math.min(minCompareBoards, remainingBoards.length)) break;
			compareBoardIds.add(remainingBoard.id);
		}
		if (compareSelectionMode === 'default') setCompareModels(compareRelevantModels().slice(0, maxCompareModels));
	};

	const setVisibleBoards = (boardIds: string[]) => {
		const nextBoardIds = boardIds.filter((id) => leaderboardBoards.some((board) => board.id === id));
		if (!nextBoardIds.length) return;
		visibleBoardIds = new Set(nextBoardIds);
		reconcileVisibleBoards();
	};

	const toggleVisibleBoard = (boardId: string) => {
		if (visibleBoardIds.has(boardId)) {
			if (visibleBoardIds.size > 1) visibleBoardIds.delete(boardId);
		} else visibleBoardIds.add(boardId);

		reconcileVisibleBoards();
	};

	const toggleCompareModel = (model: string) => {
		if (compareModelNames.has(model)) {
			if (compareModelNames.size > 1) {
				compareModelNames.delete(model);
				compareSelectionOrder = compareSelectionOrder.filter((item) => item !== model);
				compareColorSlotByModel.delete(model);
				if (focusedCompareModel === model) focusedCompareModel = '';
			}
			return;
		}
		let colorSlot = nextCompareColorSlot();
		if (compareModelNames.size >= maxCompareModels) {
			const replacement = compareSelectionOrder.find((item) => compareModelNames.has(item)) || [...compareModelNames][0];
			if (replacement) {
				colorSlot = compareColorSlotByModel.get(replacement) ?? colorSlot;
				compareModelNames.delete(replacement);
				compareColorSlotByModel.delete(replacement);
			}
			compareSelectionOrder = compareSelectionOrder.filter((item) => item !== replacement);
			if (focusedCompareModel === replacement) focusedCompareModel = '';
		}
		compareModelNames.add(model);
		compareSelectionOrder.push(model);
		compareColorSlotByModel.set(model, colorSlot);
	};

	chart?.on('legendselectchanged', (params: any) => {
		const availableModels = viewMode === 'compare' ? compareRelevantModels() : evaluatedModelsForBoard(activeBoard());
		if (viewMode === 'compare') {
			if (!availableModels.includes(params.name)) return;
			compareSelectionMode = 'custom';
			toggleCompareModel(params.name);
			renderChart();
			requestAnimationFrame(() => chart?.dispatchAction({ type: 'downplay' }));
			return;
		}
		const nextModels = availableModels.filter((model) => params.selected?.[model]);
		if (!nextModels.length) {
			renderChart();
			return;
		}
		rankingSelectionMode = 'custom';
		rankingModelNames = new Set(nextModels);
		selectedPoint = null;
		renderChart();
	});

	chart?.on('legendselectall', () => {
		if (viewMode !== 'ranking') return;
		applyRankingPreset('all');
		selectedPoint = null;
		renderChart();
	});

	chart?.on('legendinverseselect', () => {
		if (viewMode !== 'ranking') return;
		applyRankingPreset('default');
		selectedPoint = null;
		renderChart();
	});

	chart?.on('click', (params: any) => {
		const meta = params.data?.meta;
		if (!meta) return;
		if (viewMode === 'compare') {
			focusedCompareModel = focusedCompareModel === meta.model ? '' : meta.model;
			renderChart();
			return;
		}
		selectedPoint = meta;
		renderChart();
	});

	explorer.querySelectorAll<HTMLButtonElement>('[data-chart-mode]').forEach((button) => {
		button.addEventListener('click', () => {
			viewMode = button.dataset.chartMode === 'compare' ? 'compare' : 'ranking';
			if (viewMode === 'compare' && compareSelectionMode === 'default') setCompareModels(relevantModels().slice(0, maxCompareModels));
			selectedPoint = null;
			focusedCompareModel = '';
			closeFilter();
			renderChart();
		});
	});

	shareChartButton?.addEventListener('click', shareCurrentChart);

	explorer.querySelector('[data-bench-signal-list]')?.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-bench-signal]');
		const board = boards.find((item) => item.id === button?.dataset.benchSignal);
		if (!board) return;
		if (viewMode === 'compare') {
			toggleCompareBoard(board.id);
			if (compareSelectionMode === 'default') setCompareModels(relevantModels().slice(0, maxCompareModels));
		}
		else {
			activeBoardName = board.name;
			if (rankingSelectionMode !== 'custom') applyRankingPreset(rankingSelectionMode === 'all' ? 'all' : 'default', board);
		}
		selectedPoint = null;
		renderChart();
	});

	compareSelectionList?.addEventListener('click', (event) => {
		const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-compare-selection-remove]');
		const boardId = button?.dataset.compareSelectionRemove;
		if (!boardId) return;
		toggleCompareBoard(boardId);
		if (compareSelectionMode === 'default') setCompareModels(relevantModels().slice(0, maxCompareModels));
		selectedPoint = null;
		renderChart();
	});

	compareSelectionReset?.addEventListener('click', () => {
		compareBoardIds = new Set(visibleBoards().slice(0, defaultCompareBoards).map((board) => board.id));
		if (compareSelectionMode === 'default') setCompareModels(relevantModels().slice(0, maxCompareModels));
		selectedPoint = null;
		renderChart();
	});

	filterToggle?.addEventListener('click', () => {
		const willOpen = filterPanel?.hasAttribute('hidden') ?? true;
		if (willOpen) openFilter();
		else closeFilter();
	});

	explorer.querySelector<HTMLButtonElement>('[data-filter-close]')?.addEventListener('click', closeFilter);

	boardSearchInput?.addEventListener('input', () => {
		boardSearchTerm = boardSearchInput.value.trim();
		syncBoardControls();
	});

	explorer.querySelectorAll<HTMLInputElement>('[data-board-pick]').forEach((input) => {
		input.addEventListener('change', () => {
			const board = boards.find((item) => item.id === input.value);
			if (!board) return;
			toggleVisibleBoard(board.id);
			selectedPoint = null;
			renderChart();
		});
	});

	boardRecommended?.addEventListener('click', () => {
		boardSearchTerm = '';
		if (boardSearchInput) boardSearchInput.value = '';
		setVisibleBoards(recommendedBoardIds);
		selectedPoint = null;
		renderChart();
	});

	boardAll?.addEventListener('click', () => {
		boardSearchTerm = '';
		if (boardSearchInput) boardSearchInput.value = '';
		setVisibleBoards(leaderboardBoards.map((board) => board.id));
		selectedPoint = null;
		renderChart();
	});

	modelSearchInput?.addEventListener('input', () => {
		modelSearchTerm = modelSearchInput.value.trim();
		syncModelControls();
	});

	explorer.querySelectorAll<HTMLInputElement>('[data-model-check]').forEach((input) => {
		input.addEventListener('change', () => {
			if (viewMode === 'compare') {
				compareSelectionMode = 'custom';
				toggleCompareModel(input.value);
			}
			else {
				rankingSelectionMode = 'custom';
				if (rankingModelNames.has(input.value)) {
					if (rankingModelNames.size > 1) rankingModelNames.delete(input.value);
				} else rankingModelNames.add(input.value);
			}
			selectedPoint = null;
			renderChart();
		});
	});

	filterRecommended?.addEventListener('click', () => {
		modelSearchTerm = '';
		if (modelSearchInput) modelSearchInput.value = '';
		if (viewMode === 'compare') {
			compareSelectionMode = 'default';
			setCompareModels(relevantModels().slice(0, maxCompareModels));
		}
		else applyRankingPreset('default');
		selectedPoint = null;
		renderChart();
	});

	filterAll?.addEventListener('click', () => {
		if (viewMode === 'compare') return;
		modelSearchTerm = '';
		if (modelSearchInput) modelSearchInput.value = '';
		applyRankingPreset('all');
		selectedPoint = null;
		renderChart();
	});

	document.addEventListener('click', (event) => {
		if (filterPanel?.hasAttribute('hidden')) return;
		const target = event.target as Node;
		if (!filterPanel?.contains(target) && !filterToggle?.contains(target)) closeFilter();
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') closeFilter();
	});

	if (chartCanvas) new ResizeObserver((entries) => {
		const viewportWidth = Math.round(entries[0]?.contentRect.width || 0);
		if (!viewportWidth || viewportWidth === lastChartViewportWidth) return;
		lastChartViewportWidth = viewportWidth;
		renderChart();
	}).observe(chartCanvas);

	window.addEventListener('lens-frontier-theme-change', () => renderChart());

	renderChart();
}
