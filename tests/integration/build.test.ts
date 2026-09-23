import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { build, createServer } from "vite";
import { persian } from "../../src/index.js";
import type { PersianOptions } from "../../src/types.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const METHODS_SOURCE = resolve(ROOT, "src/methods.ts");

/** Marker string that only exists inside the `intl` engine. */
const INTL_MARKER = "en-US-u-ca-persian";
/** Marker string that only exists inside the `jalaali-js` engine (`id`). */
const JALAALI_JS_MARKER = '"jalaali-js"';

const TEMP_DIRS: string[] = [];

const INDEX_HTML = `<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body><script type="module" src="/src/main.ts"></script></body>
</html>`;

const INDEX_HTML_LTR = `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /></head>
  <body><script type="module" src="/src/main.ts"></script></body>
</html>`;

/** Imports every legacy feature and records results on `globalThis`. */
const FULL_SURFACE_MAIN_TS = `
import { formatJalali, toJalali, toGregorian, isLeapJalaliYear, getMonthName } from "virtual:persian/jalali";
import { toPersianDigits, toEnglishDigits, normalizePersianText, toToman, toRial, formatCurrency } from "virtual:persian/text";
import { toJalali as mainToJalali } from "virtual:persian";
(globalThis as any).__PERSIAN_RESULT__ = JSON.stringify({
  year: formatJalali(new Date(2024, 2, 20), "YYYY/MM/DD"),
  jy: toJalali(new Date(2024, 2, 20)).year,
  gy: toGregorian(1403, 1, 1).getFullYear(),
  leap: isLeapJalaliYear(1403),
  monthFa: getMonthName(1),
  monthEn: getMonthName(10, "en"),
  digits: toPersianDigits("2024"),
  english: toEnglishDigits("۲۰۲۴"),
  norm: normalizePersianText("يك   تست"),
  mainJy: mainToJalali(new Date(2024, 2, 20)).year,
  tmn: toToman("10000"),
  rl: toRial(1000),
  fmtFa: formatCurrency(12500000),
  fmtEn: formatCurrency(12500000, { digits: "english" }),
});
`;

const EXPECTED_FULL_SURFACE = JSON.stringify({
  year: "1403/01/01",
  jy: 1403,
  gy: 2024,
  leap: true,
  monthFa: "فروردین",
  monthEn: "Dey",
  digits: "۲۰۲۴",
  english: "2024",
  norm: "یک تست",
  mainJy: 1403,
  tmn: 1000,
  rl: 10000,
  fmtFa: "۱۲٬۵۰۰٬۰۰۰ تومان",
  fmtEn: "12,500,000 تومان",
});

/** Imports only the Jalali module — used for the tree-shaking assertions. */
const JALALI_ONLY_MAIN_TS = `
import { formatJalali } from "virtual:persian/jalali";
(globalThis as any).__PERSIAN_RESULT__ = JSON.stringify({
  year: formatJalali(new Date(2024, 2, 20), "YYYY/MM/DD"),
});
`;

/** Imports only the text module — used for the disabled-feature test. */
const TEXT_ONLY_MAIN_TS = `
import { toPersianDigits } from "virtual:persian/text";
(globalThis as any).__PERSIAN_RESULT__ = toPersianDigits("2024");
`;

async function writeFixture({
  html = INDEX_HTML,
  main = FULL_SURFACE_MAIN_TS,
}: {
  html?: string;
  main?: string;
} = {}): Promise<string> {
  // `realpath` resolves macOS' `/var` -> `/private/var` symlink so Vite's
  // `root`/`outDir` computations all agree on the same real path.
  const dir = await realpath(await mkdtemp(join(tmpdir(), "vite-plugin-persian-")));
  TEMP_DIRS.push(dir);
  await mkdir(join(dir, "src"), { recursive: true });
  await writeFile(join(dir, "index.html"), html);
  await writeFile(join(dir, "src", "main.ts"), main);
  return dir;
}

async function runBuild(
  root: string,
  options: PersianOptions = {},
): Promise<void> {
  await build({
    root,
    plugins: [persian(options)],
    logLevel: "error",
    build: { minify: false, write: true },
    resolve: { alias: { "vite-plugin-persian/methods": METHODS_SOURCE } },
  });
}

/** Returns the single emitted `.js` asset path (or throws). */
async function findAsset(root: string): Promise<string> {
  const dist = join(root, "dist");
  const files = await readdirRecursive(dist);
  const target = files.find((f) => f.endsWith(".js") && !f.endsWith(".map"));
  if (!target) {
    throw new Error(`No JS asset found in ${dist}: ${files.join(", ")}`);
  }
  return target;
}

