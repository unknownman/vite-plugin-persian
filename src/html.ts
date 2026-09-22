import type { ResolvedPersianOptions } from "./types.js";

/**
 * Matches the opening `<html>` tag and captures its attribute section.
 *
 * The `"`/`'` alternatives ensure a `>` that appears *inside* a quoted
 * attribute value (e.g. `data-json="{...}"`) does not terminate the tag
 * prematurely. The `i` flag accepts `<HTML>` and mixed-case spellings.
 * Closing tags (`</html>`) are not matched because of the `\b` word boundary.
 */
const OPEN_HTML_TAG_PATTERN = /<html\b((?:[^>"']|"[^"]*"|'[^']*')*)\s*>/i;

/**
 * Matches a single attribute of the given name in any quote style, or even
 * with no value at all (e.g. `lang`).
 */
function attributePattern(attributeName: string): RegExp {
  return new RegExp(
    `\\b${attributeName}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`,
    "i",
  );
}

/**
 * Sets or updates a single attribute within a raw attribute string.
 *
 * Existing attributes (and their order) are preserved. When the attribute is
 * missing it is appended to the end. No `<html` / `>` delimiters are touched.
 */
function setAttribute(attrs: string, attributeName: string, value: string): string {
  const pattern = attributePattern(attributeName);
  const replacement = `${attributeName}="${value}"`;

  if (pattern.test(attrs)) {
    // Replace the existing value while preserving its position and the
    // surrounding attribute text. The function form avoids `$` substitution.
    return attrs.replace(pattern, () => replacement);
  }

  // Attribute does not exist yet — append it, keeping the document tidy.
  const trimmed = attrs.trim();
  return trimmed.length === 0 ? replacement : `${trimmed} ${replacement}`;
}

/**
 * Creates a Vite `transformIndexHtml` hook that injects or updates the
 * `lang` and `dir` attributes on the `<html>` tag.
 *
 * Each attribute is only touched when the corresponding option is provided
 * (i.e. not `undefined`), so a partially resolved config behaves predictably.
 * The rest of the document — including every other `<html>` attribute — is
 * passed through untouched. If no opening `<html>` tag is found, the original
 * HTML string is returned as-is.
 *
 * @param options Resolved HTML options (`lang`, `dir`).
 * @returns A handler compatible with Vite's `transformIndexHtml` hook.
 */
export function createHtmlTransformer(
  options: ResolvedPersianOptions["html"],
): (html: string) => string {
  return (html: string): string => {
    const match = html.match(OPEN_HTML_TAG_PATTERN);

    // Defensive: no <html> tag, hand the document back unchanged.
    if (!match) {
      return html;
    }

    const [openingTag = "", attrs = ""] = match;
    let nextAttrs = attrs.trim();

    if (options.lang !== undefined) {
      nextAttrs = setAttribute(nextAttrs, "lang", options.lang);
    }
    if (options.dir !== undefined) {
      nextAttrs = setAttribute(nextAttrs, "dir", options.dir);
    }

    const updatedTag = nextAttrs.length === 0 ? "<html>" : `<html ${nextAttrs}>`;
    return html.replace(openingTag, updatedTag);
  };
}