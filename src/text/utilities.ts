/**
 * Practical utilities for Iranian web applications: National Code, mobile
 * number, and number-to-Persian-words conversion.
 *
 * Everything in this file is a pure function: no I/O, no global state, and
 * the same input always yields the same output.
 */
import { toEnglishDigits } from "./runtime.js";

/**
 * Validates a 10-digit Iranian National Code (کد ملی).
 *
 * Implements the official checksum: the first nine digits are weighted with
 * `10` down to `2`, the remainder of their sum modulo 11 decides the tenth
 * (verification) digit, and the all-same-digit sequences that the arithmetic
 * happens to accept (e.g. `1111111111`) are rejected.
 *
 * Digits are normalized first (Persian/Arabic-Indic are converted and any
 * non-numeric characters are stripped), so dirty input like `"0010-042 911"`
 * is handled safely — leading zeros are preserved because the string is never
 * coerced through `Number`.
 *
 * @param code A 10-digit Iranian National Code.
 * @returns `true` when the code matches the official algorithm.
 *
 * @example
 * ```ts
 * isNationalCode("0010042911"); // true
 * isNationalCode("1234567890"); // false
 * ```
 */
export function isNationalCode(code: string): boolean {
  const digits = toEnglishDigits(code).replace(/\D+/g, "");
  if (digits.length !== 10) {
    return false;
  }
  if (digits.split("").every((char) => char === digits[0])) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index++) {
    sum += Number(digits[index]) * (10 - index);
  }
  const remainder = sum % 11;
  const check = remainder < 2 ? remainder : 11 - remainder;
  return check === Number(digits[9]);
}

/**
 * Iranian mobile numbers always have eleven digits and the form `09x…`:
 *
 * - `0910–0919` MCI (همراه اول)
 * - `0920–0922` Rightel (رایتل)
 * - `0930–0939` Irancell / Taliya (ایرانسل / تالیا)
 * - `0901–0902` reserved / legacy (CDMA)
 * - `0990–0993` newer MCI / Irancell prefixes
 *
 * so the check is on the region codes `091`, `092`, `093`, `090`, and `099`.
 */
const MOBILE_NUMBER_PATTERN = /^09[01239]\d{8}$/;

/**
 * Normalizes an Iranian mobile number into the clean standard form `09xxxxxxxxx`.
 *
 * Accepts the common written variations and strips any non-numeric
 * characters, returning `""` when the input does not represent a valid
 * Iranian mobile number:
 *
 * - `09123456789` → `09123456789` (already standard)
 * - `+989123456789` → `09123456789`
 * - `00989123456789` → `09123456789`
 * - `9123456789` → `09123456789`
 * - `(0912) 345 6789` → `09123456789`
 *
 * @param phone The phone number in any common Iranian format.
 * @returns The canonical `09xxxxxxxxx` string, or `""` for invalid input.
 *
 * @example
 * ```ts
 * normalizeMobileNumber("+98 912 345 6789"); // "09123456789"
 * ```
 */
export function normalizeMobileNumber(phone: string): string {
  const digits = toEnglishDigits(phone).replace(/\D+/g, "");

  let candidate = digits;
  if (candidate.startsWith("00") && candidate.length === 14) {
    candidate = candidate.slice(2); // "0098…" → "98…"
  }
  if (candidate.startsWith("98") && candidate.length === 12) {
    candidate = candidate.slice(2); // "+98…" → "9123456789"
  }
  if (candidate.startsWith("9") && candidate.length === 10) {
    candidate = `0${candidate}`; // bare "9123456789" → "09123456789"
  }

  return MOBILE_NUMBER_PATTERN.test(candidate) ? candidate : "";
}

/**
 * Checks whether a string represents a valid Iranian mobile number across all
 * operators. Accepts the same variations as `normalizeMobileNumber`.
 *
 * @param phone The phone number in any common Iranian format.
 * @returns `true` when the input normalizes to an `09xxxxxxxxx` number.
 *
 * @example
 * ```ts
 * isMobileNumber("+989123456789"); // true
 * isMobileNumber("09123456789");   // true
 * isMobileNumber("0912");          // false
 * ```
 */
export function isMobileNumber(phone: string): boolean {
  return normalizeMobileNumber(phone) !== "";
}

/** Persian units, 1-indexed (`""` is the unused zero slot). */
const UNITS = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
] as const;

/** Persian teens, `10`–`19` (index offset by 10). */
const TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
] as const;

/** Persian tens, index-aligned with the tens digit (`2` → `بیست`, … `9` → `نود`). */
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"] as const;

/** Persian hundreds (۱–۹), index-aligned. */
const HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
] as const;

/**
 * Scale words for every three-digit group, index-aligned with `1000^n`.
 * Covers up to 10²⁴; anything larger still converts (the group's scale is
 * omitted) rather than failing.
 */
const SCALES = [
  "",
  "هزار",
  "میلیون",
  "میلیارد",
  "تریلیون",
  "کوادریلیون",
  "کوینتیلیون",
  "سکستیلیون",
  "سپتیلیون",
] as const;

