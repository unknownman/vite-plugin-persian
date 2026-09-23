/**
 * Ambient type declarations for the virtual modules served by
 * `vite-plugin-persian`, so consumers get full type safety when importing
 * from `virtual:persian*`.
 *
 * Add this line to your project's `env.d.ts` / `vite-env.d.ts`:
 *
 * ```ts
 * /// <reference types="vite-plugin-persian/virtual" />
 * ```
 *
 * The function types are imported from the package's own entry, so they stay
 * in sync with the real runtime implementation in `dist/methods.js`.
 */

declare module "virtual:persian/jalali" {
  import type {
    FormatJalali,
    GetMonthName,
    IsLeapJalaliYear,
    ToGregorian,
    ToJalali,
  } from "vite-plugin-persian";

  /** Formats a date using a pattern of tokens (default `YYYY/MM/DD`). */
  export const formatJalali: FormatJalali;
  /** Converts a Gregorian date/time to a `JalaliDate`. */
  export const toJalali: ToJalali;
  /** Converts a `JalaliDate` to a Gregorian `Date`. */
  export const toGregorian: ToGregorian;
  /** Returns `true` when the given Jalali year is a leap year. */
  export const isLeapJalaliYear: IsLeapJalaliYear;
  /** Resolves a month number (1–12) to its name (`fa` by default). */
  export const getMonthName: GetMonthName;
}

declare module "virtual:persian/text" {
  import type {
    CreateTextTransform,
    FormatCurrency,
    IsMobileNumber,
    IsNationalCode,
    NormalizeHalfSpaces,
    NormalizeMobileNumber,
    NormalizePersianInput,
    NormalizePersianText,
    SanitizePersianText,
    ToEnglishDigits,
    ToNumberWords,
    ToPersianDigits,
    ToRial,
    ToToman,
  } from "vite-plugin-persian";

  /** Converts digits to Persian/Extended Arabic-Indic numerals. */
  export const toPersianDigits: ToPersianDigits;
  /** Converts Persian/Arabic-Indic digits to English numerals. */
  export const toEnglishDigits: ToEnglishDigits;
  /** Normalizes Persian characters and collapses whitespace. */
  export const normalizePersianText: NormalizePersianText;
  /** Converts a Rial figure to Toman (÷ 10). */
  export const toToman: ToToman;
  /** Converts a Toman figure to Rial (× 10). */
  export const toRial: ToRial;
  /** Renders an amount with a currency unit. */
  export const formatCurrency: FormatCurrency;
  /** Validates a 10-digit Iranian National Code. */
  export const isNationalCode: IsNationalCode;
  /** Checks a string against valid Iranian mobile numbers. */
  export const isMobileNumber: IsMobileNumber;
  /** Normalizes a mobile number to its `09xxxxxxxxx` form. */
  export const normalizeMobileNumber: NormalizeMobileNumber;
  /** Spells a number out in Persian words. */
  export const toNumberWords: ToNumberWords;
  /** Converts Arabic yeh/kaf to Persian (v0.4.0). */
  export const sanitizePersianText: SanitizePersianText;
  /** Inserts/corrects ZWNJ half-spaces (v0.4.0). */
  export const normalizeHalfSpaces: NormalizeHalfSpaces;
  /** One-shot combined pipeline over a raw string (v0.4.0). */
  export const normalizePersianInput: NormalizePersianInput;
  /** Builds a reusable normalized-input transform (v0.4.0). */
  export const createTextTransform: CreateTextTransform;
}

declare module "virtual:persian" {
  export {
    formatJalali,
    getMonthName,
    isLeapJalaliYear,
    toGregorian,
    toJalali,
  } from "virtual:persian/jalali";

  export {
    createTextTransform,
    formatCurrency,
    isMobileNumber,
    isNationalCode,
    normalizeHalfSpaces,
    normalizeMobileNumber,
    normalizePersianInput,
    normalizePersianText,
    sanitizePersianText,
    toEnglishDigits,
    toNumberWords,
    toPersianDigits,
    toRial,
    toToman,
  } from "virtual:persian/text";
}