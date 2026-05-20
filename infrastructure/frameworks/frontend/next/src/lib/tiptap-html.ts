const EMPTY_TIPTAP_HTML_PATTERN =
  /^<p>(?:\s|&nbsp;|&#160;|<br\s*\/?>)*<\/p>$/i;

export function normalizeTiptapHtmlForStorage(html: string) {
  const trimmed = html.trim();
  if (!trimmed || EMPTY_TIPTAP_HTML_PATTERN.test(trimmed)) {
    return "";
  }

  return trimmed;
}
