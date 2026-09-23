import { useMemo } from "react";
import { formatJalaliSafely } from "../jalali/framework.js";
import {
  isMobileNumber,
  isNationalCode,
  toEnglishDigits,
  toNumberWords,
  toPersianDigits,
} from "../text/index.js";
import type { DateInput } from "../types.js";

export {
  formatCurrency,
  isMobileNumber,
  isNationalCode,
  normalizeMobileNumber,
  normalizePersianText,
  toEnglishDigits,
  toNumberWords,
  toPersianDigits,
  toRial,
  toToman,
} from "../text/index.js";

/**
 * Converts a value to Persian/Extended Arabic-Indic digits (۰۱۲۳۴۵۶۷۸۹).
 *
 * The conversion is memoized against the input, so re-renders that pass the
 * same `value` return a stable `string`.
 *
 * @param value Number or digit-containing string.
 * @returns The Persian-digit version of `value`.
 *
 * @example
 * ```tsx
 * const price = usePersianDigits(12500); // "۱۲۵۰۰"
 * ```
 */
export function usePersianDigits(value: string | number): string {
  return useMemo(() => toPersianDigits(value), [value]);
}

/**
 * Converts a value's Persian/Arabic-Indic digits back to English numerals.
 *
 * Useful when reading user input produced by a Persian-digit enabled
 * component (e.g. a masked input) back into a numeric form.
 *
 * @param value Number or digit-containing string.
 * @returns The English-numeral version of `value`.
 *
 * @example
 * ```tsx
 * const numeric = useEnglishDigits("۱۲۵۰۰"); // "12500"
 * ```
 */
export function useEnglishDigits(value: string | number): string {
  return useMemo(() => toEnglishDigits(value), [value]);
}

/**
 * Formats a Gregorian date as a Jalali (Solar Hijri) string.
 *
 * Accepts a `Date`, an ISO string, or a Unix timestamp and re-formats
 * whenever `date` or `formatStr` changes. Uses the same token syntax as the
 * core `formatJalali` (`YYYY`, `YY`, `MMMM`, `MMM`, `MM`, `DD`, `d`); month
 * names render in Persian. Invalid or unparseable dates return `""`.
 *
 * @param date The Gregorian date to format.
 * @param formatStr `YYYY/MM/DD` by default.
 * @returns The formatted Jalali string, or `""` for invalid input.
 *
 * @example
 * ```tsx
 * const day = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY"); // "۱ فروردین ۱۴۰۳"
 * ```
 */
export function useJalaliDate(date: DateInput, formatStr?: string): string {
  return useMemo(() => formatJalaliSafely(date, formatStr), [date, formatStr]);
}

/**
 * Validates a 10-digit Iranian National Code (کد ملی), memoized against the
 * input. Accepts dirty input (non-digits stripped, Persian digits converted).
 *
 * @param code The national code to validate.
 * @returns `true` when the code passes the official checksum algorithm.
 *
 * @example
 * ```tsx
 * const valid = useNationalCode("0010042911"); // true
 * ```
 */
export function useNationalCode(code: string): boolean {
  return useMemo(() => isNationalCode(code), [code]);
}

/**
 * Checks whether a string is a valid Iranian mobile number, memoized against
 * the input. Accepts `+989…`, `00989…`, and bare `9…` variations.
 *
 * @param phone The phone number to check.
 * @returns `true` when the number normalizes to `09xxxxxxxxx`.
 *
 * @example
 * ```tsx
 * const valid = useMobileNumber("+98 912 345 6789"); // true
 * ```
 */
export function useMobileNumber(phone: string): boolean {
  return useMemo(() => isMobileNumber(phone), [phone]);
}

/**
 * Converts a number to its spoken Persian text, memoized against the input.
 *
 * @param num The number to spell out.
 * @returns The Persian words, or `""` for invalid input.
 *
 * @example
 * ```tsx
 * const words = useNumberWords(12500); // "دوازده هزار و پانصد"
 * ```
 */
export function useNumberWords(num: number | string): string {
  return useMemo(() => toNumberWords(num), [num]);
}