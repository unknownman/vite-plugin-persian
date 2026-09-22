/**
 * Public runtime surface for the virtual modules.
 *
 * Consumers should NOT import this entry directly in application code — the
 * plugin's `load` hook re-exports these functions through the
 * `virtual:persian/*` modules. Keeping them behind a dedicated subpath lets
 * each virtual module import exactly what it needs (and lets Vite
 * tree-shake the rest).
 */

export { createJalaliModule } from "./jalali/index.js";

export { normalizePersianText, toEnglishDigits, toPersianDigits } from "./text/index.js";