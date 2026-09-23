import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { persian, resolveOptions } from "../src/index.js";
import type { Plugin, UserConfig } from "vite";

interface PluginUnderTest {
  name: string;
  resolveId: (source: string) => unknown;
  load: (id: string) => unknown;
  transformIndexHtml: (html: string) => unknown;
  config: (config: UserConfig) => unknown;
  configResolved: (config: { root: string; base: string }) => unknown;
  buildStart: () => unknown;
}

function harness(options = {}): PluginUnderTest {
  return persian(options) as Plugin &
    PluginUnderTest;
}

/** Creates a temp project root containing the given font files. */
function makeFontRoot(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "vpp-plugin-fonts-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

describe("persian()", () => {
  it("returns a Vite plugin with the expected name", () => {
    expect(persian().name).toBe("vite-plugin-persian");
  });
});

describe("resolveOptions", () => {
  it("applies the documented defaults", () => {
    expect(resolveOptions()).toEqual({
      html: { lang: "fa", dir: "rtl" },
      jalali: { enabled: true, engine: "jalaali-js" },
      text: { enabled: true },
      experimental: { logicalProperties: false },
    });
  });

  it("never resolves a font when none is configured", () => {
    expect(resolveOptions().font).toBeUndefined();
  });

  it("merges partial user options over defaults", () => {
    const resolved = resolveOptions({
      html: { lang: "en", dir: "ltr" },
      jalali: { enabled: false, engine: "intl" },
    });
    expect(resolved.html).toEqual({ lang: "en", dir: "ltr" });
    expect(resolved.jalali).toEqual({ enabled: false, engine: "intl" });
    expect(resolved.text).toEqual({ enabled: true });
    expect(resolved.experimental).toEqual({ logicalProperties: false });
  });

  it("resolves the experimental logicalProperties flag", () => {
    expect(resolveOptions({ experimental: { logicalProperties: true } }).experimental).toEqual({
      logicalProperties: true,
    });
  });
});

describe("font options", () => {
  it("resolves a CDN family with swap display and body injection defaults", () => {
    const resolved = resolveOptions({ font: { family: "Vazirmatn" } });
    expect(resolved.font).toEqual({ family: "Vazirmatn", display: "swap", injectToBody: true });
  });

  it("honors an explicit display and injectToBody", () => {
    const resolved = resolveOptions({
      font: { family: "Sahel", display: "optional", injectToBody: false },
    });
    expect(resolved.font).toEqual({
      family: "Sahel",
      display: "optional",
      injectToBody: false,
    });
  });

  it("throws on a custom family without local configuration", () => {
    expect(() => resolveOptions({ font: { family: "NotAFont" as never } })).toThrow(
      /unknown font family "NotAFont"\..*Supported CDN families: Vazirmatn, Sahel, Samim/,
    );
  });

  it("accepts custom families with local fonts", () => {
    const resolved = resolveOptions({
      font: { family: "IRANSansX", local: { woff2: "src/fonts/x.woff2" } },
    });
    expect(resolved.font?.family).toBe("IRANSansX");
    expect(resolved.font?.local).toEqual({ woff2: "src/fonts/x.woff2" });
  });

  it("throws on an unknown display value", () => {
    expect(() => resolveOptions({ font: { family: "Samim", display: "fancy" as never } })).toThrow(
      /invalid font display .*\. Supported values: auto, block, swap, fallback, optional/,
    );
  });
});

describe("virtual module resolution", () => {
  it("resolves authorized ids to their NUL-prefixed form", () => {
    const p = harness();
    expect(p.resolveId("virtual:persian")).toBe("\0virtual:persian");
    expect(p.resolveId("virtual:persian/jalali")).toBe("\0virtual:persian/jalali");
    expect(p.resolveId("virtual:persian/text")).toBe("\0virtual:persian/text");
  });

  it("is idempotent for already-prefixed ids", () => {
    const p = harness();
    expect(p.resolveId("\0virtual:persian")).toBe("\0virtual:persian");
    expect(p.resolveId("\0virtual:persian/jalali")).toBe("\0virtual:persian/jalali");
  });

  it("leaves unrelated ids alone", () => {
    const p = harness();
    expect(p.resolveId("./App.vue")).toBeNull();
    expect(p.resolveId("virtual:persian/other")).toBeNull();
    expect(p.resolveId("virtual:persianz")).toBeNull();
  });
});

describe("virtual module loading", () => {
  it("serves the jalali module wired to the selected engine", () => {
    const p = harness({ jalali: { engine: "jalaali-js" } });
    const code = p.load("\0virtual:persian/jalali") as string;
    expect(code).toContain('import { jalaaliJsEngine } from "vite-plugin-persian/methods"');
    expect(code).toContain("createJalaliModule(jalaaliJsEngine)");
    expect(code).not.toContain("intlEngine");
    expect(code).toContain("export const toJalali = m.toJalali;");
    expect(code).toContain("export const getMonthName = m.getMonthName;");
  });

  it("serves the jalali module with the intl engine when selected", () => {
    const p = harness({ jalali: { engine: "intl" } });
    const code = p.load("\0virtual:persian/jalali") as string;
    expect(code).toContain('import { intlEngine } from "vite-plugin-persian/methods"');
    expect(code).toContain("createJalaliModule(intlEngine)");
    expect(code).not.toContain("jalaaliJsEngine");
  });

  it("serves the text module", () => {
    const p = harness();
    const code = p.load("\0virtual:persian/text") as string;
    expect(code).toContain("toPersianDigits");
    expect(code).toContain("toEnglishDigits");
    expect(code).toContain("normalizePersianText");
  });

  it("serves the main entry as re-exports of both sub-modules", () => {
    const p = harness();
    const code = p.load("\0virtual:persian") as string;
    expect(code).toContain('export * from "virtual:persian/jalali"');
    expect(code).toContain('export * from "virtual:persian/text"');
  });

  it("returns null for unrelated ids", () => {
    const p = harness();
    expect(p.load("/some/file.ts")).toBeNull();
    expect(p.load("\0virtual:persian/other")).toBeNull();
  });
});

describe("disabled features", () => {
  it("throws a helpful error when loading a disabled jalali module", () => {
    const p = harness({ jalali: { enabled: false } });
    expect(() => p.load("\0virtual:persian/jalali")).toThrow(
      /virtual:persian\/jalali" is disabled.*jalali\.enabled/s,
    );
  });

  it("throws a helpful error when loading a disabled text module", () => {
    const p = harness({ text: { enabled: false } });
    expect(() => p.load("\0virtual:persian/text")).toThrow(
      /virtual:persian\/text" is disabled.*text\.enabled/s,
    );
  });

  it("still serves the enabled sibling module", () => {
    const p = harness({ jalali: { enabled: false } });
    expect(() => p.load("\0virtual:persian/jalali")).toThrow();
    expect(p.load("\0virtual:persian/text")).toBeTruthy();
  });
});

describe("transformIndexHtml", () => {
  it("injects lang and dir defaults", () => {
    const p = harness();
    expect(p.transformIndexHtml("<!doctype html>\n<html>\n</html>")).toBe(
      '<!doctype html>\n<html lang="fa" dir="rtl">\n</html>',
    );
  });

  it("respects custom html options", () => {
    const p = harness({ html: { lang: "en", dir: "ltr" } });
    expect(p.transformIndexHtml("<html lang=\"fa\">")).toBe('<html lang="en" dir="ltr">');
  });

  it("returns a plain string when no font is configured", () => {
    const p = harness();
    expect(typeof p.transformIndexHtml("<html>")).toBe("string");
  });

  it("injects font @font-face style and a preconnect hint when configured", () => {
    const p = harness({ font: { family: "Vazirmatn" } });
    const result = p.transformIndexHtml("<html lang=\"en\">") as {
      html: string;
      tags: Array<{ tag: string; attrs?: Record<string, string | boolean>; children?: string }>;
    };

    expect(result.html).toBe('<html lang="fa" dir="rtl">');
    const tags = result.tags;

    const preconnect = tags.find((t) => t.tag === "link");
    expect(preconnect?.attrs).toMatchObject({ rel: "preconnect", href: "https://cdn.jsdelivr.net" });

    const style = tags.find((t) => t.tag === "style");
    expect(style?.children).toContain("@font-face");
    expect(style?.children).toContain('font-family: "Vazirmatn"');
    expect(style?.children).toContain("font-display: swap");
    expect(style?.children).toContain("format(\"woff2\")");
    // Body micro-injection is enabled by default.
    expect(style?.children).toContain("--persian-font-family: \"Vazirmatn\"");
    expect(style?.children).toContain("body {");
  });

  it("omits the body micro-injection and keeps these rules when injectToBody is false", () => {
    const p = harness({ font: { family: "Vazirmatn", injectToBody: false } });
    const result = p.transformIndexHtml("<html>") as {
      tags: Array<{ tag: string; attrs?: Record<string, string | boolean>; children?: string }>;
    };
    const style = result.tags.find((t) => t.tag === "style");
    expect(style?.children).not.toContain("--persian-font-family");
    expect(style?.children).not.toContain("body {");
    expect(style?.children).toContain("@font-face");
    // Still a CDN preset: preconnect stays.
    expect(result.tags.find((t) => t.tag === "link")).toBeTruthy();
  });

  it("uses the requested font-display value", () => {
    const p = harness({ font: { family: "Sahel", display: "block" } });
    const result = p.transformIndexHtml("<html>") as {
      tags: Array<{ children?: string }>;
    };
    const style = result.tags.find((t) => "children" in t);
    expect(style?.children).toContain("font-display: block");
  });
});

describe("local font assets", () => {
  it("emits local font files into the build via emitFile after configResolved", () => {
    const root = makeFontRoot({ "fonts/x.woff2": "fontdata", "fonts/x.woff": "fontdata" });
    const p = harness({ font: { family: "IRANSansX", local: { woff2: "fonts/x.woff2", woff: "fonts/x.woff" } } });

    p.configResolved({ root, base: "/" });

    const emitFile = vi.fn(() => "assets/fonts/x.woff2");
    p.buildStart.call({ emitFile });

    expect(emitFile).toHaveBeenCalledTimes(2);
    expect(emitFile).toHaveBeenCalledWith(
      expect.objectContaining({ type: "asset", fileName: "fonts/x.woff2" }),
    );
    expect(emitFile).toHaveBeenCalledWith(
      expect.objectContaining({ type: "asset", fileName: "fonts/x.woff" }),
    );
  });

  it("emits local font assets no more than once per build", () => {
    const root = makeFontRoot({ "fonts/x.woff2": "fontdata" });
    const p = harness({
      font: { family: "IRANSansX", local: { woff2: "fonts/x.woff2" } },
    });
    p.configResolved({ root, base: "/" });

    const emitFile = vi.fn();
    p.buildStart.call({ emitFile });
    p.buildStart.call({ emitFile });

    expect(emitFile).toHaveBeenCalledTimes(1);
  });

  it("builds a same-origin @font-face with no preconnect for local fonts", () => {
    const root = makeFontRoot({ "fonts/x.woff2": "fontdata" });
    const p = harness({ font: { family: "IRANSansX", local: { woff2: "fonts/x.woff2" } } });
    p.configResolved({ root, base: "/assets/" });

    const result = p.transformIndexHtml("<html>") as {
      tags: Array<{ tag: string; attrs?: Record<string, string | boolean>; children?: string }>;
    };
    const style = result.tags.find((t) => t.tag === "style");
    expect(style?.children).toContain('font-family: "IRANSansX"');
    expect(style?.children).toContain('url("/assets/fonts/x.woff2") format("woff2")');
    expect(style?.children).not.toContain("cdn.jsdelivr.net");

    const preconnect = result.tags.find((t) => t.tag === "link");
    expect(preconnect).toBeUndefined();
  });

  it("fails fast in configResolved for a missing local font file", () => {
    const root = makeFontRoot({});
    const p = harness({
      font: { family: "IRANSansX", local: { woff2: "missing.woff2" } },
    });
    expect(() => p.configResolved({ root, base: "/" })).toThrow(
      /local font file for `woff2` was not found/,
    );
  });

  it("skips emission entirely when no local font is configured", () => {
    const p = harness({ font: { family: "Vazirmatn" } });
    const emitFile = vi.fn();
    p.buildStart.call({ emitFile });
    expect(emitFile).not.toHaveBeenCalled();
  });
});

describe("config hook (CSS logical properties)", () => {
  it("adds the PostCSS transformer to the CSS pipeline when enabled", () => {
    const p = harness({ experimental: { logicalProperties: true } });
    const returned = p.config({}) as UserConfig;
    const plugins = (returned.css?.postcss as { plugins?: unknown[] } | undefined)?.plugins ?? [];
    expect(plugins).toHaveLength(1);
    expect(plugins[0]).toMatchObject({
      postcssPlugin: "vite-plugin-persian:logical-properties",
    });
  });

  it("returns nothing when logical properties are disabled (default)", () => {
    const p = harness();
    expect(p.config({})).toBeUndefined();
    const p2 = harness({ experimental: { logicalProperties: false } });
    expect(p2.config({})).toBeUndefined();
  });
});