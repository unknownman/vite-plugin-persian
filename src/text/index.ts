import { normalizePersianText, toEnglishDigits, toPersianDigits } from "./runtime.js";
import { formatCurrency, toRial, toToman } from "./currency.js";
import {
  isMobileNumber,
  isNationalCode,
  normalizeMobileNumber,
  toNumberWords,
} from "./utilities.js";
import {
  createTextTransform,
  normalizeHalfSpaces,
  normalizePersianInput,
  sanitizePersianText,
} from "./normalization.js";
import { toPersianSlug } from "./slug.js";
import type { TextVirtualModule } from "../types.js";

export { normalizePersianText, toEnglishDigits, toPersianDigits } from "./runtime.js";
export { formatCurrency, toRial, toToman } from "./currency.js";
export {
  isMobileNumber,
  isNationalCode,
  normalizeMobileNumber,
  toNumberWords,
} from "./utilities.js";
export {
  sanitizePersianText,
  normalizeHalfSpaces,
  createTextTransform,
  normalizePersianInput,
  resolvePersianInputTransform,
} from "./normalization.js";
export { toPersianSlug } from "./slug.js";
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
export { adjustSelection } from "./caret.js";
export { applyPersianInputTransform, isTextEditableElement } from "./input.js";

/**
 * Builds the `virtual:persian/text` module surface.
 *
 * Kept as a factory for symmetry with the Jalali module and so the module can
 * later be instantiated per-plugin instance without global state. The pure
 * string primitives live here; the DOM/caret helpers are framework-facing and
 * stay out of the virtual module.
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
    sanitizePersianText,
    normalizeHalfSpaces,
    normalizePersianInput,
    createTextTransform,
    toPersianSlug,
  };
}

/**
 * The default text module instance.
 */
export const textModule: TextVirtualModule = createTextModule();