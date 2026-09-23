import { readFileSync } from "node:fs";
import type { HtmlTagDescriptor, Plugin, UserConfig } from "vite";
import { createLogicalPropertiesPostCss } from "./css/logical-properties.js";
import {
  FONT_CDN_ORIGIN,
  buildFontStyleCss,
  resolveFontOptions,
  resolveLocalFontFiles,
  resolvePreloadUrls,
} from "./fonts.js";
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
 * - `font.preload`   → `false` (v0.3.1)
 * - `experimental.logicalProperties` → `false` (v0.3.0; accepts an ignore
 *   config in v0.3.1)
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
 *   v0.3.0). CDN presets reference jsDelivr assets; custom `local` fonts are
 *   emitted into the build output via `emitFile` and served by the dev server
 *   under the same relative URL. `font.preload` (v0.3.1) additionally emits
 *   `<link rel="preload" as="font" type="font/woff2">` hints for local
 *   `.woff2` files to cut FOUT.
 * - Optionally rewrites CSS to logical properties (`experimental.
 *   logicalProperties`, v0.3.0) via an injected PostCSS plugin; v0.3.1 adds
 *   `@persian-ignore` comment markers and an `ignore` selector list to
 *   exclude rules.
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

  // Resolved from Vite's config; local default lets the plugin function even
  // when hooks are exercised directly (tests) before configResolved runs.
  let root = process.cwd();
  let base = "/";

  // Local font assets are emitted once per build; this set dedupes emission
  // across environments (client + SSR) which may both call buildStart.
  const emitted = new Set<string>();

  return {
    name: "vite-plugin-persian",

    configResolved(config) {
      root = config.root;
      base = withTrailingSlash(config.base ?? "/");
      if (resolved.font?.local !== undefined) {
        // Fail fast with a clear message when a local font is misconfigured.
        resolveLocalFontFiles(resolved.font.local, root);
      }
    },

    buildStart() {
      const font = resolved.font;
      if (font?.local === undefined) {
        return;
      }
      const emit = this as unknown as {
        emitFile(options: { type: "asset"; fileName: string; source: Uint8Array }): string;
      };
      for (const file of resolveLocalFontFiles(font.local, root)) {
        if (emitted.has(file.rel)) {
          continue;
        }
        emitted.add(file.rel);
        // Static `fileName` keeps the emitted path identical to the public URL
        // (base + relative-from-root), matching what the dev server serves.
        emit.emitFile({
          type: "asset",
          fileName: file.rel,
          source: readFileSync(file.abs),
        });
      }
    },

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

    transformIndexHtml(html, _ctx) {
      const transformed = htmlTransform(html);
      if (resolved.font === undefined) {
        return transformed;
      }
      // CDN presets get a preconnect hint; local fonts are same-origin, so no
      // preconnect is needed. The inline <style> carries the @font-face rules
      // (and the body/`:root` micro-injection when injectToBody is default).
      const tags: HtmlTagDescriptor[] = [];
      if (resolved.font.local === undefined) {
        tags.push({
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: FONT_CDN_ORIGIN,
            crossorigin: "",
          },
          injectTo: "head",
        });
      } else if (resolved.font.preload) {
        // Self-hosted fonts can be warmed up before CSS applies them, which
        // minimizes FOUT: preload each local `.woff2` with matching hrefs.
        for (const href of resolvePreloadUrls(resolved.font, { root, base })) {
          tags.push({
            tag: "link",
            attrs: {
              rel: "preload",
              as: "font",
              type: "font/woff2",
              href,
              crossorigin: "",
            },
            injectTo: "head",
          });
        }
      }
      tags.push({
        tag: "style",
        children: buildFontStyleCss(resolved.font, { root, base }),
        injectTo: "head",
      });
      return { html: transformed, tags };
    },

    config(_config) {
      // Opt-in CSS logical-properties rewrite: inject the PostCSS plugin into
      // Vite's CSS pipeline. Nothing is added unless the flag is enabled, so
      // the default (v0.1.x / v0.2.0) behavior is untouched. When configured
      // with an options object, exclusions (ignore selectors) are forwarded.
      const logical = resolved.experimental.logicalProperties;
      if (!logical) {
        return undefined;
      }
      const config: UserConfig = {
        css: {
          postcss: {
            plugins: [
              createLogicalPropertiesPostCss(
                logical === true ? undefined : { ignoreSelectors: logical.ignore ?? [] },
              ),
            ],
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

/**
 * Normalizes the Vite `base` option so it always ends with a slash, which
 * keeps the local-font public URL join (`base + relative path`) predictable.
 */
function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}