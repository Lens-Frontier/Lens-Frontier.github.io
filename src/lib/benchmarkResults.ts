import type { Leader } from './benchmarkData';
import { codeQaLeaders } from '../data/benchmarks/codeQaBench';

/**
 * Public leaderboard data lives here. Keep this map empty until a submitted
 * result passes the release checks documented in docs/ADDING_BENCHMARKS.md.
 */
export const publishedLeaderboards: Partial<Record<string, Leader[]>> = {
	'code-qa-bench': codeQaLeaders,
};
