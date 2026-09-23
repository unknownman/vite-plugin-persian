/**
 * Currency helpers for Iranian projects — Toman and Rial.
 *
 * Pure, side-effect-free functions. Inputs may be English, Persian, or
 * Arabic-Indic digits, optionally grouped with separators. Both converters
 * return `NaN` for invalid input; the formatter returns an empty string so
 * callers can render a placeholder instead of garbage.
 *
 * @see convert (Rial ↔ Toman): 1 Toman = 10 Rial.
 */
import { toEnglishDigits, toPersianDigits } from "./runtime.js";
import type { CurrencyFormatOptions } from "../types.js";

/**
 * An amount expressed as an optional sign, whole digits, and an optional
 * decimal fraction. Anything else (letters, currency words, exponents, …) is
 * rejected so `Number`'s lenient parsing never surprises us.
 */
const NUMERIC_PATTERN = /^[+-]?\d+(?:\.\d+)?$/;

/**
 * Grouping glyphs accepted and stripped from textual input: ASCII comma,
 * Arabic thousands separator (U+066C), and the Arabic comma (U+060C).
 */
const GROUP_SEPARATORS = /[\s,،٬]/g;

/**
 * Parses an amount into a finite number.
 *
 * - Numbers pass through as-is (`Infinity`/`NaN` normalize to `NaN`).
 * - Strings are digit-normalized first, then separators/whitespace are
 *   stripped before a strict numeric check.
 *
 * Returns `NaN` for anything that is not a clean numeric value.
 */
function parseAmount(input: string | number): number {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : Number.NaN;
  }
  if (input == null) {
    return Number.NaN;
  }
  const normalized = toEnglishDigits(input).replace(GROUP_SEPARATORS, "");
  return NUMERIC_PATTERN.test(normalized) ? Number(normalized) : Number.NaN;
}

/**
 * Group-separator glyph for a given numeral mode: `,` for English digits,
 * `٬` (U+066C, the Persian thousands separator) for Persian digits.
 */
function groupSeparator(digits: "persian" | "english"): string {
  return digits === "persian" ? "٬" : ",";
}

/**
 * Inserts a thousands-group separator into a digit string.
 */
function groupDigits(intDigits: string, separator: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Converts a Rial figure to Toman by dividing by 10.
 *
 * The input is treated as Rial and may use English or Persian/Arabic digits,
 * with or without group separators. Invalid input yields `NaN`.
 *
 * @example
 *   toToman(10000)             // 1000
 *   toToman("۱٬۰۰۰٬۰۰۰")       // 100000
 */
export function toToman(amount: string | number): number {
  return parseAmount(amount) / 10;
}

/**
 * Converts a Toman figure to Rial by multiplying by 10.
 *
 * The input is treated as Toman and may use English or Persian/Arabic digits,
 * with or without group separators. Invalid input yields `NaN`.
 *
 * @example
 *   toRial(1000)        // 10000
 *   toRial("۲۵۰٬۰۰۰")    // 2500000
 */
export function toRial(amount: string | number): number {
  return parseAmount(amount) * 10;
}

/**
 * Formats an amount as a Persian currency string.
 *
 * The amount is interpreted in the requested unit (the conversion helpers
 * `toToman`/`toRial` handle Rial ↔ Toman separately; this function only
 * renders). Values are rounded to the nearest whole number.
 *
 * Options:
 * - `unit` (default `'تومان'`): currency name appended to the output.
 * - `digits` (default `'persian'`): Persian vs English numerals.
 * - `separator` (default `true`): thousands-group separators.
 *
 * Invalid input returns an empty string (`""`).
 *
 * @example
 *   formatCurrency(12500000)                       // "۱۲٬۵۰۰٬۰۰۰ تومان"
 *   formatCurrency(12500000, { digits: "english" }) // "12,500,000 تومان"
 *   formatCurrency(2500000, { unit: "ریال" })       // "۲٬۵۰۰٬۰۰۰ ریال"
 */
export function formatCurrency(
  amount: string | number,
  options: CurrencyFormatOptions = {},
): string {
  const value = parseAmount(amount);
  if (!Number.isFinite(value)) {
    return "";
  }

  const { unit = "تومان", digits = "persian", separator = true } = options;
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const numerals = String(Math.abs(rounded));
  const grouped = separator ? groupDigits(numerals, groupSeparator(digits)) : numerals;
  const body = `${sign}${grouped}`;
  const rendered = digits === "persian" ? toPersianDigits(body) : body;
  return `${rendered} ${unit}`;
}