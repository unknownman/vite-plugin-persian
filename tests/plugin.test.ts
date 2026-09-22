import { describe, expect, it } from "vitest";
import { persian, resolveOptions } from "../src/index.js";
import type { Plugin } from "vite";

interface PluginUnderTest {
  name: string;
  resolveId: (source: string) => unknown;
  load: (id: string) => unknown;
  transformIndexHtml: (html: string) => unknown;
}

function harness(options = {}): PluginUnderTest {
  return persian(options) as Plugin &
    PluginUnderTest;
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
    });
  });

  it("merges partial user options over defaults", () => {
    const resolved = resolveOptions({
      html: { lang: "en", dir: "ltr" },
      jalali: { enabled: false, engine: "intl" },
    });
    expect(resolved.html).toEqual({ lang: "en", dir: "ltr" });
    expect(resolved.jalali).toEqual({ enabled: false, engine: "intl" });
    expect(resolved.text).toEqual({ enabled: true });
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
});