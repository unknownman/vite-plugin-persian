import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FONT_CDN_ORIGIN,
  FONT_DEFINITIONS,
  buildFontStyleCss,
  renderBodyFontInlineCss,
  renderFontFaceCss,
  resolveFontOptions,
  resolveLocalFontFiles,
} from "../src/fonts.js";

/** Creates a temp project root containing the given font files. */
function makeRoot(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "vpp-fonts-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

describe("FONT_DEFINITIONS", () => {
  it("registers the three CDN families", () => {
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

describe("resolveFontOptions", () => {
  it("defaults display to swap and injectToBody to true for CDN families", () => {
    expect(resolveFontOptions({ family: "Vazirmatn" })).toEqual({
      family: "Vazirmatn",
      display: "swap",
      injectToBody: true,
    });
  });

  it("honors explicit display and injectToBody", () => {
    expect(
      resolveFontOptions({ family: "Sahel", display: "optional", injectToBody: false }),
    ).toEqual({ family: "Sahel", display: "optional", injectToBody: false });
  });

  it("allows custom family names when local is configured", () => {
    expect(
      resolveFontOptions({ family: "IRANSansX", local: { woff2: "fonts/f.woff2" } }),
    ).toEqual({
      family: "IRANSansX",
      display: "swap",
      local: { woff2: "fonts/f.woff2" },
      injectToBody: true,
    });
  });

  it("prefers local over a CDN preset name and drops empty woff", () => {
    expect(
      resolveFontOptions({ family: "Vazirmatn", local: { woff2: "a.woff2", woff: "  " } }),
    ).toEqual({
      family: "Vazirmatn",
      display: "swap",
      local: { woff2: "a.woff2" },
      injectToBody: true,
    });
  });

  it("keeps a provided woff fallback", () => {
    const resolved = resolveFontOptions({
      family: "MyFont",
      local: { woff2: "a.woff2", woff: "a.woff" },
    });
    expect(resolved.local).toEqual({ woff2: "a.woff2", woff: "a.woff" });
  });

  it("throws on an empty family", () => {
    expect(() => resolveFontOptions({ family: "  " })).toThrow(/`font\.family` must be a non-empty string/);
  });

  it("throws on a custom family without local configuration", () => {
    expect(() => resolveFontOptions({ family: "NotAFont" })).toThrow(
      /unknown font family "NotAFont"\..*Supported CDN families: Vazirmatn, Sahel, Samim/,
    );
  });

  it("throws on an unknown display value", () => {
    expect(() => resolveFontOptions({ family: "Samim", display: "fancy" as never })).toThrow(
      /invalid font display .*\. Supported values: auto, block, swap, fallback, optional/,
    );
  });

  it("throws when local.woff2 is missing", () => {
    expect(() => resolveFontOptions({ family: "X", local: { woff2: "" } })).toThrow(
      /`font\.local\.woff2` is required/,
    );
  });
});

describe("resolveLocalFontFiles", () => {
  it("resolves woff2 (and optional woff) relative to the root", () => {
    const root = makeRoot({ "fonts/a.woff2": "fontsdata", "fonts/a.woff": "data" });
    const files = resolveLocalFontFiles({ woff2: "fonts/a.woff2", woff: "fonts/a.woff" }, root);
    expect(files).toEqual([
      { rel: "fonts/a.woff2", abs: path.join(root, "fonts/a.woff2"), format: "woff2" },
      { rel: "fonts/a.woff", abs: path.join(root, "fonts/a.woff"), format: "woff" },
    ]);
  });

  it("throws when a font file does not exist", () => {
    const root = makeRoot({});
    expect(() => resolveLocalFontFiles({ woff2: "missing.woff2" }, root)).toThrow(
      /local font file for `woff2` was not found/,
    );
  });

  it("throws when the font file escapes the project root", () => {
    const root = makeRoot({});
    const outside = path.join(root, "..", "escaped.woff2");
    writeFileSync(outside, "data");
    try {
      expect(() => resolveLocalFontFiles({ woff2: outside }, root)).toThrow(
        /must live inside the project root/,
      );
    } finally {
      // The temp files live under the OS tmp dir and are cleaned up by it.
    }
  });
});

describe("renderFontFaceCss", () => {
  it("groups faces by weight into @font-face blocks", () => {
    const css = renderFontFaceCss(
      "Vazirmatn",
      [
        { weight: 400, url: "https://cdn/a.woff2", format: "woff2" },
        { weight: 700, url: "https://cdn/b.woff2", format: "woff2" },
      ],
      "swap",
    );
    expect(css.split("@font-face").length - 1).toBe(2);
    expect(css).toContain('font-family: "Vazirmatn"');
    expect(css).toContain("font-display: swap");
    expect(css).toContain('url("https://cdn/a.woff2") format("woff2")');
    expect(css).toContain('local("Vazirmatn")');
  });

  it("lists multiple sources of the same weight together", () => {
    const css = renderFontFaceCss(
      "Custom",
      [
        { weight: 400, url: "/fonts/f.woff2", format: "woff2" },
        { weight: 400, url: "/fonts/f.woff", format: "woff" },
      ],
      "block",
    );
    expect(css.split("@font-face").length - 1).toBe(1);
    expect(css).toContain('url("/fonts/f.woff2") format("woff2"), url("/fonts/f.woff") format("woff")');
    expect(css).toContain("font-display: block");
  });
});

describe("renderBodyFontInlineCss", () => {
  it("applies the family via a CSS variable and !important fallback", () => {
    const css = renderBodyFontInlineCss("Vazirmatn");
    expect(css).toContain(":root { --persian-font-family: \"Vazirmatn\"; }");
    expect(css).toContain(
      "body { font-family: var(--persian-font-family), sans-serif !important; }",
    );
  });
});

describe("buildFontStyleCss", () => {
  const ctx = { root: "/app", base: "/" };

  it("renders CDN faces and the body injection by default", () => {
    const css = buildFontStyleCss(resolveFontOptions({ family: "Vazirmatn" }), ctx);
    expect(css).toContain("@font-face");
    expect(css).toContain('url("https://cdn.jsdelivr.net/npm/vazirmatn');
    expect(css).toContain("--persian-font-family");
    expect(css).toContain("body {");
  });

  it("skips the body injection when injectToBody is false", () => {
    const css = buildFontStyleCss(
      resolveFontOptions({ family: "Vazirmatn", injectToBody: false }),
      ctx,
    );
    expect(css).not.toContain("--persian-font-family");
    expect(css).not.toContain("body {");
  });

  it("uses local assets when configured, ignoring the CDN preset", () => {
    const root = makeRoot({ "fonts/x.woff2": "data", "fonts/x.woff": "data" });
    const css = buildFontStyleCss(
      resolveFontOptions({ family: "Vazirmatn", local: { woff2: "fonts/x.woff2", woff: "fonts/x.woff" } }),
      { root, base: "/" },
    );
    expect(css).toContain('url("/fonts/x.woff2") format("woff2")');
    expect(css).toContain('url("/fonts/x.woff") format("woff")');
    expect(css).not.toContain("cdn.jsdelivr.net");
    expect(css).toContain("body {");
  });

  it("honors a custom base for local fonts", () => {
    const root = makeRoot({ "fonts/x.woff2": "data" });
    const css = buildFontStyleCss(
      resolveFontOptions({ family: "MyFont", local: { woff2: "fonts/x.woff2" } }),
      { root, base: "/sub/" },
    );
    expect(css).toContain('url("/sub/fonts/x.woff2") format("woff2")');
    expect(css).not.toContain(FONT_CDN_ORIGIN);
  });
});