/** Renders a 1–99 value (`10` → `ده`, `21` → `بیست و یک`). */
function twoDigits(value: number): string {
  if (value < 10) {
    return UNITS[value] as string;
  }
  if (value < 20) {
    return TEENS[value - 10] as string;
  }
  const tens = Math.floor(value / 10);
  const unit = value % 10;
  const tensWord = TENS[tens] as string;
  return unit === 0 ? tensWord : `${tensWord} و ${UNITS[unit]}`;
}

/** Renders a 1–999 value (`101` → `صد و یک`, `345` → `سیصد و چهل و پنج`). */
function threeDigits(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (rest === 0) {
    return HUNDREDS[hundreds] as string;
  }
  const restWord = twoDigits(rest);
  if (hundreds === 0) {
    return restWord;
  }
  return `${HUNDREDS[hundreds]} و ${restWord}`;
}

/**
 * Splits a non-negative integer into its scaled group words in descending
 * order (e.g. `12500` → `["دوازده هزار", "پانصد"]`).
 */
function groupWords(value: bigint): string[] {
  const parts: string[] = [];
  let groupIndex = 0;
  let remaining = value;

  while (remaining > 0n) {
    const group = Number(remaining % 1000n);
    if (group !== 0) {
      const scale = SCALES[groupIndex] as string | undefined;
      const words = scale ? `${threeDigits(group)} ${scale}` : threeDigits(group);
      parts.unshift(words);
    }
    remaining /= 1000n;
    groupIndex++;
  }
  return parts;
}

/**
 * Reads a raw input into `{ negative, intDigits, fracDigits }`.
 *
 * - Numbers are stringified (scientific notation is expanded exactly).
 * - Strings are handled safely: Persian/Arabic-Indic digits are converted and
 *   thousands separators (`,`, `٬`, spaces) are stripped.
 * - Persian and Latin decimal separators (`٫`, `.`) split the fraction.
 *
 * Returns `null` for anything that is not a finite numeric value.
 */
function readNumeric(
  input: number | string,
): { negative: boolean; intDigits: string; fracDigits: string | null } | null {
  if (typeof input === "number" && !Number.isFinite(input)) {
    return null;
  }

  let raw = typeof input === "string" ? input : String(input);
  raw = toEnglishDigits(raw).trim();
  if (raw === "") {
    return null;
  }

  raw = raw.replace(/٫/g, "."); // Persian decimal separator
  raw = raw.replace(/[,،٬\s_]/g, ""); // thousands separators

  let negative = false;
  let intDigits: string | null = null;
  let fracDigits: string | null = null;

  const exponential = /^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(raw);
  if (exponential) {
    negative = exponential[1] === "-";
    const mantissa = exponential[2]! + (exponential[3] ?? "");
    const point = exponential[2]!.length + Number(exponential[4]!);
    if (point <= 0) {
      intDigits = "0";
      fracDigits = "0".repeat(-point) + mantissa;
    } else if (point >= mantissa.length) {
      intDigits = mantissa + "0".repeat(point - mantissa.length);
    } else {
      intDigits = mantissa.slice(0, point);
      fracDigits = mantissa.slice(point);
    }
  } else {
    const plain = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(raw);
    if (!plain) {
      return null;
    }
    negative = plain[1] === "-";
    intDigits = plain[2] as string;
    fracDigits = plain[3] ?? null;
  }

  const normalizedInt = (intDigits as string).replace(/^0+(?=\d)/, "");
  if (fracDigits !== null && fracDigits === "") {
    fracDigits = null;
  }
  return { negative, intDigits: normalizedInt || "0", fracDigits };
}

/**
 * Converts a number or numeric string into its spoken Persian text equivalent
 * (e.g. `12500` → `"دوازده هزار و پانصد"`).
 *
 * Handles:
 * - Integers up to arbitrarily large sizes (computed exactly with `BigInt`).
 * - Negative numbers (`−12500` → `"منفی دوازده هزار و پانصد"`).
 * - Zero (`0` → `"صفر"`).
 * - Decimals (`12345.67` → `"دوازده هزار و سیصد و چهل و پنج ممیز شش هفت"`).
 * - Persian/Arabic-Indic digits and thousand separators in string input.
 *
 * Unparseable input yields `""`.
 *
 * @param num The number to spell out.
 * @returns The Persian words, or `""` for invalid input.
 *
 * @example
 * ```ts
 * toNumberWords(12500);      // "دوازده هزار و پانصد"
 * toNumberWords("۱,۲۵۰٬۰۰۰"); // "یک میلیون و دویست و پنجاه هزار"
 * toNumberWords(-7);         // "منفی هفت"
 * toNumberWords(0);          // "صفر"
 * ```
 */
export function toNumberWords(num: number | string): string {
  const parsed = readNumeric(num);
  if (!parsed) {
    return "";
  }

  const magnitude = BigInt(parsed.intDigits === "0" ? "0" : parsed.intDigits);
  let words = magnitude === 0n ? "صفر" : groupWords(magnitude).join(" و ");

  if (parsed.fracDigits !== null && parsed.fracDigits.length > 0) {
    const fraction = parsed.fracDigits
      .split("")
      .map((digit) => (digit === "0" ? "صفر" : (UNITS[Number(digit)] as string)))
      .join(" ");
    words = `${words} ممیز ${fraction}`;
  }

  if (parsed.negative && words !== "صفر") {
    words = `منفی ${words}`;
  }
  return words;
}