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

const TEMP_DIRS: string[] = [];

/** Minimal Vite app that imports the Jalali + text virtual modules. */
const INDEX_HTML = `<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body><script type="module" src="/src/main.ts"></script></body>
</html>`;

const MAIN_TS = `
import { formatJalali } from "virtual:persian/jalali";
import { toPersianDigits } from "virtual:persian/text";
(globalThis as any).__PERSIAN_RESULT__ = JSON.stringify({
  year: formatJalali(new Date(2024, 2, 20), "YYYY/MM/DD"),
  digits: toPersianDigits("2024"),
});
`;

async function writeFixture(): Promise<string> {
  // `realpath` resolves macOS' `/var` -> `/private/var` symlink so Vite's
  // `root`/`outDir` computations all agree on the same real path.
  const dir = await realpath(await mkdtemp(join(tmpdir(), "vite-plugin-persian-")));
  TEMP_DIRS.push(dir);
  await mkdir(join(dir, "src"), { recursive: true });
  await writeFile(join(dir, "index.html"), INDEX_HTML);
  await writeFile(join(dir, "src", "main.ts"), MAIN_TS);
  return dir;
}

/** Builds the fixture with the plugin and returns the temp root dir. */
async function buildFixture(options: PersianOptions = {}): Promise<string> {
  const root = await writeFixture();
  await build({
    root,
    plugins: [persian(options)],
    logLevel: "error",
    build: { minify: false, write: true },
    resolve: {
      alias: {
        "vite-plugin-persian/methods": METHODS_SOURCE,
      },
    },
  });
  return root;
}

afterAll(async () => {
  await Promise.all(TEMP_DIRS.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("integration: real vite build", () => {
  it(
    "injects lang/dir into the built index.html",
    async () => {
      const root = await buildFixture();
      const html = await readFile(join(root, "dist", "index.html"), "utf-8");
      expect(html).toContain('<html lang="fa" dir="rtl">');
    },
    30_000,
  );

  it(
    "tree-shakes the unused engine out of the consumer bundle",
    async () => {
      const root = await buildFixture();
      const asset = await findAsset(root);
      const code = await readFile(asset, "utf-8");
      expect(code).not.toContain(INTL_MARKER);

      const result = await evaluate(asset);
      expect(result).toBe(JSON.stringify({ year: "1403/01/01", digits: "۲۰۲۴" }));
    },
    30_000,
  );

  it(
    "keeps the intl engine when selected",
    async () => {
      const root = await buildFixture({ jalali: { engine: "intl" } });
      const asset = await findAsset(root);
      const code = await readFile(asset, "utf-8");
      expect(code).toContain(INTL_MARKER);
    },
    30_000,
  );

  it(
    "fails the build when a disabled module is imported",
    async () => {
      const root = await writeFixture();
      await expect(
        build({
          root,
          plugins: [persian({ jalali: { enabled: false } })],
          logLevel: "error",
          resolve: { alias: { "vite-plugin-persian/methods": METHODS_SOURCE } },
        }),
      ).rejects.toThrow(/disabled/);
    },
    30_000,
  );

  it(
    "transforms index.html through the dev server",
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
});

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