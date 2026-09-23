import type { HtmlTagDescriptor } from "vite";
import type { FontDisplay, FontFamily, FontOptions, ResolvedFontOptions } from "./types.js";

/** CDN origin all font assets are served from (used for `preconnect`). */
const FONT_CDN_ORIGIN = "https://cdn.jsdelivr.net";

/** Base path for the `Vazirmatn` webfonts on jsDelivr. */
const VAZIRMATN_BASE = "https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/fonts/webfonts";

/** Base path for the `Sahel` webfonts on jsDelivr. */
const SAHEL_BASE = "https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@v1.0.0-alpha14/dist";

/** Base path for the `Samim` webfonts on jsDelivr. */
const SAMIM_BASE = "https://cdn.jsdelivr.net/gh/rastikerdar/samim-font@v4.0.5/dist";

/**
 * A single `@font-face` source for one weight of a family.
 */
export interface FontSource {
  /** CSS `font-weight` the face is registered for. */
  weight: number;
  /** Absolute `woff2` URL the face points at. */
  url: string;
}

/**
 * Everything the plugin needs to inject a font family: its registered name
 * (which is also what consumers write in `font-family`) and the faces that
 * cover the typographically meaningful weight range.
 */
export interface FontDefinition {
  /** Font-family name used inside `@font-face` (and by consumers). */
  family: FontFamily;
  /** The faces the plugin injects. */
  faces: readonly FontSource[];
}

/**
 * Registry of the webfont families the plugin can serve, keyed by the
 * `FontFamily` option. Each family resolves to highly available CDN assets so
 * nothing has to be self-hosted and no network access is needed at build time.
 *
 * The injected face list is intentionally small (Regular / Bold + a black
 * weight where available); consumers who need the whole weight spectrum can
 * still load the vendor stylesheet themselves.
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

/**
 * Acceptable values for the `font.family` option, for error messages.
 */
const VALID_FAMILIES = Object.keys(FONT_DEFINITIONS) as FontFamily[];

/**
 * Validates and normalizes user-supplied font options.
 *
 * @throws {Error} when the family or display value is unknown.
 */
export function resolveFontOptions(font: FontOptions): ResolvedFontOptions {
  if (!FONT_DEFINITIONS.hasOwnProperty(font.family)) {
    throw new Error(
      `vite-plugin-persian: unknown font family ${JSON.stringify(font.family)}. ` +
        `Supported families: ${VALID_FAMILIES.join(", ")}.`,
    );
  }
  const display = font.display ?? "swap";
  if (!FONT_DISPLAY_VALUES.includes(display)) {
    throw new Error(
      `vite-plugin-persian: invalid font display ${JSON.stringify(display)}. ` +
        `Supported values: ${FONT_DISPLAY_VALUES.join(", ")}.`,
    );
  }
  return { family: font.family, display };
}

/**
 * Renders the `@font-face` rules for a resolved font family.
 *
 * `font-display` is emitted directly from the resolved options, and the
 * `local(...)` source lets browsers reuse an already installed copy of the
 * font instead of downloading the webfont.
 */
export function buildFontFaceCss(font: ResolvedFontOptions): string {
  const definition = FONT_DEFINITIONS[font.family];
  return definition.faces
    .map(
      (face) =>
        `@font-face {` +
        `font-family: ${JSON.stringify(definition.family)};` +
        `font-style: normal;` +
        `font-weight: ${face.weight};` +
        `font-display: ${font.display};` +
        `src: local(${JSON.stringify(definition.family)}), url(${JSON.stringify(face.url)}) format("woff2");` +
        `}`,
    )
    .join("\n");
}

/**
 * Builds the HTML tags that activate the font feature: a `preconnect` hint to
 * the CDN plus an inline `<style>` holding the `@font-face` rules. Packaging
 * the faces as inline CSS keeps the output self-contained and CSP-friendly.
 */
export function createFontTags(font: ResolvedFontOptions): HtmlTagDescriptor[] {
  return [
    {
      tag: "link",
      attrs: {
        rel: "preconnect",
        href: FONT_CDN_ORIGIN,
        crossorigin: "",
      },
      injectTo: "head",
    },
    {
      tag: "style",
      children: buildFontFaceCss(font),
      injectTo: "head",
    },
  ];
}