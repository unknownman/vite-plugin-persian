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
import { toEnglishDigits, toPersianDigits } from "../text/index.js";

export {
  formatCurrency,
  normalizePersianText,
  toEnglishDigits,
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
function toReadable(source: PersianDigitsSource): Readable<string | number> {
  if (typeof source === "object" && source !== null && "subscribe" in source) {
    return source as Readable<string | number>;
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