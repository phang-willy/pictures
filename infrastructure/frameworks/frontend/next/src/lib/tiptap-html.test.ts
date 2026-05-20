import { describe, expect, it } from "vitest";

import { normalizeTiptapHtmlForStorage } from "./tiptap-html";

describe("normalizeTiptapHtmlForStorage", () => {
  it("normalizes TipTap empty paragraphs to an empty string", () => {
    expect(normalizeTiptapHtmlForStorage("<p></p>")).toBe("");
    expect(normalizeTiptapHtmlForStorage("<p><br></p>")).toBe("");
    expect(normalizeTiptapHtmlForStorage("<p>&nbsp;</p>")).toBe("");
  });

  it("keeps non-empty editor markup trimmed", () => {
    expect(normalizeTiptapHtmlForStorage(" <p>Hello</p> ")).toBe(
      "<p>Hello</p>",
    );
  });
});
