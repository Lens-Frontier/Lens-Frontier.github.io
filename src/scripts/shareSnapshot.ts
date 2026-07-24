interface SnapshotTable {
	headers: string[];
	rows: string[][];
}

interface SnapshotOptions {
	title: string;
	subtitle?: string;
	meta?: string[];
	chartDataUrl?: string;
	table?: SnapshotTable;
	sourceUrl: string;
	statusLabel?: string;
	theme?: 'light' | 'dark';
}

const lightPalette = {
	background: '#f5f6f4',
	surface: '#fcfcfa',
	surfaceSoft: '#f8f9f7',
	ink: '#17201f',
	muted: '#596562',
	faint: '#68736f',
	line: '#d7ddda',
	lineStrong: '#b8c2be',
	accent: '#3b5f93',
	accentSoft: '#edf1f7',
};

const darkPalette: typeof lightPalette = {
	background: '#171a19',
	surface: '#232826',
	surfaceSoft: '#1d211f',
	ink: '#edf1ee',
	muted: '#a8b2ad',
	faint: '#8b9691',
	line: '#333a37',
	lineStrong: '#4a5550',
	accent: '#8fa9cc',
	accentSoft: '#273445',
};

type SnapshotPalette = typeof lightPalette;

const canvasToBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => {
	canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to encode snapshot.')), 'image/png');
});

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
	const image = new Image();
	image.onload = () => resolve(image);
	image.onerror = () => reject(new Error('Unable to load chart image.'));
	image.src = src;
});

const fitLine = (context: CanvasRenderingContext2D, value: string, maxWidth: number) => {
	if (context.measureText(value).width <= maxWidth) return value;
	let output = value;
	while (output.length > 1 && context.measureText(`${output}...`).width > maxWidth) output = output.slice(0, -1);
	return `${output}...`;
};

const wrapLines = (context: CanvasRenderingContext2D, value: string, maxWidth: number, maxLines = 2) => {
	const characters = [...value];
	const lines: string[] = [];
	let line = '';
	for (const character of characters) {
		const candidate = `${line}${character}`;
		if (line && context.measureText(candidate).width > maxWidth) {
			lines.push(line);
			line = character;
			if (lines.length === maxLines - 1) break;
		} else line = candidate;
	}
	const consumed = lines.join('').length + line.length;
	if (lines.length < maxLines) lines.push(consumed < characters.length ? fitLine(context, characters.slice(consumed - line.length).join(''), maxWidth) : line);
	return lines.slice(0, maxLines);
};

const drawRoundedRect = (
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) => {
	context.beginPath();
	context.roundRect(x, y, width, height, radius);
};

const drawHeader = (context: CanvasRenderingContext2D, width: number, options: SnapshotOptions, palette: SnapshotPalette) => {
	const padding = 78;
	context.fillStyle = palette.ink;
	drawRoundedRect(context, padding, 64, 46, 46, 3);
	context.fill();
	context.fillStyle = palette.background;
	context.font = '600 15px ui-monospace, SFMono-Regular, Consolas, monospace';
	context.textAlign = 'center';
	context.fillText('LF', padding + 23, 94);

	context.textAlign = 'left';
	context.fillStyle = palette.ink;
	context.font = '700 22px Arial, PingFang SC, Microsoft YaHei, sans-serif';
	context.fillText('Lens Frontier', padding + 62, 83);
	context.fillStyle = palette.muted;
	context.font = '600 12px ui-monospace, SFMono-Regular, Consolas, monospace';
	context.fillText('EVALUATION DATA PLATFORM', padding + 62, 105);

	const status = options.statusLabel || 'PUBLIC PREVIEW';
	context.font = '700 12px ui-monospace, SFMono-Regular, Consolas, monospace';
	const statusWidth = context.measureText(status).width + 28;
	drawRoundedRect(context, width - padding - statusWidth, 70, statusWidth, 32, 16);
	context.fillStyle = palette.accentSoft;
	context.fill();
	context.fillStyle = palette.accent;
	context.textAlign = 'center';
	context.fillText(status, width - padding - statusWidth / 2, 91);

	context.strokeStyle = palette.lineStrong;
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(padding, 136);
	context.lineTo(width - padding, 136);
	context.stroke();
	context.textAlign = 'left';
};

const drawTitle = (context: CanvasRenderingContext2D, width: number, options: SnapshotOptions, palette: SnapshotPalette) => {
	const padding = 78;
	context.fillStyle = palette.ink;
	context.font = '700 46px Arial, PingFang SC, Microsoft YaHei, sans-serif';
	const titleLines = wrapLines(context, options.title, width - padding * 2, 2);
	titleLines.forEach((line, index) => context.fillText(line, padding, 204 + index * 54));
	let cursorY = 204 + titleLines.length * 54;
	if (options.subtitle) {
		context.fillStyle = palette.muted;
		context.font = '400 20px Arial, PingFang SC, Microsoft YaHei, sans-serif';
		const subtitleLines = wrapLines(context, options.subtitle, width - padding * 2, 2);
		subtitleLines.forEach((line, index) => context.fillText(line, padding, cursorY + index * 30));
		cursorY += subtitleLines.length * 30 + 12;
	}
	if (options.meta?.length) {
		context.font = '650 14px ui-monospace, SFMono-Regular, Consolas, monospace';
		let cursorX = padding;
		for (const item of options.meta) {
			const itemWidth = context.measureText(item).width + 28;
			if (cursorX + itemWidth > width - padding) break;
			drawRoundedRect(context, cursorX, cursorY, itemWidth, 34, 17);
			context.fillStyle = palette.accentSoft;
			context.fill();
			context.fillStyle = palette.accent;
			context.fillText(item, cursorX + 14, cursorY + 22);
			cursorX += itemWidth + 10;
		}
		cursorY += 52;
	}
	return Math.max(cursorY + 12, 316);
};

