import {
  isLeapJalaaliYear,
  isValidJalaaliDate,
  toGregorian as toGregorianJalaali,
  toJalaali as toJalaaliJs,
} from "jalaali-js";
import type { CalendarEngine, JalaliDate } from "../../types.js";

/**
 * Validates a Jalali date triple and throws a descriptive error when it does
 * not exist (e.g. Esfand 30 in a common year, month 13, day 0).
 */
function assertValidJalaliDate(jy: number, jm: number, jd: number): void {
  if (!isValidJalaaliDate(jy, jm, jd)) {
    throw new Error(`Invalid Jalali date: ${jy}/${jm}/${jd}`);
  }
}

/**
 * The default calendar engine, backed by the battle-tested `jalaali-js`
 * package. It implements the canonical Jalali arithmetic (~1388 leap-year
 * rule) and therefore behaves identically across every environment.
 */
export const jalaaliJsEngine: CalendarEngine = {
  id: "jalaali-js",

  toJalali(date: Date): JalaliDate {
    const { jy, jm, jd } = toJalaaliJs(date);
    return { year: jy, month: jm, day: jd };
  },

  toGregorian(jy: number, jm: number, jd: number): Date {
    assertValidJalaliDate(jy, jm, jd);
    const { gy, gm, gd } = toGregorianJalaali(jy, jm, jd);
    // Build the Date from local calendar components so the result lines up
    // with how `toJalali` reads dates (local timezone, midnight for the day).
    return new Date(gy, gm - 1, gd);
  },

  isLeapYear: isLeapJalaaliYear,
};