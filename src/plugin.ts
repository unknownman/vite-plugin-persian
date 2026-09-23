import type { Plugin, UserConfig } from "vite";
import { logicalPropertiesPostCss } from "./css/logical-properties.js";
import { resolveFontOptions, createFontTags } from "./fonts.js";
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
 * - `font`           → resolved only when configured (v0.3.0)
 * - `experimental.logicalProperties` → `false` (v0.3.0)
 */
export function resolveOptions(options: PersianOptions = {}): ResolvedPersianOptions {
  const font = options.font === undefined ? undefined : resolveFontOptions(options.font);

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
    ...(font !== undefined ? { font } : {}),
    experimental: {
      logicalProperties: options.experimental?.logicalProperties ?? false,
    },
  };
}

/**
 * The `vite-plugin-persian` plugin.
 *
 * - Injects/updates `lang` and `dir` on the `<html>` tag.
 * - Optionally injects `@font-face` rules for a Persian webfont (`font`.
 *   v0.3.0).
 * - Optionally rewrites CSS to logical properties (`experimental.
 *   logicalProperties`, v0.3.0) via an injected PostCSS plugin.
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
        // Import the selected engine by name so only its module is loaded;
        // the other engine never enters the consumer's bundle.
        const engine = resolved.jalali.engine === "intl" ? "intlEngine" : "jalaaliJsEngine";
        return [
          `import { createJalaliModule } from ${JSON.stringify(METHODS_SPECIFIER)};`,
          `import { ${engine} } from ${JSON.stringify(METHODS_SPECIFIER)};`,
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
          `export { toPersianDigits, toEnglishDigits, normalizePersianText, toToman, toRial, formatCurrency, isNationalCode, isMobileNumber, normalizeMobileNumber, toNumberWords }`,
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
      const transformed = htmlTransform(html);
      if (resolved.font === undefined) {
        return transformed;
      }
      // When font injection is enabled, keep the lang/dir result and append
      // the @font-face tags; Vite's default renderer merges them into <head>.
      return { html: transformed, tags: createFontTags(resolved.font) };
    },

    config(_config) {
      // Opt-in CSS logical-properties rewrite: inject the PostCSS plugin into
      // Vite's CSS pipeline. Nothing is added unless the flag is enabled, so
      // the default (v0.1.x / v0.2.0) behavior is untouched.
      if (!resolved.experimental.logicalProperties) {
        return undefined;
      }
      const config: UserConfig = {
        css: {
          postcss: {
            plugins: [logicalPropertiesPostCss],
          },
        },
      };
      return config;
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