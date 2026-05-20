import { describe, expect, it } from "vitest";

import {
  normalizePostContentHtml,
  sanitizePostContentHtml,
} from "./post-content-html";

describe("sanitizePostContentHtml", () => {
  it("removes executable tags and dangerous attributes", () => {
    const html = [
      '<p onclick="alert(1)">Hello',
      "<script>alert(1)</script>",
      '<a href="javascript:alert(1)" onmouseover="alert(1)">bad</a>',
      '<a href="https://example.com" target="_blank" rel="opener">ok</a>',
      "</p>",
    ].join("");

    expect(sanitizePostContentHtml(html)).toBe(
      '<p>Hello<a>bad</a><a href="https://example.com" target="_blank" rel="noopener noreferrer">ok</a></p>',
    );
  });

  it("drops foreign SVG and MathML content entirely", () => {
    expect(
      sanitizePostContentHtml(
        '<svg><script>alert(1)</script></svg><math><mi>x</mi></math><p>safe</p>',
      ),
    ).toBe("<p>safe</p>");
  });

  it("keeps the expected rich text markup", () => {
    expect(
      sanitizePostContentHtml(
        '<h2>Title</h2><p><strong>Bold</strong> <em>italic</em> <u>underlined</u></p><ul><li>One</li></ul><hr>',
      ),
    ).toBe(
      "<h2>Title</h2><p><strong>Bold</strong> <em>italic</em> <u>underlined</u></p><ul><li>One</li></ul><hr>",
    );
  });

  it("unwraps unsupported layout tags but keeps their safe text", () => {
    expect(
      sanitizePostContentHtml(
        '<div><span style="color:red">Plain text</span></div>',
      ),
    ).toBe("Plain text");
  });
});

describe("normalizePostContentHtml", () => {
  it("returns an empty string for empty editor markup", () => {
    expect(normalizePostContentHtml("<p></p>")).toBe("");
    expect(normalizePostContentHtml("<p><br></p>")).toBe("");
  });

  it("keeps horizontal rules as meaningful content", () => {
    expect(normalizePostContentHtml("<hr>")).toBe("<hr>");
  });
});
