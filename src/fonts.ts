import { existsSync } from "node:fs";
import path from "node:path";
import type {
  FontDisplay,
  FontFamily,
  FontLocalOptions,
  FontOptions,
  ResolvedFontOptions,
} from "./types.js";

/** CDN origin all bundled font assets are served from (used for `preconnect`). */
export const FONT_CDN_ORIGIN = "https://cdn.jsdelivr.net";

/** Base path for the `Vazirmatn` webfonts on jsDelivr. */
const VAZIRMATN_BASE = "https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/fonts/webfonts";

/** Base path for the `Sahel` webfonts on jsDelivr. */
const SAHEL_BASE = "https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@v1.0.0-alpha14/dist";

/** Base path for the `Samim` webfonts on jsDelivr. */
const SAMIM_BASE = "https://cdn.jsdelivr.net/gh/rastikerdar/samim-font@v4.0.5/dist";

/**
 * A single source line for an `@font-face` rule: a file URL plus the format
 * hint so the browser can pick the best supported source.
 */
export interface FontFaceLike {
  /** CSS `font-weight` the face is registered for. */
  weight: number;
  /** Web URL the face points at. */
  url: string;
  /** Format hint emitted in the `src` descriptor. */
  format: "woff2" | "woff";
}

/**
 * A single `.woff2`/`.woff` preset face from the built-in CDN registry.
 */
export interface FontSource {
  /** CSS `font-weight` the face is registered for. */
  weight: number;
  /** Absolute `woff2` URL the face points at. */
  url: string;
}

/**
 * Everything the plugin needs to inject a font family from the CDN: its
 * registered name (which is also what consumers write in `font-family`) and
 * the faces that cover the typographically meaningful weight range.
 */
export interface FontDefinition {
  /** Font-family name used inside `@font-face` (and by consumers). */
  family: FontFamily;
  /** The faces the plugin injects. */
  faces: readonly FontSource[];
}

/**
 * Registry of the webfont families the plugin can serve from the CDN, keyed
 * by the `FontFamily` option. Each family resolves to highly available jsDelivr
 * assets so nothing has to be self-hosted and no network access is needed at
 * build time.
 *
 * The preset face list is intentionally small (Regular / Bold + a black or
 * medium weight where available); consumers who need the whole weight spectrum
 * can still load the vendor stylesheet themselves.
 */
export const FONT_DEFINITIONS: Readonly<Record<FontFamily, FontDefinition>> = {
  Vazirmatn: {
    family: "Vazirmatn",
    faces: [
      { weight: 400, url: `${VAZIRMATN_BASE}/Vazirmatn-Regular.woff2` },
      { weight: 700, url: `${VAZIRMATN_BASE}/Vazirmatn-Bold.woff2` },
      { weight: 900, url: `${VAZIRMATN_BASE}/Vazirmatn-Black.woff2` },
    ],
  },
  Sahel: {
    family: "Sahel",
    faces: [
      { weight: 400, url: `${SAHEL_BASE}/Sahel.woff2` },
      { weight: 700, url: `${SAHEL_BASE}/Sahel-Bold.woff2` },
      { weight: 900, url: `${SAHEL_BASE}/Sahel-Black.woff2` },
    ],
  },
  Samim: {
    family: "Samim",
    faces: [
      { weight: 400, url: `${SAMIM_BASE}/Samim.woff2` },
      { weight: 500, url: `${SAMIM_BASE}/Samim-Medium.woff2` },
      { weight: 700, url: `${SAMIM_BASE}/Samim-Bold.woff2` },
    ],
  },
};

/** Every accepted `font-display` descriptor value. */
export const FONT_DISPLAY_VALUES: readonly FontDisplay[] = [
  "auto",
  "block",
  "swap",
  "fallback",
  "optional",
];

/** Acceptable CDN preset family names, for error messages. */
const VALID_FAMILIES = Object.keys(FONT_DEFINITIONS) as FontFamily[];

/**
 * Validates and normalizes user-supplied font options.
 *
 * - `family` must be a non-empty string.
 * - Without `local`, `family` must be a known CDN preset.
 * - `display` defaults to `'swap'` and must be a valid `font-display` value.
 * - `local` requires a non-empty `woff2`; `woff` is optional.
 * - `injectToBody` defaults to `true`.
 * - `preload` defaults to `false` (local `.woff2` preload links).
 *
 * @throws {Error} when the family / display value is unknown or `local` is
 *   malformed.
 */
export function resolveFontOptions(font: FontOptions): ResolvedFontOptions {
  if (typeof font.family !== "string" || font.family.trim() === "") {
    throw new Error(
      "vite-plugin-persian: `font.family` must be a non-empty string.",
    );
  }
  const family = font.family.trim();

  const display = font.display ?? "swap";
  if (!FONT_DISPLAY_VALUES.includes(display)) {
    throw new Error(
      `vite-plugin-persian: invalid font display ${JSON.stringify(display)}. ` +
        `Supported values: ${FONT_DISPLAY_VALUES.join(", ")}.`,
    );
  }

  const injectToBody = font.injectToBody ?? true;
  const preload = font.preload ?? false;

  if (font.local !== undefined) {
    if (typeof font.local.woff2 !== "string" || font.local.woff2.trim() === "") {
      throw new Error(
        "vite-plugin-persian: `font.local.woff2` is required when using local fonts.",
      );
    }
    const woff = font.local.woff?.trim() || undefined;
    return {
      family,
      display,
      local: { woff2: font.local.woff2.trim(), ...(woff ? { woff } : {}) },
      injectToBody,
      preload,
    };
  }

  if (!(family in FONT_DEFINITIONS)) {
    throw new Error(
      `vite-plugin-persian: unknown font family ${JSON.stringify(family)}. ` +
        `Supported CDN families: ${VALID_FAMILIES.join(", ")}. ` +
        "Provide `font.local` for custom families.",
    );
  }

  return { family: family as FontFamily, display, injectToBody, preload };
}

