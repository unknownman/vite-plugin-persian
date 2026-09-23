import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";
import { formatJalaliSafely } from "../jalali/framework.js";
import { adjustSelection } from "../text/caret.js";
import { resolvePersianInputTransform } from "../text/normalization.js";
import { toPersianSlug } from "../text/slug.js";
import {
  isMobileNumber,
  isNationalCode,
  toEnglishDigits,
  toNumberWords,
  toPersianDigits,
} from "../text/index.js";
import type {
  DateInput,
  PersianInputOptions,
  PersianSelection,
  SlugOptions,
} from "../types.js";

export {
  adjustSelection,
  applyPersianInputTransform,
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
  toPersianSlug,
  toRial,
  toToman,
} from "../text/index.js";
export type {
  ApplyPersianInputResult,
  PersianDigitMode,
  PersianEditableElement,
  PersianInputOptions,
  PersianSelection,
  PersianTextTransform,
  SlugOptions,
  TextNormalizationOptions,
} from "../types.js";

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

/**
 * The props `usePersianInput` returns to spread onto an `<input>`/`<textarea>`.
 *
 * ```tsx
 * const input = usePersianInput();
 * return <input {...input} placeholder="متن فارسی" />;
 * ```
 */
export interface PersianInputBound {
  /** Ref to the editable element, used to restore the caret after renders. */
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** The current (normalized) value. */
  value: string;
  /** Transforms `e.target.value`, updates state, and preserves the caret. */
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * `usePersianInput` — a controlled-input hook that intercepts every keystroke
 * (and paste) and runs the Persian text pipeline over the raw `target.value`
 * before React state ever sees it.
 *
 * - Arabic `ي`/`ك` → Persian `ی`/`ک` (`sanitize`), ZWNJ joining for
 *   `می`/`ها`/… (`halfSpaces`), and digit conversion (`digits`) all happen as
 *   the user types.
 * - The caret is preserved even when the value is rewritten in the middle of
 *   the field: the transform re-maps the previous selection, the DOM is
 *   patched synchronously, and a render-phase effect re-applies the selection
 *   as a safety net.
 *
 * @example
 * ```tsx
 * function PersianField() {
 *   const input = usePersianInput({ digits: "persian" });
 *   return <input {...input} />;
 * }
 * ```
 */
export function usePersianInput(options?: PersianInputOptions): PersianInputBound {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const pendingSelection = useRef<PersianSelection | null>(null);

  const transform = useMemo(
    () => resolvePersianInputTransform(options),
    [options?.transform, options?.sanitize, options?.halfSpaces, options?.digits],
  );

  const [value, setValue] = useState<string>(() =>
    options?.initialValue === undefined ? "" : transform(options.initialValue),
  );

  useEffect(() => {
    const selection = pendingSelection.current;
    pendingSelection.current = null;
    const node = inputRef.current;
    if (selection === null || node === null) {
      return;
    }
    if (node.value !== value) {
      return;
    }
    try {
      node.setSelectionRange(selection.start, selection.end);
    } catch {
      // The element may not accept a selection (e.g. a hidden field); the
      // value is already normalized, only the caret restore is skipped.
    }
  }, [value]);

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.target;
    const raw = target.value;
    const transformed = transform(raw);

    if (transformed === raw) {
      pendingSelection.current = null;
      setValue(raw);
      return;
    }

    const start = target.selectionStart ?? raw.length;
    const end = target.selectionEnd ?? start;
    const selection = adjustSelection(raw, transformed, start, end);

    // Patch the DOM synchronously so the visible value reflects the
    // normalization immediately — React then commits the same string, which
    // leaves the restored caret untouched.
    target.value = transformed;
    try {
      target.setSelectionRange(selection.start, selection.end);
    } catch {
      // Ignore hosts that reject programmatic selection.
    }
    pendingSelection.current = selection;
    setValue(transformed);
  };

  return { ref: inputRef, value, onChange };
}

/**
 * `usePersianSlug` — a memoized, reactive wrapper around {@link toPersianSlug}
 * for deriving a clean, SEO-friendly slug from a title string.
 *
 * The slug is recomputed only when `text` or the relevant `options` fields
 * change, and `undefined`/`null` input is treated as `""` (so it composes
 * safely with form state).
 *
 * @example
 * ```tsx
 * const title = "«آموزش جامع Vite (نسخه جدید) - بخش ۱!»";
 * const slug = usePersianSlug(title); // "آموزش-جامع-vite-نسخه-جدید-بخش-۱"
 * ```
 */
export function usePersianSlug(
  text: string | null | undefined,
  options?: SlugOptions,
): string {
  return useMemo(
    () => toPersianSlug(text ?? "", options),
    // `options` is often an inline object literal; key on its meaningful
    // fields so the memo survives re-renders.
    [text, options?.lowercase, options?.separator],
  );
}