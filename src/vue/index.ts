import { computed, isRef } from "vue";
import type { ComputedRef, Directive, MaybeRefOrGetter } from "vue";
import { formatJalaliSafely } from "../jalali/framework.js";
import {
  isMobileNumber,
  isNationalCode,
  normalizePersianText,
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

type EditableElement = HTMLElement & { value: string };

/** Is this element a form control whose `value` (not text) carries digits? */
function isEditableElement(el: HTMLElement): el is EditableElement {
  return (
    (typeof HTMLInputElement !== "undefined" && el instanceof HTMLInputElement) ||
    (typeof HTMLTextAreaElement !== "undefined" && el instanceof HTMLTextAreaElement) ||
    (typeof HTMLSelectElement !== "undefined" && el instanceof HTMLSelectElement)
  );
}

/**
 * Writes the Persian-digit version of `value` into `el`.
 *
 * Form controls (`input`, `textarea`, `select`) get their `value` converted;
 * any other element gets its text content replaced. Converting text that is
 * already in Persian digits is a no-op, so the directive is safe to re-run on
 * every patch.
 */
function applyDigits(el: HTMLElement, value: string | number | undefined): void {
  const source = value === undefined || value === null ? el.textContent ?? "" : String(value);
  const converted = toPersianDigits(source);

  if (isEditableElement(el)) {
    el.value = converted;
  } else if (el.textContent !== converted) {
    el.textContent = converted;
  }
}

/**
 * `v-persian-digits` — renders a value or an element's text in Persian digits.
 *
 * Usage:
 *
 * ```html
 * <!-- from a bound value (kept updated) -->
 * <span v-persian-digits="price">{{ price }}</span>
 *
 * <!-- convert the element's own text once -->
 * <span v-persian-digits>۱۲.۵۰۰</span>
 * ```
 *
 * Register it globally (`app.directive("persian-digits", vPersianDigits)`) or
 * per-component (`directives: { persianDigits: vPersianDigits }`).
 */
export const vPersianDigits: Directive<HTMLElement, string | number> = {
  mounted(el, binding) {
    applyDigits(el, binding.value);
  },
  updated(el, binding) {
    applyDigits(el, binding.value);
  },
};

/**
 * `usePersianDigits()` — a lightweight composable exposing the text utilities,
 * ready to be used inside `<script setup>`.
 *
 * @example
 * ```vue
 * <script setup>
 * const { toPersianDigits, normalizePersianText } = usePersianDigits();
 * const price = toPersianDigits(12500);
 * </script>
 * ```
 */
export function usePersianDigits(): {
  toPersianDigits: typeof toPersianDigits;
  toEnglishDigits: typeof toEnglishDigits;
  normalizePersianText: typeof normalizePersianText;
} {
  return { toPersianDigits, toEnglishDigits, normalizePersianText };
}

/**
 * Resolves a `MaybeRefOrGetter` to its current value, without depending on
 * `toValue` (which only exists in Vue ≥ 3.3).
 */
function resolveMaybeRefOrGetter<T>(source: MaybeRefOrGetter<T>): T {
  if (typeof source === "function") {
    return (source as () => T)();
  }
  if (isRef(source)) {
    return source.value;
  }
  return source;
}

/**
 * `useJalaliDate` — a reactive composable that formats a Gregorian date as a
 * Jalali (Solar Hijri) string. Accepts a plain value, a `Ref`, or a getter
 * function for both the date and (optionally) the format string, and stays in
 * sync with upstream changes.
 *
 * Uses the same token syntax as the core `formatJalali` (`YYYY`, `YY`,
 * `MMMM`, `MMM`, `MM`, `DD`, `d`) with Persian month names; `YYYY/MM/DD` by
 * default. Invalid or unparseable dates yield `""`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from "vue";
 * import { useJalaliDate } from "vite-plugin-persian/vue";
 *
 * const createdAt = ref(new Date(2024, 2, 20));
 * const jalaali = useJalaliDate(createdAt, "d MMMM YYYY"); // "۱ فروردین ۱۴۰۳"
 * </script>
 * ```
 */
export function useJalaliDate(
  date: MaybeRefOrGetter<DateInput>,
  formatStr?: MaybeRefOrGetter<string>,
): ComputedRef<string> {
  return computed(() => {
    const value = resolveMaybeRefOrGetter(date);
    const format = formatStr === undefined ? undefined : resolveMaybeRefOrGetter(formatStr);
    return formatJalaliSafely(value, format);
  });
}

/**
 * `useNationalCode` — a reactive composable validating a 10-digit Iranian
 * National Code (کد ملی). Accepts a plain value, a `Ref`, or a getter, and
 * re-validates whenever the input changes.
 *
 * @example
 * ```vue
 * <script setup>
 * const code = ref("0010042911");
 * const valid = useNationalCode(code); // template: {{ valid }} → true
 * </script>
 * ```
 */
export function useNationalCode(code: MaybeRefOrGetter<string>): ComputedRef<boolean> {
  return computed(() => isNationalCode(resolveMaybeRefOrGetter(code)));
}

/**
 * `useMobileNumber` — a reactive composable checking a string against valid
 * Iranian mobile numbers (`09xxxxxxxxx`, including `+989…`/`00989…` forms).
 *
 * @example
 * ```vue
 * <script setup>
 * const phone = ref("+98 912 345 6789");
 * const valid = useMobileNumber(phone); // true
 * </script>
 * ```
 */
export function useMobileNumber(phone: MaybeRefOrGetter<string>): ComputedRef<boolean> {
  return computed(() => isMobileNumber(resolveMaybeRefOrGetter(phone)));
}

/**
 * `useNumberWords` — a reactive composable spelling a number out in Persian
 * (e.g. `12500` → `"دوازده هزار و پانصد"`).
 *
 * @example
 * ```vue
 * <script setup>
 * const amount = ref(12500);
 * const words = useNumberWords(amount); // "دوازده هزار و پانصد"
 * </script>
 * ```
 */
export function useNumberWords(num: MaybeRefOrGetter<number | string>): ComputedRef<string> {
  return computed(() => toNumberWords(resolveMaybeRefOrGetter(num)));
}