/**
 * A local font file resolved against the Vite root, ready to be emitted into
 * the build and referenced from `@font-face`.
 */
export interface ResolvedLocalFontFile {
  /** POSIX path relative to the root — the public URL suffix. */
  rel: string;
  /** Absolute filesystem path. */
  abs: string;
  /** Whether this is the `woff2` or the `woff` face. */
  format: "woff2" | "woff";
}

/**
 * Resolves every file in a `FontLocalOptions` against the project root,
 * throwing a clear error when a file is missing or sits outside the root
 * (the build can only serve / emit files that stay inside the project).
 */
export function resolveLocalFontFiles(
  local: FontLocalOptions,
  root: string,
): ResolvedLocalFontFile[] {
  const candidates: Array<{ format: "woff2" | "woff"; entry: string }> = [
    { format: "woff2", entry: local.woff2 },
    ...(local.woff !== undefined ? [{ format: "woff" as const, entry: local.woff }] : []),
  ];

  const resolved: ResolvedLocalFontFile[] = [];
  for (const { format, entry } of candidates) {
    const abs = path.resolve(root, entry);
    if (!existsSync(abs)) {
      throw new Error(
        `vite-plugin-persian: local font file for \`${format}\` was not found at ${JSON.stringify(abs)}. ` +
          "Provide a path relative to the project root, or use a CDN family.",
      );
    }
    const rel = path.relative(root, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(
        `vite-plugin-persian: local font file must live inside the project root (${JSON.stringify(root)}), ` +
          `got ${JSON.stringify(abs)}.`,
      );
    }
    resolved.push({ rel: rel.split(path.sep).join("/"), abs, format });
  }
  return resolved;
}

/**
 * Renders the `@font-face` rules for a family, grouping faces by weight and
 * listing every source (local + remote URLs) for that weight.
 */
export function renderFontFaceCss(
  family: string,
  faces: FontFaceLike[],
  display: FontDisplay,
): string {
  const byWeight = new Map<number, FontFaceLike[]>();
  for (const face of faces) {
    const group = byWeight.get(face.weight) ?? [];
    group.push(face);
    byWeight.set(face.weight, group);
  }

  const blocks: string[] = [];
  for (const [weight, group] of byWeight) {
    const src = [
      `local(${JSON.stringify(family)})`,
      ...group.map((face) => `url(${JSON.stringify(face.url)}) format(${JSON.stringify(face.format)})`),
    ].join(", ");
    blocks.push(
      `@font-face { font-family: ${JSON.stringify(family)}; font-style: normal; ` +
        `font-weight: ${weight}; font-display: ${display}; src: ${src}; }`,
    );
  }
  return blocks.join("\n");
}

/**
 * The body micro-injection: announces the font through a CSS custom property
 * on `:root` and applies it to `body` with a sensible fallback stack, so the
 * font is used everywhere without the consumer writing any CSS.
 *
 * Two variables are defined:
 *
 * - `--persian-font-family` – the bare family name (v0.3.0, kept as-is).
 * - `--font-persian` – the family plus a fallback stack, matching Tailwind's
 *   `--font-*` theme convention so consumers can extend their `fontFamily`
 *   theme with `persian: "var(--font-persian)"` (v0.3.1).
 */
export function renderBodyFontInlineCss(family: string): string {
  const quoted = JSON.stringify(family);
  return [
    `:root { --persian-font-family: ${quoted}; --font-persian: ${quoted}, sans-serif; }`,
    `body { font-family: var(--persian-font-family), sans-serif !important; }`,
  ].join("\n");
}

/**
 * Context used while rendering the font CSS for a build.
 */
export interface FontStyleBuildContext {
  /** Vite root directory, used to resolve local font paths. */
  root: string;
  /** Vite `base` with a trailing slash, prepended to public URLs. */
  base: string;
}

/**
 * Resolves the public URLs that should be `rel="preload"`-ed for a local
 * font when `preload` is enabled: the same `base + relative` URL the
 * `@font-face` rule points at, restricted to the `.woff2` format (the format
 * preload actually benefits from). Returns `[]` for CDN presets and when
 * preloading is off.
 */
export function resolvePreloadUrls(
  font: ResolvedFontOptions,
  cssContext: FontStyleBuildContext,
): string[] {
  if (!font.preload || font.local === undefined) {
    return [];
  }
  return resolveLocalFontFiles(font.local, cssContext.root)
    .filter((file) => file.format === "woff2")
    .map((file) => `${cssContext.base}${file.rel}`);
}

/**
 * Generates the complete inline stylesheet for a resolved font config: the
 * `@font-face` rules (CDN presets or emitted local assets) plus, when
 * `injectToBody` is enabled, the `:root`/`body` micro-injection.
 */
export function buildFontStyleCss(
  font: ResolvedFontOptions,
  cssContext: FontStyleBuildContext,
): string {
  const faces: FontFaceLike[] =
    font.local !== undefined
      ? resolveLocalFontFiles(font.local, cssContext.root).map((file) => ({
          weight: 400,
          url: `${cssContext.base}${file.rel}`,
          format: file.format,
        }))
      : FONT_DEFINITIONS[font.family as FontFamily].faces.map((face) => ({
          weight: face.weight,
          url: face.url,
          format: "woff2",
        }));

  const faceCss = renderFontFaceCss(font.family, faces, font.display);
  return font.injectToBody ? `${faceCss}\n${renderBodyFontInlineCss(font.family)}` : faceCss;
}