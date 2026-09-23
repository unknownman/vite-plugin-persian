/**
 * Public runtime surface for the virtual modules.
 *
 * Consumers should NOT import this entry directly in application code — the
 * plugin's `load` hook re-exports these functions through the
 * `virtual:persian/*` modules. Keeping them behind a dedicated subpath lets
 * each virtual module import exactly what it needs (and lets Vite
 * tree-shake the rest).
 *
 * Both engines are exported so a single `load`-generated shim can pull in
 * exactly one of them; modules are side-effect free, so unused engine code is
 * dropped from consumer bundles.
 */

export { createJalaliModule } from "./jalali/index.js";

export { intlEngine } from "./jalali/engines/intl.js";
export { jalaaliJsEngine } from "./jalali/engines/jalaali-js.js";

export type { CalendarEngine, JalaliEngine } from "./types.js";

export { normalizePersianText, toEnglishDigits, toPersianDigits, formatCurrency, toRial, toToman, isNationalCode, isMobileNumber, normalizeMobileNumber, toNumberWords, sanitizePersianText, normalizeHalfSpaces, normalizePersianInput, createTextTransform } from "./text/index.js";