import { parseFragment, serialize } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";

type ChildNode = DefaultTreeAdapterTypes.ChildNode;
type ElementNode = DefaultTreeAdapterTypes.Element;
type ParentNode = DefaultTreeAdapterTypes.ParentNode;
type TextNode = DefaultTreeAdapterTypes.TextNode;
type Attribute = ElementNode["attrs"][number];

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "strong",
  "u",
  "ul",
]);

const DROP_WITH_CONTENT_TAGS = new Set([
  "embed",
  "iframe",
  "math",
  "meta",
  "noscript",
  "object",
  "plaintext",
  "script",
  "style",
  "svg",
  "template",
  "textarea",
  "title",
  "xmp",
]);

const SAFE_HREF_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_TARGETS = new Set(["_blank", "_self", "_parent", "_top"]);
const SAFE_OL_TYPES = new Set(["1", "a", "A", "i", "I"]);

function isElementNode(node: ChildNode): node is ElementNode {
  return "tagName" in node;
}

function isTextNode(node: ChildNode): node is TextNode {
  return node.nodeName === "#text";
}

function isSafeHref(rawHref: string) {
  const href = rawHref.trim();
  if (!href) {
    return false;
  }

  const compactHref = href.replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (compactHref.startsWith("#")) {
    return true;
  }

  try {
    const url = new URL(compactHref, "https://pictures.local");
    const hasExplicitProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(compactHref);

    return !hasExplicitProtocol || SAFE_HREF_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

function sanitizedTextAttribute(rawValue: string) {
  return rawValue.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function getAttribute(attrs: Attribute[], name: string) {
  const attr = attrs.find(
    (candidate) => candidate.name.toLowerCase() === name,
  );

  return attr?.value;
}

function sanitizeAnchorAttributes(attrs: Attribute[]) {
  const sanitized: Attribute[] = [];
  const rawHref = getAttribute(attrs, "href");

  if (rawHref && isSafeHref(rawHref)) {
    sanitized.push({ name: "href", value: rawHref.trim() });
  }

  const rawTitle = getAttribute(attrs, "title");
  const title = rawTitle ? sanitizedTextAttribute(rawTitle) : "";
  if (title) {
    sanitized.push({ name: "title", value: title });
  }

  const rawTarget = getAttribute(attrs, "target")?.trim();
  if (rawTarget && SAFE_TARGETS.has(rawTarget)) {
    sanitized.push({ name: "target", value: rawTarget });
    if (rawTarget === "_blank") {
      sanitized.push({ name: "rel", value: "noopener noreferrer" });
    }
  }

  return sanitized;
}

function sanitizeOrderedListAttributes(attrs: Attribute[]) {
  const sanitized: Attribute[] = [];
  const rawStart = getAttribute(attrs, "start")?.trim();
  const rawType = getAttribute(attrs, "type")?.trim();

  if (rawStart && /^-?\d+$/.test(rawStart)) {
    sanitized.push({ name: "start", value: rawStart });
  }
  if (rawType && SAFE_OL_TYPES.has(rawType)) {
    sanitized.push({ name: "type", value: rawType });
  }

  return sanitized;
}

function sanitizeListItemAttributes(attrs: Attribute[]) {
  const rawValue = getAttribute(attrs, "value")?.trim();

  return rawValue && /^-?\d+$/.test(rawValue)
    ? [{ name: "value", value: rawValue }]
    : [];
}

function sanitizeAttributes(tagName: string, attrs: Attribute[]) {
  switch (tagName) {
    case "a":
      return sanitizeAnchorAttributes(attrs);
    case "ol":
      return sanitizeOrderedListAttributes(attrs);
    case "li":
      return sanitizeListItemAttributes(attrs);
    default:
      return [];
  }
}

function replaceChildNodes(parent: ParentNode, childNodes: ChildNode[]) {
  parent.childNodes = childNodes;

  for (const child of childNodes) {
    child.parentNode = parent;
  }
}

function sanitizeChildren(parent: ParentNode) {
  const sanitizedChildren: ChildNode[] = [];

  for (const child of parent.childNodes) {
    if (isTextNode(child)) {
      sanitizedChildren.push(child);
      continue;
    }

    if (!isElementNode(child)) {
      continue;
    }

    const tagName = child.tagName.toLowerCase();
    if (
      child.namespaceURI !== HTML_NAMESPACE ||
      DROP_WITH_CONTENT_TAGS.has(tagName)
    ) {
      continue;
    }

    sanitizeChildren(child);

    if (!ALLOWED_TAGS.has(tagName)) {
      sanitizedChildren.push(...child.childNodes);
      continue;
    }

    child.tagName = tagName;
    child.nodeName = tagName;
    child.attrs = sanitizeAttributes(tagName, child.attrs);
    sanitizedChildren.push(child);
  }

  replaceChildNodes(parent, sanitizedChildren);
}

function hasMeaningfulContent(parent: ParentNode): boolean {
  for (const child of parent.childNodes) {
    if (isTextNode(child)) {
      const text = child.value.replace(/\u00A0/g, " ").trim();
      if (text) {
        return true;
      }
      continue;
    }

    if (!isElementNode(child)) {
      continue;
    }

    if (child.tagName.toLowerCase() === "hr") {
      return true;
    }

    if (hasMeaningfulContent(child)) {
      return true;
    }
  }

  return false;
}

export function sanitizePostContentHtml(html: string) {
  const fragment = parseFragment(html.trim());
  sanitizeChildren(fragment);

  return serialize(fragment).trim();
}

export function normalizePostContentHtml(html: string) {
  const sanitized = sanitizePostContentHtml(html);
  if (!sanitized) {
    return "";
  }

  const fragment = parseFragment(sanitized);
  return hasMeaningfulContent(fragment) ? sanitized : "";
}
