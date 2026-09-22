import { intlEngine } from "./engines/intl.js";
import { jalaaliJsEngine } from "./engines/jalaali-js.js";
import type { CalendarEngine, JalaliEngine } from "../types.js";

/**
 * The engines available by name, mapped from the `jalali.engine` option.
 *
 * This registry intentionally lives apart from the module factory
 * (`createJalaliModule`): it imports every engine eagerly, so it must never
 * be referenced from code that ends up in a consumer bundle. The plugin's
 * `load` hook imports the selected engine directly instead, which lets Vite
 * eliminate the unused one.
 */
const ENGINES: Record<JalaliEngine, CalendarEngine> = {
  "jalaali-js": jalaaliJsEngine,
  intl: intlEngine,
};

/**
 * Looks up a named engine, throwing on unknown identifiers.
 */
export function resolveEngine(engine: JalaliEngine): CalendarEngine {
  const resolved = ENGINES[engine];
  if (!resolved) {
    throw new Error(`Unknown Jalali engine: "${String(engine)}".`);
  }
  return resolved;
}