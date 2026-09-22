import { useMemo } from "react";
import { toEnglishDigits, toPersianDigits } from "../text/index.js";

export { normalizePersianText, toEnglishDigits, toPersianDigits } from "../text/index.js";

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