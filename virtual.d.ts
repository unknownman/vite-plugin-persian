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
    NormalizePersianText,
    ToEnglishDigits,
    ToPersianDigits,
  } from "vite-plugin-persian";

  /** Converts digits to Persian/Extended Arabic-Indic numerals. */
  export const toPersianDigits: ToPersianDigits;
  /** Converts Persian/Arabic-Indic digits to English numerals. */
  export const toEnglishDigits: ToEnglishDigits;
  /** Normalizes Persian characters and collapses whitespace. */
  export const normalizePersianText: NormalizePersianText;
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
    normalizePersianText,
    toEnglishDigits,
    toPersianDigits,
  } from "virtual:persian/text";
}