/**
 * Core text utilities for `vite-plugin-persian`.
 *
 * Everything in this file is a pure function: no I/O, no global state, and
 * the same input always yields the same output.
 */

/**
 * Persian/Extended Arabic-Indic digits (U+06F0–U+06F9), index-aligned with
 * the Latin digits they replace (`۰` ↔ `0`, …, `۹` ↔ `9`).
 */
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

/**
 * ASCII digits (0–9) mapped to their Persian equivalents, used for quick
 * single-character rewrites.
 */
const LATIN_TO_PERSIAN: ReadonlyMap<string, string> = new Map(
  PERSIAN_DIGITS.map((persian, index) => [String(index), persian]),
);

/**
 * Floors in the Persian (U+06F0) and Arabic-Indic (U+0660) digit ranges.
 * The Arabic range matters because many Persian strings are typed using
 * Arabic-Indic numerals, which are subtly different from the Persian ones.
 */
const DIGIT_RANGES = [
  { start: 0x06f0, end: 0x06f9 },
  { start: 0x0660, end: 0x0669 },
] as const;

/**
 * Converts every ASCII digit (`0`–`9`) in the input to the equivalent Persian
 * digit (`۰`–`۹`).
 *
 * - Accepts strings and numbers; numbers are stringified first.
 * - Handles decimals and negative signs naturally (`.` and `-` are left
 *   untouched, only the digit characters change).
 * - All non-digit characters (including Persian/Arabic digits already
 *   present) pass through unchanged.
 *
 * @example
 *   toPersianDigits("Price: 12.5$") // "Price: ۱۲.۵$"
 *   toPersianDigits(-7)             // "-۷"
 */
export function toPersianDigits(input: string | number): string {
  const str = input.toString();
  return str.replace(/[0-9]/g, (digit) => LATIN_TO_PERSIAN.get(digit) ?? digit);
}

const [PERSIAN_RANGE, ARABIC_RANGE] = DIGIT_RANGES;

/**
 * Matches every Persian and Arabic-Indic digit in one pass, so digit
 * conversion stays a single `replace` call. The `u` flag lets the class use
 * explicit 4-hex `\u{XXXX}` escapes, keeping the source unambiguous.
 */
const PERSIAN_AND_ARABIC_DIGITS = /[\u{06F0}-\u{06F9}\u{0660}-\u{0669}]/gu;

/**
 * Converts Persian (`۰`–`۹`) and Arabic-Indic (`٠`–٩) digits in the input to
 * ASCII digits (`0`–`9`).
 *
 * - Accepts strings and numbers; numbers are stringified first (they already
 *   contain ASCII digits, so this is mostly useful for string inputs).
 * - Every other character is left exactly as-is.
 *
 * @example
 *   toEnglishDigits("قیمت: ۱۲۳/۴۵۶") // "قیمت: 123/456"
 *   toEnglishDigits("١٢٣")            // "123"
 */
export function toEnglishDigits(input: string | number): string {
  const str = input.toString();
  return str.replace(PERSIAN_AND_ARABIC_DIGITS, (char) => {
    const code = char.codePointAt(0)!;
    // Which range does this digit belong to? Subtracting the range's base
    // yields the 0–9 value regardless of Persian vs Arabic-Indic digits.
    const base =
      code >= PERSIAN_RANGE.start && code <= PERSIAN_RANGE.end
        ? PERSIAN_RANGE.start
        : ARABIC_RANGE.start;
    return String(code - base);
  });
}

/**
 * Characters that differ between written Arabic and written Persian, mapped
 * Arabic → Persian.
 */
const ARABIC_TO_PERSIAN: ReadonlyMap<string, string> = new Map<string, string>([
  ["\u064a", "\u06cc"], // Arabic yeh (ي) → Persian yeh (ی)
  ["\u0643", "\u06a9"], // Arabic kaf (ك) → Persian kaf (ک)
]);

const ARABIC_CHARS_TO_REPLACE = new RegExp(`[${[...ARABIC_TO_PERSIAN.keys()].join("")}]`, "g");

/**
 * Normalizes common Persian text issues:
 *
 * - Maps the Arabic letters `ي` (yeh) and `ك` (kaf) to their Persian
 *   equivalents `ی` and `ک`.
 * - Collapses runs of whitespace (spaces, tabs, newlines) into a single space
 *   and trims both ends.
 *
 * Half-spaces (ZWNJ, U+200C) are intentionally preserved — they are the
 * correct "space" in Persian orthography and must not be replaced. This
 * function is deliberately conservative: no hyphenation, no quote
 * replacement, no guesswork.
 *
 * @example
 *   normalizePersianText("يك كتاب  خوب") // "یک کتاب خوب"
 */
export function normalizePersianText(input: string): string {
  return input
    .replace(ARABIC_CHARS_TO_REPLACE, (char) => ARABIC_TO_PERSIAN.get(char) ?? char)
    .replace(/\s+/g, " ")
    .trim();
}