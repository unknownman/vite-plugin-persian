/**
 * Official Svelte bindings for `vite-plugin-persian`.
 *
 * Works with both Svelte 4 (stores) and Svelte 5 (runes — `$` store
 * auto-subscription). No `.svelte` files are required; everything is plain,
 * side-effect-free TypeScript, so this entry builds to ESM and CJS like the
 * rest of the package.
 *
 * In a component the helpers compose with Svelte's `$` store syntax:
 *
 * ```svelte
 * <script>
 *   import { usePersianDigits, persianDigits } from "vite-plugin-persian/svelte";
 *
 *   export let price; // number
 *   const priceFa = usePersianDigits(price);
 * </script>
 *
 * <span use:persianDigits={price}>{price}</span>
 * <input use:persianDigits bind:value />
 * <span>{$priceFa}</span>
 * ```
 */
import { derived, readable, type Readable } from "svelte/store";
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
 * Value accepted by the Svelte helpers: a plain number or digit-bearing
 * string, or a reactive `Readable` (from `svelte/store`) that drives updates.
 */
export type PersianDigitsSource = string | number | Readable<string | number>;

/**
 * Structural shape of the `persianDigits` action's return value, matching
 * Svelte's `ActionReturn` (declared locally so Svelte 4 and 5 consumers get
 * the same experience without extra type dependencies).
 */
export interface PersianDigitsActionReturn {
  /** Re-applies the action when its bound parameter changes. */
  update?: (parameter: PersianDigitsSource | undefined) => void;
  /** Tears down subscriptions when the element is destroyed. */
  destroy?: () => void;
}

/**
 * Normalizes any accepted source into a `Readable`, so it can be fed into
 * `derived` uniformly (a plain value becomes a static store).
 */
function toReadable<T>(source: T | Readable<T>): Readable<T> {
  if (typeof source === "object" && source !== null && "subscribe" in source) {
    return source as Readable<T>;
  }
  return readable(source);
}

/**
 * Reactively converts a value to Persian/Extended Arabic-Indic digits.
 *
 * Returns a `Readable<string>` store. Pass a plain number or string for a
 * one-shot conversion, or a `Readable` from `svelte/store` to keep reacting
 * to changes.
 *
 * @example
 * ```svelte
 * <script>
 *   const price = usePersianDigits(12500);
 * </script>
 * <span>{$price}</span> <!-- ۱۲۵۰۰ -->
 * ```
 */
export function usePersianDigits(source: PersianDigitsSource): Readable<string> {
  return derived(toReadable(source), (value) => toPersianDigits(value));
}

/**
 * Reactively converts Persian/Arabic-Indic digits in a value back to English
 * numerals. Useful when reading user input (e.g. a masked input) into a
 * numeric form.
 *
 * @example
 * ```svelte
 * <script>
 *   const numeric = useEnglishDigits("۱۲۵۰۰");
 * </script>
 * <span>{$numeric}</span> <!-- 12500 -->
 * ```
 */
export function useEnglishDigits(source: PersianDigitsSource): Readable<string> {
  return derived(toReadable(source), (value) => toEnglishDigits(value));
}

/**
 * Value accepted by `useJalaliDate`: a Gregorian date (`Date`, ISO string,
 * or Unix timestamp), or a reactive `Readable` that drives updates.
 */
export type JalaliDateSource = DateInput | Readable<DateInput>;

/**
 * Reactively formats a Gregorian date as a Jalali (Solar Hijri) string.
 *
 * Pass a plain date for a one-shot conversion, or a `Readable` from
 * `svelte/store` (e.g. a `writable` bound to a picker) to keep reacting to
 * changes. The format string may also be a `Readable`. Uses the same token
 * syntax as the core `formatJalali` (`YYYY`, `YY`, `MMMM`, `MMM`, `MM`,
 * `DD`, `d`) with Persian month names; `YYYY/MM/DD` by default. Invalid or
 * unparseable dates yield `""`.
 *
 * @example
 * ```svelte
 * <script>
 *   import { writable } from "svelte/store";
 *   import { useJalaliDate } from "vite-plugin-persian/svelte";
 *
 *   const createdAt = writable(new Date(2024, 2, 20));
 *   const jalaali = useJalaliDate(createdAt, "d MMMM YYYY");
 * </script>
 * <span>{$jalaali}</span> <!-- ۱ فروردین ۱۴۰۳ -->
 * ```
 */
