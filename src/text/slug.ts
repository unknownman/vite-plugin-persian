/**
 * Persian SEO-friendly slug generation (`v0.4.0`).
 *
 * Pure, side-effect-free utility. Builds a URL-safe, lowercase-by-default slug
 * from any Persian/English text:
 *
 * - Keeps Persian letters, English letters, and digits (Persian and
 *   Arabic-Indic numerals included) intact.
 * - Rewrites every other character — spaces, tabs, underscores, existing
 *   dashes, punctuation, currency signs, ZWNJ half-spaces, emojis — as a
 *   word boundary separator, collapsing runs into a single separator.
 * - Trims leading/trailing separators, so the result never starts or ends
 *   with the separator.
 *
 * The Arabic script also carries **invisible** typography (harakat/
 * tashkeel diacritics, tatweel `ـ`, superscript alef) and ZWNJ — these are
 * dropped rather than turned into separators, so `"دَست"` → `"دست"` and
 * `"می‌خواهم"` → `"می-خواهم"`.
 */

import type { ToPersianSlug } from "../types.js";

/** Letters and digits that belong in a slug (ASCII + Arabic/Persian block). */
const SLUG_SAFE_CHARACTER = /[a-z0-9\u0600-\u06ff]/i;

/**
 * Arabic subset that is *not* a letter/digit despite living in
 * `\u0600-\u06FF`: tatweel (ـ U+0640), the harakat/tashkeel combining marks
 * (U+064B–U+065F), superscript alef (U+0670), the Arabic letter mark (bidi
 * control, U+061C), and the Quranic annotation marks (U+06D6–U+06ED). These
 * are invisible and dropped, not separated.
 */
const SLUG_INVISIBLE_CHARACTER = /[\u061c\u0640\u064b-\u065f\u0670\u06d6-\u06ed]/;

/**
 * Arabic *punctuation* that still lives in the `\u0600-\u06FF` letter block —
 * the Persian/Dari comma (، U+060C), semicolon (؛ U+061B), question mark
 * (؟ U+061F), percent (٪ U+066A), decimal (٫ U+066B), thousands (٬ U+066C)
 * separators, and asterisk (٭ U+066D). These are word boundaries, not
 * letters, so they collapse into the separator like any other punctuation.
 */
const SLUG_BOUNDARY_CHARACTER = /[\u060c\u061b\u061e\u061f\u066a-\u066d]/;

/**
 * Generates a clean, URL-safe, SEO-optimized slug from Persian/English text.
 *
 * @param text The title or string to slugify (empty string yields `""`).
 * @param options
 *  - `lowercase` — lowercase English letters (`true` by default, e.g.
 *    `"Vite"` → `"vite"`). Persian letters are unaffected.
 *  - `separator` — the word-boundary character/string (`"-"` by default).
 *
 * @example
 * ```ts
 * toPersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
 * // "آموزش-جامع-vite-نسخه-جدید-بخش-۱"
 *
 * toPersianSlug("سلام   دنیا!!!", { separator: "_" }); // "سلام_دنیا"
 * toPersianSlug("MIKHAIL", { lowercase: false });      // "MIKHAIL"
 * ```
 *
 * @throws `RangeError` when `separator` is an empty string.
 */
export const toPersianSlug: ToPersianSlug = (text, options = {}) => {
  const lowercase = options.lowercase ?? true;
  const separator = options.separator ?? "-";
  if (separator === "") {
    throw new RangeError("vite-plugin-persian: toPersianSlug separator must not be empty");
  }

  let out = "";
  let separatorPending = false;

  for (const character of text) {
    if (SLUG_INVISIBLE_CHARACTER.test(character)) {
      // Diacritics, tatweel, and Quranic marks carry no word meaning: drop
      // them without opening a boundary.
      continue;
    }
    if (SLUG_BOUNDARY_CHARACTER.test(character)) {
      // Arabic punctuation (، ؛ ؟ ٪ ٫ ٬ ٭) is a boundary just like ASCII
      // punctuation.
      separatorPending = true;
      continue;
    }
    if (SLUG_SAFE_CHARACTER.test(character)) {
      if (separatorPending && out !== "") {
        out += separator;
      }
      separatorPending = false;
      out += lowercase ? character.toLowerCase() : character;
    } else {
      // Anything else is a word boundary: spaces, tabs/newlines,
      // underscores, existing dashes, punctuation, currency signs, ZWNJ,
      // emojis, … Runs collapse into a single separator, and leading/
      // trailing separators are trimmed automatically.
      separatorPending = true;
    }
  }

  return out;
};