function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function MaplibreMapPinHtml(text: string): string {
  const safe = escapeHtml(text);
  return `
    <span class="px-4 py-2 bg-card rounded-xl text-sm font-medium text-card-foreground shadow-md">${safe}</span>
  `;
}
