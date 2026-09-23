/**
 * Represents a Gregorian date/time input accepted by the Jalali helpers.
 *
 * - `Date` – used as-is (local time components).
 * - `number` – treated as a UNIX timestamp in milliseconds.
 * - `string` – any string accepted by `new Date()` (e.g. an ISO 8601 string).
 */
export type DateInput = Date | string | number;

/**
 * A single date in the Jalali (Persian/Solar Hijri) calendar,
 * with 1-indexed months (1 = Farvardin … 12 = Esfand).
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
 * Converts a Gregorian date/time to a `JalaliDate` (using local time
 * components). Throws on invalid input.
 */
export type ToJalali = (gregorianDate: DateInput) => JalaliDate;

/**
 * Converts a `JalaliDate` to the equivalent Gregorian `Date`
 * (local midnight). Throws on invalid Jalali dates.
 */
export type ToGregorian = (jy: number, jm: number, jd: number) => Date;

/**
 * Tokens supported by `JalaliDateFormat` patterns.
 */
export type JalaliFormatToken = "YYYY" | "YY" | "MMMM" | "MMM" | "MM" | "DD" | "d";

/**
 * A pattern string composed of `JalaliFormatToken` sequences and literal text.
 */
export type JalaliDateFormat = string;

/**
 * Formats a date using a pattern of tokens (e.g. `"YYYY/MM/DD"`).
 *
 * Supported tokens:
 * - `YYYY` – full year (e.g. `1403`)
 * - `YY`   – two-digit year (e.g. `03`)
 * - `MMMM` – full Persian month name, e.g. «مهر»
 * - `MMM`  – abbreviated Persian month name
 * - `MM`   – two-digit month (e.g. `07`)
 * - `DD`   – two-digit day (e.g. `05`)
 * - `d`    – day without leading zero (e.g. `5`)
 */
export type FormatJalali = (date: DateInput, pattern?: JalaliDateFormat) => string;

/**
 * Returns `true` when the given Jalali year is a leap year.
 */
export type IsLeapJalaliYear = (year: number) => boolean;

/**
 * Language used to render month names.
 */
export type MonthNameLocale = "fa" | "en";

/**
 * Resolves a month number (1–12) to its name.
 *
 * - `fa` – e.g. «مهر»
 * - `en` – e.g. «Mehr»
 */
export type GetMonthName = (month: number, locale?: MonthNameLocale) => string;

/**
 * The functions exposed by the `virtual:persian/jalali` module.
 */
export interface JalaliVirtualModule {
  /** Formats a date (Date | string | number) using a pattern of tokens. */
  formatJalali: FormatJalali;
  /** Converts a Gregorian date/time to a `JalaliDate`. */
  toJalali: ToJalali;
  /** Converts a `JalaliDate` to a Gregorian `Date`. */
  toGregorian: ToGregorian;
  /** Returns `true` when the given Jalali year is a leap year. */
  isLeapJalaliYear: IsLeapJalaliYear;
  /** Resolves a month number to its name (`fa` or `en`). */
  getMonthName: GetMonthName;
}

/**
 * A minimal, engine-agnostic interface that every Jalali calendar backend
 * implements. Engines only need to know the three core primitives —
 * Gregorian→Jalali (via a `Date`), Jalali→Gregorian, and leap-year lookup —
 * while shared concerns (month names, formatting, input validation) live in
 * the Jalali module layer.
 */
