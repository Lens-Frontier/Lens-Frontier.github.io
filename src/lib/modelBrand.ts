import anthropicIcon from '@lobehub/icons-static-svg/icons/claude-color.svg?url';
import deepseekIcon from '@lobehub/icons-static-svg/icons/deepseek-color.svg?url';
import geminiIcon from '@lobehub/icons-static-svg/icons/gemini-color.svg?url';
import kimiIconSource from '@lobehub/icons-static-svg/icons/kimi.svg?raw';
import metaIcon from '@lobehub/icons-static-svg/icons/meta-color.svg?url';
import microsoftIcon from '@lobehub/icons-static-svg/icons/microsoft-color.svg?url';
import mistralIcon from '@lobehub/icons-static-svg/icons/mistral-color.svg?url';
import openaiIconSource from '@lobehub/icons-static-svg/icons/openai.svg?raw';
import qwenIcon from '@lobehub/icons-static-svg/icons/qwen-color.svg?url';
import yiIcon from '@lobehub/icons-static-svg/icons/yi-color.svg?url';

export interface ModelBrand {
	label: string;
	icon: string;
}

const openaiIcon = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
	openaiIconSource
		.replace('viewBox="0 0 24 24"', 'viewBox="-2 -2 28 28"')
		.replace('<path ', '<rect x="-2" y="-2" width="28" height="28" rx="4" fill="#fff"/><path fill="#111827" '),
)}`;

// The color Kimi asset uses a white glyph intended for a colored surface.
// Use the complete brand mark in Kimi blue so it stays visible on both themes.
const kimiIcon = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
	kimiIconSource.replace('fill="currentColor"', 'fill="#1783FF"'),
)}`;

const brandMatchers: Array<{ pattern: RegExp; brand: ModelBrand }> = [
	{ pattern: /\b(gpt|openai|o[134](?:\b|-))/i, brand: { label: 'OpenAI', icon: openaiIcon } },
	{ pattern: /\b(claude|anthropic)\b/i, brand: { label: 'Anthropic', icon: anthropicIcon } },
	{ pattern: /\b(gemini|gemma)\b/i, brand: { label: 'Google', icon: geminiIcon } },
	{ pattern: /\b(kimi|moonshot)\b/i, brand: { label: 'Moonshot AI', icon: kimiIcon } },
	{ pattern: /\b(qwen|qwq)/i, brand: { label: 'Qwen', icon: qwenIcon } },
	{ pattern: /\bdeepseek\b/i, brand: { label: 'DeepSeek', icon: deepseekIcon } },
	{ pattern: /\b(mistral|mixtral|codestral)\b/i, brand: { label: 'Mistral AI', icon: mistralIcon } },
	{ pattern: /\b(llama|meta)\b/i, brand: { label: 'Meta', icon: metaIcon } },
	{ pattern: /\b(phi|microsoft)\b/i, brand: { label: 'Microsoft', icon: microsoftIcon } },
	{ pattern: /\byi(?:-|\b)/i, brand: { label: '01.AI', icon: yiIcon } },
];

export function modelBrand(model: string): ModelBrand | null {
	return brandMatchers.find(({ pattern }) => pattern.test(model))?.brand ?? null;
}
