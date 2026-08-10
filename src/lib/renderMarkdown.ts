/**
 * Minimal markdown renderer for destination-guide bodies.
 *
 * Supports only what the guides actually use — h2/h3, paragraphs, unordered
 * lists, bold and links — and escapes everything first. Kept deliberately
 * small rather than pulling a full MDX pipeline for content we author
 * ourselves and store in our own database.
 */

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[(.+?)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
      '<a href="$2">$1</a>'
    );
}

export function renderGuideBody(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed === '') return '';

      if (trimmed.startsWith('### ')) {
        return `<h3 style="font-size:20px;margin:28px 0 8px">${inline(trimmed.slice(4))}</h3>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 style="font-size:26px;margin:34px 0 10px">${inline(trimmed.slice(3))}</h2>`;
      }
      if (/^[-*] /m.test(trimmed)) {
        const items = trimmed
          .split('\n')
          .filter((line) => /^[-*] /.test(line.trim()))
          .map((line) => `<li>${inline(line.trim().slice(2))}</li>`)
          .join('');
        return `<ul style="margin:12px 0;padding-left:20px;color:var(--color-neutral-800)">${items}</ul>`;
      }
      return `<p style="margin:0 0 14px;color:var(--color-neutral-800)">${inline(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}
