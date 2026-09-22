import { intlEngine } from "./engines/intl.js";
import { jalaaliJsEngine } from "./engines/jalaali-js.js";
import type {
  CalendarEngine,
  DateInput,
  FormatJalali,
  GetMonthName,
  IsLeapJalaliYear,
  JalaliEngine,
  JalaliVirtualModule,
  MonthNameLocale,
  ToGregorian,
  ToJalali,
} from "../types.js";

/**
 * Full Persian month names, 1-indexed (Farvardin … Esfand).
 */
const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/**
 * English month names, 1-indexed.
 */
const ENGLISH_MONTH_NAMES = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
] as const;

/**
 * Abbreviated month names. Persian has no conventional abbreviations, so the
 * full name is used for `MMM` too.
 */
const PERSIAN_SHORT_MONTH_NAMES: readonly string[] = PERSIAN_MONTH_NAMES;

/**
 * The engines available by name. Mapped from the `jalali.engine` option.
 */
const ENGINES: Record<JalaliEngine, CalendarEngine> = {
  "jalaali-js": jalaaliJsEngine,
  intl: intlEngine,
};

/**
 * Turns any supported input into a valid `Date`.
 *
 * - `Date` is used as-is.
 * - `string` / `number` are handed to `new Date()` (ISO strings, UNIX ms).
 * - Invalid values throw a descriptive error instead of silently failing.
 */
export function toDate(value: DateInput): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid Gregorian date: "${value.toString()}"`);
    }
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Gregorian date input: ${String(value)}`);
  }
  return date;
}

/**
 * Resolves the month number against the requested locale.
 */
function monthName(month: number, locale: MonthNameLocale): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Expected an integer between 1 and 12.`);
  }
  const index = month - 1;
  const names = locale === "fa" ? PERSIAN_MONTH_NAMES : ENGLISH_MONTH_NAMES;
  // `index` is provably 0–11 after the guard above, so the lookup is safe.
  return names[index]!;
}

/**
 * Pads a number to at least two digits (e.g. `5` → `"05"`).
 */
function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Tokens are matched longest-first so `YYYY` wins over `YY` and `MMMM` over
 * `MMM` when they share a prefix.
 */
const FORMAT_TOKEN_PATTERN = /YYYY|MMMM|MMM|YY|MM|DD|d/g;

/**
 * Formats a date through the given engine. All month-name tokens render in
 * Persian; digits remain Latin (use the text module for digit conversion).
 */
function formatWithEngine(
  engine: CalendarEngine,
  input: DateInput,
  pattern: string,
): string {
  const jalaliDate = engine.toJalali(toDate(input));

  return pattern.replace(FORMAT_TOKEN_PATTERN, (token) => {
    switch (token) {
      case "YYYY":
        return String(jalaliDate.year);
      case "YY":
        return String(jalaliDate.year).slice(-2);
      case "MMMM":
        return monthName(jalaliDate.month, "fa");
      case "MMM":
        // Analogous to `monthName`, `month` is always 1–12 here.
        return PERSIAN_SHORT_MONTH_NAMES[jalaliDate.month - 1]!;
      case "MM":
        return pad2(jalaliDate.month);
      case "DD":
        return pad2(jalaliDate.day);
      case "d":
        return String(jalaliDate.day);
      default:
        return token;
    }
  });
}

/**
 * Builds the `virtual:persian/jalali` module surface for a specific engine.
 *
 * @param engine Engine name (`"jalaali-js"` default) or a custom
 *   `CalendarEngine` implementation. Passing an engine object directly makes
 *   the module easy to test and extend.
 */
export function createJalaliModule(
  engine: JalaliEngine | CalendarEngine = "jalaali-js",
): JalaliVirtualModule {
  const resolved: CalendarEngine =
    typeof engine === "string" ? resolveEngine(engine) : engine;

  const toJalali: ToJalali = (input) => resolved.toJalali(toDate(input));

  const toGregorian: ToGregorian = (jy, jm, jd) => resolved.toGregorian(jy, jm, jd);

  const isLeapJalaliYear: IsLeapJalaliYear = (year) => resolved.isLeapYear(year);

  const getMonthName: GetMonthName = (month, locale = "fa") => monthName(month, locale);

  const formatJalali: FormatJalali = (input, pattern = "YYYY/MM/DD") =>
    formatWithEngine(resolved, input, pattern);

  return { formatJalali, toJalali, toGregorian, isLeapJalaliYear, getMonthName };
}

/**
 * Looks up a named engine, throwing on unknown identifiers.
 */
export function resolveEngine(engine: JalaliEngine): CalendarEngine {
  const resolved = ENGINES[engine];
  if (!resolved) {
    throw new Error(`Unknown Jalali engine: "${String(engine)}".`);
  }
  return resolved;
}

/**
 * The module bound to the default (`jalaali-js`) engine.
 */
export const jalaliModule: JalaliVirtualModule = createJalaliModule();