export interface CalendarEngine {
  /** The engine's identity, matching the `JalaliEngine` option value. */
  readonly id: JalaliEngine;
  /** Converts a Gregorian date (local components) to a `JalaliDate`. */
  toJalali(date: Date): JalaliDate;
  /** Converts a validated Jalali date to the equivalent Gregorian `Date`. */
  toGregorian(jy: number, jm: number, jd: number): Date;
  /** Returns `true` when the given Jalali year is a leap year. */
  isLeapYear(jy: number): boolean;
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
 * Currency unit appended by `formatCurrency`.
 */
export type CurrencyUnit = "تومان" | "ریال";

/**
 * Numeral system rendered by `formatCurrency`.
 */
export type CurrencyDigitMode = "persian" | "english";

/**
 * Options for `formatCurrency`.
 */
export interface CurrencyFormatOptions {
  /**
   * Currency unit to append to the output.
   * @default 'تومان'
   */
  unit?: CurrencyUnit;
  /**
   * Numeral system used for the rendered digits.
   * @default 'persian'
   */
  digits?: CurrencyDigitMode;
  /**
   * Insert thousands-group separators.
   * @default true
   */
  separator?: boolean;
}

/**
 * Converts a Rial figure (as given) to Toman (÷ 10).
 * Invalid input yields `NaN`.
 */
export type ToToman = (amount: string | number) => number;

/**
 * Converts a Toman figure (as given) to Rial (× 10).
 * Invalid input yields `NaN`.
 */
export type ToRial = (amount: string | number) => number;

/**
 * Renders an amount with a currency unit, choosing the numeral system and
 * grouping behaviour. Invalid input yields an empty string.
 */
export type FormatCurrency = (
  amount: string | number,
  options?: CurrencyFormatOptions,
) => string;

/**
 * Validates a 10-digit Iranian National Code (کد ملی) using the official
 * checksum algorithm. Accepts dirty strings (non-digits are stripped and
 * Persian/Arabic-Indic digits are normalized first).
 */
export type IsNationalCode = (code: string) => boolean;

/**
 * Checks whether a string is a valid Iranian mobile number (`09xxxxxxxxx`)
 * across all operators, accepting `+989…`, `00989…`, and `9…` variations.
 */
export type IsMobileNumber = (phone: string) => boolean;

/**
 * Normalizes an Iranian mobile number into the canonical `09xxxxxxxxx` form,
 * or returns an empty string for invalid input.
 */
export type NormalizeMobileNumber = (phone: string) => string;

/**
 * Converts a number or numeric string into its spoken Persian text form
 * (e.g. `12500` → `"دوازده هزار و پانصد"`). Invalid input yields `""`.
 */
export type ToNumberWords = (num: number | string) => string;

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
  /** Converts a Rial figure to Toman (÷ 10). */
  toToman: ToToman;
  /** Converts a Toman figure to Rial (× 10). */
  toRial: ToRial;
  /** Renders an amount with a currency unit. */
  formatCurrency: FormatCurrency;
  /** Validates a 10-digit Iranian National Code. */
  isNationalCode: IsNationalCode;
  /** Checks a string against valid Iranian mobile numbers. */
  isMobileNumber: IsMobileNumber;
  /** Normalizes a mobile number to its `09xxxxxxxxx` form. */
  normalizeMobileNumber: NormalizeMobileNumber;
  /** Spells a number out in Persian words. */
  toNumberWords: ToNumberWords;
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
 * Persian webfont families the plugin can inject automatically from the CDN.
 *
 * These are the built-in preset families served from the jsDelivr CDN — think
 * of them as convenient shortcuts. Any other font name works too, provided a
 * {@link FontLocalOptions.local} configuration is supplied.
 */
export type FontFamily = "Vazirmatn" | "Sahel" | "Samim";

/**
 * CSS `font-display` descriptor, controlling how the font swaps in while the
 * webfont is loading — the main lever for perceived layout stability.
 *
 * - `'swap'` (default): show a fallback immediately, swap in when ready.
 * - `'block'`: brief invisible block period, then fallback, then swap.
 * - `'fallback'`: very short block period, no swap after a timeout.
 * - `'optional'`: let the browser decide, ideal for low-end connections.
 * - `'auto'`: browser-defined (usually `block`).
 */
export type FontDisplay = "auto" | "block" | "swap" | "fallback" | "optional";

/**
 * Local (self-hosted) webfont source configuration. Paths are resolved
 * relative to the Vite `root` (typically the project directory) and must stay
 * inside it — the build emits the files to the matching output location so
 * the same URL works in dev and in production.
 */
export interface FontLocalOptions {
  /** Path (relative to the project root) of the `.woff2` font file. */
  woff2: string;
  /** Optional `.woff` fallback path for legacy browsers. */
  woff?: string;
}

/**
 * User-facing options for {@link PersianOptions.font} (v0.3.0; `preload`
 * added in v0.3.1).
 *
 * The plugin supports two mutually exclusive sourcing modes:
 *
 * - **CDN preset** — `family` is one of `"Vazirmatn" | "Sahel" | "Samim"`;
 *   `@font-face` rules are generated pointing at jsDelivr assets.
 * - **Custom local font** — provide `local`; then `family` may be any name
 *   and the plugin emits your `.woff2`/`.woff` files into the build while
 *   generating `@font-face` rules for them. When both `local` and a preset
 *   name are given, `local` wins (the preset's CDN URLs are ignored).
 */
export interface FontOptions {
  /**
   * Font-family name. Either a built-in CDN preset (`"Vazirmatn"`,
   * `"Sahel"`, `"Samim"`) or any custom name when `local` is configured.
   */
  family: string;
  /**
   * `font-display` descriptor for the injected `@font-face` rules.
   * @default 'swap'
   */
  display?: FontDisplay;
  /** Self-hosted font files. When set, CDN sourcing is disabled. */
  local?: FontLocalOptions;
  /**
   * Apply the family to the body automatically via a CSS custom property:
   * `:root { --persian-font-family: '<family>' }` +
   * `body { font-family: var(--persian-font-family), sans-serif !important }`.
   * @default true
   */
  injectToBody?: boolean;
  /**
   * Emit `<link rel="preload" as="font" type="font/woff2" crossorigin>` tags
   * into the HTML head for every self-hosted `.woff2` file, so the browser
   * starts fetching the font as early as possible and FOUT is minimized.
   *
   * Only meaningful for `local` fonts (same-origin assets); ignored for CDN
   * presets. When the local font also ships a `.woff` fallback, only the
   * `.woff2` is preloaded.
   * @default false
   */
  preload?: boolean;
}

/**
 * Config fully resolved from {@link FontOptions} — every field is present.
 */
export type ResolvedFontOptions = {
  /** Font-family name (trimmed; may be a custom name with `local`). */
  family: string;
  /** `font-display` descriptor. */
  display: FontDisplay;
  /** Custom local sources (present only when configured). */
  local?: FontLocalOptions;
  /** Whether the body `font-family` micro-injection is active. */
  injectToBody: boolean;
  /** Whether `<link rel="preload">` tags are emitted for local `.woff2`. */
  preload: boolean;
};

/**
 * Opt-in, explicitly experimental features. Nothing here affects the default
 * behavior; each flag must be turned on to change the build output.
 */
export interface ExperimentalOptions {
  /**
   * Rewrite physical CSS layout properties into CSS logical properties
   * (`margin-left` → `margin-inline-start`, `left`/`right` →
   * `inset-inline-*`, `text-align: left|right` → `start|end`) so layouts flip
   * correctly under `dir="rtl"` with zero author-side refactoring.
   *
   * Implemented as a PostCSS plugin injected into the Vite CSS pipeline, so
   * it applies to `.css` files and to `<style>` blocks alike. When disabled
   * (the default) no PostCSS plugin is added and nothing is rewritten.
   *
   * Accepts a bare `true` to enable with default behavior, or a
   * {@link LogicalPropertiesOptions} object to also configure exclusions.
   *
   * @default false
   */
  logicalProperties?: boolean | LogicalPropertiesOptions;
}

/**
 * Refinements for the {@link ExperimentalOptions.logicalProperties}
 * transformer.
 *
 * Rules can also be excluded in the stylesheet itself by placing a
 * comment containing `@persian-ignore` immediately above a rule (or a single
 * declaration). Placing it as the very first token of a file skips the whole
 * file unless it directly guards the file's first rule.
 */
export interface LogicalPropertiesOptions {
  /**
   * Selectors that must bypass the transformation. Strings match a single
   * selector exactly (e.g. `.legacy-fixed-sidebar`); RegExps are tested
   * against each selector in a rule's selector list. Useful for leaving
   * third-party components untouched.
   */
  ignore?: Array<string | RegExp>;
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
  /** Automatic Persian webfont injection (v0.3.0, opt-in). */
  font?: FontOptions;
  /** Explicitly experimental features (v0.3.0, opt-in). */
  experimental?: ExperimentalOptions;
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
  /** Resolved font settings — present only when `font` was configured. */
  font?: ResolvedFontOptions;
  /** Resolved experimental settings. */
  experimental: Required<ExperimentalOptions>;
}