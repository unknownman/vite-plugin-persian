/**
 * Represents a single date in the Jalali (Persian/Solar Hijri) calendar.
 *
 * Months are 1-indexed, matching the Persian calendar convention where
 * Farvardin = 1, Ordibehesht = 2, ..., Esfand = 12.
 */
export interface JalaliDate {
  /** Jalali year (e.g. `1403`) */
  year: number;
  /** Jalali month, 1–12 (1 = Farvardin, 12 = Esfand) */
  month: number;
  /** Day of the month, 1–31 depending on the month and leap year */
  day: number;
}

/**
 * Returns a `JalaliDate` for the given Gregorian date.
 */
export type ToJalali = (gregorianDate: Date | string) => JalaliDate;

/**
 * Converts a `JalaliDate` back to a Gregorian `Date`.
 */
export type ToGregorian = (jalaliDate: JalaliDate) => Date;

/**
 * Tokens supported by `JalaliDateFormat` patterns.
 */
export type JalaliFormatToken = "YYYY" | "YY" | "MMMM" | "MMM" | "MM" | "DD" | "d";

/**
 * A pattern string composed of `JalaliFormatToken` sequences and literal text.
 */
export type JalaliDateFormat = string;

/**
 * Formats a `JalaliDate` using a pattern of tokens (e.g. `"YYYY/MM/DD"`).
 *
 * Supported tokens:
 * - `YYYY` – full year (e.g. `1403`)
 * - `YY`   – two-digit year (e.g. `03`)
 * - `MMMM` – full month name, e.g. «مهر»
 * - `MMM`  – abbreviated month name
 * - `MM`   – two-digit month (e.g. `07`)
 * - `DD`   – two-digit day (e.g. `05`)
 * - `d`    – day without leading zero (e.g. `5`)
 */
export type FormatJalali = (date: JalaliDate, pattern?: JalaliDateFormat) => string;

/**
 * Returns `true` when the given Jalali year is a leap year.
 */
export type IsLeapJalaliYear = (year: number) => boolean;

/**
 * Length variant for month names.
 */
export type MonthNameFormat = "short" | "long";

/**
 * Resolves a month number (1–12) to its Persian name (e.g. «مهر»).
 *
 * - `long`  – full name, e.g. «مهر»
 * - `short` – abbreviated name, e.g. «مه»
 */
export type GetMonthName = (month: number, format?: MonthNameFormat) => string;

/**
 * The functions exposed by the `virtual:persian/jalali` module.
 */
export interface JalaliVirtualModule {
  /** Formats a `JalaliDate` using a pattern of tokens. */
  formatJalali: FormatJalali;
  /** Converts a Gregorian date to a `JalaliDate`. */
  toJalali: ToJalali;
  /** Converts a `JalaliDate` to a Gregorian `Date`. */
  toGregorian: ToGregorian;
  /** Returns `true` when the given Jalali year is a leap year. */
  isLeapJalaliYear: IsLeapJalaliYear;
  /** Resolves a month number to its Persian name. */
  getMonthName: GetMonthName;
}

/**
 * Converts digits in the input to Persian/Extended Arabic-Indic numerals (۰۱۲۳۴۵۶۷۸۹).
 */
export type ToPersianDigits = (value: string | number) => string;

/**
 * Converts Persian/Arabic-Indic digits in the input to English numerals (0123456789).
 */
export type ToEnglishDigits = (value: string | number) => string;

/**
 * Normalizes a Persian string by unifying similar characters (ياک, etc.) and
 * collapsing whitespace.
 */
export type NormalizePersianText = (value: string) => string;

/**
 * The functions exposed by the `virtual:persian/text` module.
 */
export interface TextVirtualModule {
  /** Converts digits to Persian numerals. */
  toPersianDigits: ToPersianDigits;
  /** Converts Persian/Arabic-Indic digits to English numerals. */
  toEnglishDigits: ToEnglishDigits;
  /** Normalizes Persian characters and whitespace. */
  normalizePersianText: NormalizePersianText;
}

/**
 * Calendar engine used by the Jalali virtual module.
 */
export type JalaliEngine = "jalaali-js" | "intl";

/**
 * User-facing options for {@link PersianOptions.html}.
 */
export interface HtmlOptions {
  /**
   * Sets the `lang` attribute on the `<html>` tag.
   * @default 'fa'
   */
  lang?: string;
  /**
   * Sets the `dir` attribute on the `<html>` tag.
   * @default 'rtl'
   */
  dir?: "rtl" | "ltr";
}

/**
 * User-facing options for {@link PersianOptions.jalali}.
 */
export interface JalaliOptions {
  /**
   * Enable/disable the Jalali virtual module.
   * @default true
   */
  enabled?: boolean;
  /**
   * Calendar engine to use.
   *
   * - `'jalaali-js'`: Reliable and consistent (recommended, default)
   * - `'intl'`: Uses native `Intl.DateTimeFormat` (lighter, but less consistent across environments)
   *
   * @default 'jalaali-js'
   */
  engine?: JalaliEngine;
}

/**
 * User-facing options for {@link PersianOptions.text}.
 */
export interface TextOptions {
  /**
   * Enable/disable the text virtual module.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Configuration options for the `vite-plugin-persian` plugin.
 *
 * All sections are optional; defaults are applied internally.
 */
export interface PersianOptions {
  /** HTML-related settings (applied via `transformIndexHtml`). */
  html?: HtmlOptions;
  /** Jalali (Persian calendar) settings. */
  jalali?: JalaliOptions;
  /** Text utilities (Persian digits + normalization). */
  text?: TextOptions;
}

/**
 * Resolved options after defaults have been applied — every field is required.
 */
export interface ResolvedPersianOptions {
  /** Resolved HTML settings. */
  html: Required<HtmlOptions>;
  /** Resolved Jalali settings. */
  jalali: Required<JalaliOptions>;
  /** Resolved text settings. */
  text: Required<TextOptions>;
}