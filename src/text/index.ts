import { normalizePersianText, toEnglishDigits, toPersianDigits } from "./runtime.js";
import { formatCurrency, toRial, toToman } from "./currency.js";
import {
  isMobileNumber,
  isNationalCode,
  normalizeMobileNumber,
  toNumberWords,
} from "./utilities.js";
import type { TextVirtualModule } from "../types.js";

export { normalizePersianText, toEnglishDigits, toPersianDigits } from "./runtime.js";
export { formatCurrency, toRial, toToman } from "./currency.js";
export {
  isMobileNumber,
  isNationalCode,
  normalizeMobileNumber,
  toNumberWords,
} from "./utilities.js";

/**
 * Builds the `virtual:persian/text` module surface.
 *
 * Kept as a factory for symmetry with the Jalali module and so the module can
 * later be instantiated per-plugin instance without global state.
 */
export function createTextModule(): TextVirtualModule {
  return {
    toPersianDigits,
    toEnglishDigits,
    normalizePersianText,
    toToman,
    toRial,
    formatCurrency,
    isNationalCode,
    isMobileNumber,
    normalizeMobileNumber,
    toNumberWords,
  };
}

/**
 * The default text module instance.
 */
export const textModule: TextVirtualModule = createTextModule();