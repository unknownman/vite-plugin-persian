import type { Directive } from "vue";
import {
  normalizePersianText,
  toEnglishDigits,
  toPersianDigits,
} from "../text/index.js";

export {
  formatCurrency,
  normalizePersianText,
  toEnglishDigits,
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