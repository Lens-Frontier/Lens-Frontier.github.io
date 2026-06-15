/**
 * Remark plugin: turn fenced ```mermaid code blocks into raw
 * <pre class="mermaid"> HTML so the client-side mermaid runtime can render
 * them, instead of letting Shiki syntax-highlight the source.
 *
 * Replacing the mdast `code` node with an `html` node also keeps SmartyPants
 * away from the diagram text (it never rewrites html/code nodes), so arrows
 * like --> and straight quotes survive untouched.
 */

function escapeHtml(value) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function transform(node) {
	if (!node || !Array.isArray(node.children)) return;
	for (const child of node.children) {
		if (child.type === 'code' && child.lang === 'mermaid') {
			child.type = 'html';
			child.value = `<pre class="mermaid">${escapeHtml(child.value)}</pre>`;
			delete child.lang;
			delete child.meta;
		} else {
			transform(child);
		}
	}
}

export default function remarkMermaid() {
	return (tree) => {
		transform(tree);
	};
}