const drawTable = (
	context: CanvasRenderingContext2D,
	table: SnapshotTable,
	x: number,
	y: number,
	width: number,
	palette: SnapshotPalette,
) => {
	const headers = table.headers.slice(0, 6);
	const rows = table.rows.slice(0, 18);
	const weights = headers.map((_header, index) => index === 1 ? 2.3 : index === 0 ? 0.7 : 1);
	const totalWeight = weights.reduce((sum, value) => sum + value, 0);
	const widths = weights.map((weight) => width * weight / totalWeight);
	const headerHeight = 54;
	const rowHeight = 58;

	context.fillStyle = palette.accentSoft;
	context.fillRect(x, y, width, headerHeight);
	context.strokeStyle = palette.line;
	context.lineWidth = 1;
	context.strokeRect(x, y, width, headerHeight + rows.length * rowHeight);

	let columnX = x;
	context.font = '700 13px ui-monospace, SFMono-Regular, Consolas, monospace';
	context.fillStyle = palette.accent;
	headers.forEach((header, index) => {
		context.fillText(fitLine(context, header, widths[index] - 28), columnX + 14, y + 34);
		columnX += widths[index];
	});

	context.font = '500 15px Arial, PingFang SC, Microsoft YaHei, sans-serif';
	rows.forEach((row, rowIndex) => {
		const rowY = y + headerHeight + rowIndex * rowHeight;
		if (rowIndex % 2 === 1) {
			context.fillStyle = palette.surfaceSoft;
			context.fillRect(x, rowY, width, rowHeight);
		}
		context.strokeStyle = palette.line;
		context.beginPath();
		context.moveTo(x, rowY + rowHeight);
		context.lineTo(x + width, rowY + rowHeight);
		context.stroke();
		let cellX = x;
		row.slice(0, headers.length).forEach((cell, cellIndex) => {
			context.fillStyle = cellIndex === 2 ? palette.accent : palette.ink;
			context.font = cellIndex === 2
				? '700 16px ui-monospace, SFMono-Regular, Consolas, monospace'
				: '500 15px Arial, PingFang SC, Microsoft YaHei, sans-serif';
			context.fillText(fitLine(context, cell, widths[cellIndex] - 28), cellX + 14, rowY + 36);
			cellX += widths[cellIndex];
		});
	});
	return headerHeight + rows.length * rowHeight;
};

export async function createShareSnapshot(options: SnapshotOptions): Promise<Blob> {
	const palette = options.theme === 'dark' ? darkPalette : lightPalette;
	const width = 1600;
	const contentWidth = width - 156;
	const chartImage = options.chartDataUrl ? await loadImage(options.chartDataUrl) : null;
	const chartHeight = chartImage ? Math.min(900, Math.max(620, chartImage.height * contentWidth / chartImage.width)) : 0;
	const tableHeight = options.table ? 54 + Math.min(options.table.rows.length, 18) * 58 : 0;
	const titleReserve = options.subtitle ? 250 : 205;
	const height = Math.ceil(136 + titleReserve + Math.max(chartHeight, tableHeight, 420) + 150);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas is unavailable.');

	context.fillStyle = palette.background;
	context.fillRect(0, 0, width, height);
	drawHeader(context, width, options, palette);
	const contentY = drawTitle(context, width, options, palette);

	drawRoundedRect(context, 58, contentY - 18, width - 116, Math.max(chartHeight, tableHeight, 420) + 36, 14);
	context.fillStyle = palette.surface;
	context.fill();
	context.strokeStyle = palette.lineStrong;
	context.stroke();

	if (chartImage) context.drawImage(chartImage, 78, contentY, contentWidth, chartHeight);
	else if (options.table) drawTable(context, options.table, 78, contentY, contentWidth, palette);

	const footerY = height - 70;
	context.strokeStyle = palette.lineStrong;
	context.beginPath();
	context.moveTo(78, footerY - 34);
	context.lineTo(width - 78, footerY - 34);
	context.stroke();
	context.fillStyle = palette.muted;
	context.font = '500 13px ui-monospace, SFMono-Regular, Consolas, monospace';
	context.fillText(fitLine(context, options.sourceUrl, 1050), 78, footerY);
	context.fillStyle = palette.ink;
	context.textAlign = 'right';
	context.fillText(new Date().toISOString().slice(0, 10), width - 78, footerY);

	return canvasToBlob(canvas);
}

export async function copyOrDownloadSnapshot(blob: Blob, filename: string): Promise<'copied' | 'downloaded'> {
	if (navigator.clipboard?.write && 'ClipboardItem' in window) {
		try {
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
			return 'copied';
		} catch {
			// Clipboard image writes can be blocked outside secure contexts; download is the reliable fallback.
		}
	}
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), 0);
	return 'downloaded';
}
