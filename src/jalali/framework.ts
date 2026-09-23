/**
 * Framework-facing Jalali formatting helper.
 *
 * Wraps the core `formatJalali` — bound to the deterministic `jalaali-js`
 * engine (the plugin's default) — behind a lazy instance and a safe
 * fallback, so the React/Vue/Svelte helpers render invalid or nullish dates
 * as an empty string instead of throwing at runtime.
 *
 * Note on engine selection: helpers like `useJalaliDate` run in the browser at
 * render time, where Vite config is not readable, so they intentionally use
 * the canonical `jalaali-js` calendar — the same algorithm the plugin's
 * virtual module uses by default. This keeps output identical on every
 * environment. For ICU-derived behaviour pass `jalali: { engine: "intl" }` to
 * the plugin and format dates through `virtual:persian/jalali` instead.
 */
import { createJalaliModule } from "./index.js";
import { jalaaliJsEngine } from "./engines/jalaali-js.js";
import type { DateInput } from "../types.js";

let cached: ReturnType<typeof createJalaliModule> | null = null;

function moduleInstance() {
  if (cached === null) {
    cached = createJalaliModule(jalaaliJsEngine);
  }
  return cached;
}

/**
 * Formats a date with the default `YYYY/MM/DD` pattern or a custom token
 * string. Invalid/unparseable input yields an empty string rather than an
 * exception.
 */
export function formatJalaliSafely(date: DateInput | null | undefined, format?: string): string {
  if (date === null || date === undefined) {
    return "";
  }
  try {
    return moduleInstance().formatJalali(date, format ?? "YYYY/MM/DD");
  } catch {
    return "";
  }
}