export interface ChartTheme {
	ink: string;
	soft: string;
	muted: string;
	faint: string;
	line: string;
	lineStrong: string;
	grid: string;
	axis: string;
	inactive: string;
	accent: string;
	accentSoft: string;
	surface: string;
	surfaceSoft: string;
	tooltip: string;
	tooltipInk: string;
	palette: string[];
}

const fallbackPalette = ['#3b5f93', '#8d4e50', '#2f7468', '#94632e', '#705b8f', '#4d7180', '#82566f', '#587047'];

export function chartTheme(): ChartTheme {
	const styles = getComputedStyle(document.documentElement);
	const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
	const palette = read('--theme-chart-palette', fallbackPalette.join(','))
		.split(',')
		.map((color) => color.trim())
		.filter(Boolean);

	return {
		ink: read('--theme-ink', '#17201f'),
		soft: read('--theme-soft', '#3f4a48'),
		muted: read('--theme-muted', '#596562'),
		faint: read('--theme-faint', '#68736f'),
		line: read('--theme-line', '#d9dfdc'),
		lineStrong: read('--theme-line-strong', '#bac4c0'),
		grid: read('--theme-chart-grid', '#dfe4e2'),
		axis: read('--theme-chart-axis', '#aeb9b5'),
		inactive: read('--theme-chart-inactive', '#c7cfcc'),
		accent: read('--theme-accent', '#3b5f93'),
		accentSoft: read('--theme-accent-soft', '#edf1f7'),
		surface: read('--theme-surface-raised', '#ffffff'),
		surfaceSoft: read('--theme-surface-soft', '#f0f3f1'),
		tooltip: read('--theme-tooltip', '#121716'),
		tooltipInk: read('--theme-tooltip-ink', '#ffffff'),
		palette: palette.length ? palette : fallbackPalette,
	};
}