export function useJalaliDate(
  source: JalaliDateSource,
  formatStr?: string | Readable<string>,
): Readable<string> {
  const dateStore = toReadable(source);
  const formatStore: Readable<string | undefined> =
    formatStr === undefined
      ? readable(undefined as string | undefined)
      : typeof formatStr === "string"
        ? readable(formatStr)
        : formatStr;
  return derived([dateStore, formatStore], ([date, format]) =>
    formatJalaliSafely(date, format),
  );
}

/**
 * Reactively validates a 10-digit Iranian National Code (کد ملی). Pass a
 * plain string for a one-shot result or a `Readable` to keep reacting to
 * changes. Dirty input is handled safely (non-digits stripped).
 *
 * @example
 * ```svelte
 * <script>
 *   import { writable } from "svelte/store";
 *   import { useNationalCode } from "vite-plugin-persian/svelte";
 *   const code = writable("0010042911");
 *   const valid = useNationalCode(code);
 * </script>
 * {#if $valid} کد ملی معتبر است {:else} کد ملی نامعتبر است {/if}
 * ```
 */
export function useNationalCode(code: string | Readable<string>): Readable<boolean> {
  return derived(toReadable(code), (value) => isNationalCode(value));
}

/**
 * Reactively checks a string against valid Iranian mobile numbers. Reacts to
 * stores and plain values (`+989…`, `00989…`, and bare `9…` forms work).
 *
 * @example
 * ```svelte
 * <script>
 *   const phone = writable("+98 912 345 6789");
 *   const valid = useMobileNumber(phone); // $valid → true
 * </script>
 * ```
 */
export function useMobileNumber(phone: string | Readable<string>): Readable<boolean> {
  return derived(toReadable(phone), (value) => isMobileNumber(value));
}

/**
 * Reactively spells a number out in Persian words. Reacts to stores and plain
 * values (`12500` → `"دوازده هزار و پانصد"`).
 *
 * @example
 * ```svelte
 * <script>
 *   const amount = writable(12500);
 *   const words = useNumberWords(amount);
 * </script>
 * <span>{$words}</span> <!-- دوازده هزار و پانصد -->
 * ```
 */
export function useNumberWords(
  num: number | string | Readable<number | string>,
): Readable<string> {
  return derived(toReadable(num), (value) => toNumberWords(value));
}

/** Form controls whose displayed digits live in `.value`, not text. */
type EditableElement = HTMLElement & { value: string };

/** Is this element a form control (`input`/`textarea`/`select`)? */
function isEditable(node: HTMLElement): node is EditableElement {
  return (
    (typeof HTMLInputElement !== "undefined" && node instanceof HTMLInputElement) ||
    (typeof HTMLTextAreaElement !== "undefined" && node instanceof HTMLTextAreaElement) ||
    (typeof HTMLSelectElement !== "undefined" && node instanceof HTMLSelectElement)
  );
}

/**
 * `use:persianDigits` — renders an element's value or text in Persian digits.
 *
 * - With a bound parameter, the parameter (or its store) drives the output:
 *   form controls get their `.value` converted, other elements get text.
 * - Without a parameter, the element's existing text is converted once.
 *
 * Conversion is idempotent, so re-running it on every update is safe.
 *
 * @example
 * ```svelte
 * <span use:persianDigits={price}>{price}</span>
 * <input use:persianDigits bind:value />
 * <span use:persianDigits>12.500</span>
 * ```
 */
export function persianDigits(
  node: HTMLElement,
  parameter: PersianDigitsSource | undefined,
): PersianDigitsActionReturn {
  let unsubscribe: (() => void) | null = null;

  const render = (value: string | number | undefined) => {
    const source =
      value === undefined || value === null ? (node.textContent ?? "") : String(value);
    const converted = toPersianDigits(source);
    if (isEditable(node)) {
      if (node.value !== converted) node.value = converted;
    } else if (node.textContent !== converted) {
      node.textContent = converted;
    }
  };

  const bind = (target: PersianDigitsSource | undefined) => {
    unsubscribe?.();
    unsubscribe = null;
    if (typeof target === "object" && target !== null && "subscribe" in target) {
      unsubscribe = (target as Readable<string | number>).subscribe((value) => render(value));
    } else {
      render(target);
    }
  };

  bind(parameter);

  return {
    update(next) {
      bind(next);
    },
    destroy() {
      unsubscribe?.();
    },
  };
}