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
    <span class="inline-flex max-w-56 items-center rounded-md border border-border/70 bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg ring-1 ring-black/5 backdrop-blur transition-colors group-hover:bg-accent group-hover:text-accent-foreground group-focus-visible:bg-accent group-focus-visible:text-accent-foreground group-focus-visible:ring-2 group-focus-visible:ring-ring">${safe}</span>
  `;
}

type MaplibreMapPinElementOptions = {
  ariaLabel: string;
  text?: string;
  zIndex?: number;
  touchNone?: boolean;
};

export function createMaplibreMapPinElement({
  ariaLabel,
  text = ariaLabel,
  zIndex = 20,
  touchNone = false,
}: MaplibreMapPinElementOptions): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = [
    "group m-0 cursor-pointer rounded-md border-0 bg-transparent p-1 outline-none",
    touchNone ? "touch-none" : "",
  ]
    .filter(Boolean)
    .join(" ");
  element.style.zIndex = String(zIndex);
  element.setAttribute("aria-label", ariaLabel);
  element.innerHTML = MaplibreMapPinHtml(text);
  return element;
}
