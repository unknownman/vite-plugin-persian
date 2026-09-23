import { describe, expect, it } from "vitest";
import {
  FONT_DEFINITIONS,
  buildFontFaceCss,
  createFontTags,
} from "../src/fonts.js";

describe("FONT_DEFINITIONS", () => {
  it("registers the three supported families", () => {
    expect(Object.keys(FONT_DEFINITIONS).sort()).toEqual(["Sahel", "Samim", "Vazirmatn"]);
  });

  it("points every face at a CDN woff2 URL", () => {
    for (const definition of Object.values(FONT_DEFINITIONS)) {
      expect(definition.faces.length).toBeGreaterThan(0);
      for (const face of definition.faces) {
        expect(face.url).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/.*\.woff2$/);
        expect(face.weight).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildFontFaceCss", () => {
  it("renders one @font-face per weight with a unique font-family name", () => {
    const css = buildFontFaceCss({ family: "Vazirmatn", display: "swap" });
    const faces = css.split("@font-face").length - 1;
    expect(faces).toBe(FONT_DEFINITIONS.Vazirmatn.faces.length);
    expect(css).toContain('font-family: "Vazirmatn"');
    expect(css).toContain("font-display: swap");
    expect(css).toContain("font-weight: 400");
    expect(css).toContain("format(\"woff2\")");
    expect(css).toContain("local(\"Vazirmatn\")");
  });

  it("emits the configured display value", () => {
    const css = buildFontFaceCss({ family: "Samim", display: "optional" });
    expect(css).toContain("font-display: optional");
    expect(css).not.toContain("font-display: swap");
  });
});

describe("createFontTags", () => {
  it("returns a preconnect link and an inline style tag", () => {
    const tags = createFontTags({ family: "Sahel", display: "swap" });
    expect(tags).toHaveLength(2);

    expect(tags[0]).toMatchObject({
      tag: "link",
      attrs: {
        rel: "preconnect",
        href: "https://cdn.jsdelivr.net",
      },
    });

    expect(tags[1]?.tag).toBe("style");
    expect(tags[1]?.children).toContain("font-family: \"Sahel\"");
  });
});