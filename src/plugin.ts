import type { Plugin } from "vite";
import { createHtmlTransformer } from "./html.js";
import type { PersianOptions, ResolvedPersianOptions } from "./types.js";

/** Root of all virtual module identifiers served by this plugin. */
const VIRTUAL_ROOT = "virtual:persian";

/** `virtual:persian` – re-exports the Jalali and Text modules together. */
const VIRTUAL_MAIN = `${VIRTUAL_ROOT}`;

/** `virtual:persian/jalali` – Jalali date helpers. */
const VIRTUAL_JALALI = `${VIRTUAL_ROOT}/jalali`;

/** `virtual:persian/text` – Persian text/digit helpers. */
const VIRTUAL_TEXT = `${VIRTUAL_ROOT}/text`;

/** The only ids this plugin authorizes as virtual modules. */
const VIRTUAL_IDS = new Set([VIRTUAL_MAIN, VIRTUAL_JALALI, VIRTUAL_TEXT]);

/**
 * Subpath of this package that contains the runnable implementations. The
 * virtual modules are thin re-export shims pointing here, so the logic itself
 * lives in exactly one place.
 */
const METHODS_SPECIFIER = "vite-plugin-persian/methods";

/**
 * Applies sensible defaults to the user's options, producing the fully
 * populated config the plugin operates on.
 *
 * - `html.lang`   → `'fa'`
 * - `html.dir`    → `'rtl'`
 * - `jalali.enabled` → `true`
 * - `jalali.engine`  → `'jalaali-js'`
 * - `text.enabled`   → `true`
 */
export function resolveOptions(options: PersianOptions = {}): ResolvedPersianOptions {
  return {
    html: {
      lang: options.html?.lang ?? "fa",
      dir: options.html?.dir ?? "rtl",
    },
    jalali: {
      enabled: options.jalali?.enabled ?? true,
      engine: options.jalali?.engine ?? "jalaali-js",
    },
    text: {
      enabled: options.text?.enabled ?? true,
    },
  };
}

/**
 * The `vite-plugin-persian` plugin.
 *
 * - Injects/updates `lang` and `dir` on the `<html>` tag.
 * - Serves the `virtual:persian`, `virtual:persian/jalali`, and
 *   `virtual:persian/text` modules.
 *
 * Virtual modules are resolved with a `\0` prefix, so Vite treats them as
 * in-memory modules: they are excluded from fs lookups and never emitted as
 * real files on disk, which keeps SSR and HMR correct.
 */
export function persian(options: PersianOptions = {}): Plugin {
  const resolved = resolveOptions(options);
  const htmlTransform = createHtmlTransformer(resolved.html);

  return {
    name: "vite-plugin-persian",

    resolveId(source) {
      // Idempotent: a source that is already the canonical `\0`-prefixed id.
      if (source.startsWith("\0") && VIRTUAL_IDS.has(source.slice(1))) {
        return source;
      }
      // Authorized virtual ids get the NUL prefix; everything else is left
      // for other plugins / Vite's default resolution.
      if (VIRTUAL_IDS.has(source)) {
        return `\0${source}`;
      }
      return null;
    },

    load(id) {
      if (id === `\0${VIRTUAL_JALALI}`) {
        assertEnabled("jalali", "virtual:persian/jalali", resolved);
        const engine = JSON.stringify(resolved.jalali.engine);
        return [
          `import { createJalaliModule } from ${JSON.stringify(METHODS_SPECIFIER)};`,
          `const m = createJalaliModule(${engine});`,
          "export const formatJalali = m.formatJalali;",
          "export const toJalali = m.toJalali;",
          "export const toGregorian = m.toGregorian;",
          "export const isLeapJalaliYear = m.isLeapJalaliYear;",
          "export const getMonthName = m.getMonthName;",
        ].join("\n");
      }

      if (id === `\0${VIRTUAL_TEXT}`) {
        assertEnabled("text", "virtual:persian/text", resolved);
        return [
          `export { toPersianDigits, toEnglishDigits, normalizePersianText }`,
          `  from ${JSON.stringify(METHODS_SPECIFIER)};`,
        ].join("\n");
      }

      if (id === `\0${VIRTUAL_MAIN}`) {
        // Re-export both sub-modules; disabled features surface their own
        // helpful error when this graph is loaded.
        return [
          `export * from ${JSON.stringify(VIRTUAL_JALALI)};`,
          `export * from ${JSON.stringify(VIRTUAL_TEXT)};`,
        ].join("\n");
      }

      return null;
    },

    transformIndexHtml(html) {
      return htmlTransform(html);
    },
  };
}

/**
 * Throws a clear, actionable build-time error when a virtual module is
 * imported while its feature is disabled via the plugin options.
 */
function assertEnabled(
  feature: "jalali" | "text",
  moduleId: string,
  resolved: ResolvedPersianOptions,
): void {
  const enabled = feature === "jalali" ? resolved.jalali.enabled : resolved.text.enabled;
  if (!enabled) {
    throw new Error(
      `vite-plugin-persian: "${moduleId}" is disabled. ` +
        `Enable it by setting the "${feature}.enabled" option to \`true\`, or remove the import.`,
    );
  }
}