async function readdirRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await readdirRecursive(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** Executes a built app bundle in Node and returns the recorded result. */
async function evaluate(asset: string): Promise<string> {
  const env = globalThis as { document?: unknown; __PERSIAN_RESULT__?: string };
  // Vite's modulepreload polyfill runs at module top-level and needs a DOM.
  // Returning `true` from `relList.supports` makes it exit immediately.
  env.document = { createElement: () => ({ relList: { supports: () => true } }) };
  try {
    await import(pathToFileURL(asset).href);
    const raw = env.__PERSIAN_RESULT__;
    if (raw === undefined) {
      throw new Error("Bundle did not set __PERSIAN_RESULT__");
    }
    return raw;
  } finally {
    delete env.document;
    delete env.__PERSIAN_RESULT__;
  }
}

afterAll(async () => {
  await Promise.all(TEMP_DIRS.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("integration: real vite build", () => {
  it(
    "injects default lang/dir into the built index.html",
    async () => {
      const root = await writeFixture();
      await runBuild(root);
      const html = await readFile(join(root, "dist", "index.html"), "utf-8");
      expect(html).toContain('<html lang="fa" dir="rtl">');
      expect(html).not.toContain('lang="en"');
    },
    30_000,
  );

  it(
    "honours custom html options in the built output",
    async () => {
      const root = await writeFixture({ html: INDEX_HTML_LTR });
      await runBuild(root, { html: { lang: "en", dir: "ltr" } });
      const html = await readFile(join(root, "dist", "index.html"), "utf-8");
      expect(html).toContain('<html lang="en" dir="ltr">');
    },
    30_000,
  );

  it(
    "executes all virtual modules (jalali, text, and the main entry) at runtime",
    async () => {
      const root = await writeFixture();
      await runBuild(root);
      const asset = await findAsset(root);
      expect(await evaluate(asset)).toBe(EXPECTED_FULL_SURFACE);
    },
    30_000,
  );

  it(
    "tree-shakes the intl engine out of a default (jalaali-js) build",
    async () => {
      const root = await writeFixture({ main: JALALI_ONLY_MAIN_TS });
      await runBuild(root);
      const asset = await findAsset(root);
      const code = await readFile(asset, "utf-8");
      expect(code).not.toContain(INTL_MARKER);
      expect(code).not.toContain("Intl.DateTimeFormat");
      expect(code).toContain(JALAALI_JS_MARKER);
      expect(await evaluate(asset)).toBe(JSON.stringify({ year: "1403/01/01" }));
    },
    30_000,
  );

  it(
    "tree-shakes the jalaali-js engine out of an intl build",
    async () => {
      const root = await writeFixture({ main: JALALI_ONLY_MAIN_TS });
      await runBuild(root, { jalali: { engine: "intl" } });
      const code = await readFile(await findAsset(root), "utf-8");
      expect(code).toContain(INTL_MARKER);
      expect(code).not.toContain(JALAALI_JS_MARKER);
    },
    30_000,
  );

  it(
    "fails the build when the disabled jalali module is imported",
    async () => {
      const root = await writeFixture({ main: JALALI_ONLY_MAIN_TS });
      await expect(
        runBuild(root, { jalali: { enabled: false } }),
      ).rejects.toThrow(/virtual:persian\/jalali.*disabled/s);
    },
    30_000,
  );

  it(
    "fails the build when the disabled text module is imported",
    async () => {
      const root = await writeFixture({ main: TEXT_ONLY_MAIN_TS });
      await expect(
        runBuild(root, { text: { enabled: false } }),
      ).rejects.toThrow(/virtual:persian\/text.*disabled/s);
    },
    30_000,
  );
});

describe("integration: dev server", () => {
  it(
    "transforms index.html in dev mode",
    async () => {
      const root = await writeFixture();
      const server = await createServer({
        root,
        plugins: [persian()],
        server: { middlewareMode: true },
        logLevel: "error",
      });
      try {
        const html = await server.transformIndexHtml("/", "<!doctype html>\n<html>\n</html>");
        expect(String(html)).toContain('<html lang="fa" dir="rtl">');
      } finally {
        await server.close();
      }
    },
    30_000,
  );

  it(
    "serves a working jalali module through SSR module loading",
    async () => {
      const root = await writeFixture();
      const server = await createServer({
        root,
        plugins: [persian()],
        server: { middlewareMode: true },
        logLevel: "error",
        resolve: { alias: { "vite-plugin-persian/methods": METHODS_SOURCE } },
      });
      try {
        const mod = (await server.ssrLoadModule("virtual:persian/jalali")) as {
          formatJalali: (date: Date, pattern: string) => string;
          toJalali: (date: Date) => { year: number };
        };
        expect(mod.formatJalali(new Date(2024, 2, 20), "YYYY/MM/DD")).toBe("1403/01/01");
        expect(mod.toJalali(new Date(2024, 2, 20)).year).toBe(1403);
      } finally {
        await server.close();
      }
    },
    30_000,
  );
});