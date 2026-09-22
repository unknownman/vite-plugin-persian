import type { CalendarEngine, JalaliDate } from "../../types.js";

/**
 * A Gregorian→Persian formatter pinned to UTC. Requesting `en-US` keeps the
 * year/month/day values as Latin digits, and `calendar: "persian"` selects
 * the Jalali calendar. `timeZone: "UTC"` makes the conversion deterministic
 * regardless of the host machine's timezone.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/calendar
 */
const PERSIAN_FORMATTER = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Milliseconds in one day — used for the date-search arithmetic below. */
const DAY_MS = 86_400_000;

/**
 * A fixed reference used as the starting guess for Gregorian↔Jalali lookups:
 * Persian year `jy` always begins roughly on 19–21 March of Gregorian
 * `jy + 621` (Nowruz).
 */
const NOWRUZ_GUESS_MONTH = 2; // March, 0-indexed
const NOWRUZ_GUESS_DAY = 19;

/**
 * Converts a UTC-midnight `Date` to a `JalaliDate` by asking `Intl` to
 * describe it in the Persian calendar.
 */
function utcToJalali(utc: Date): JalaliDate {
  const parts = PERSIAN_FORMATTER.formatToParts(utc);
  const record: Record<string, string | undefined> = {};
  for (const part of parts) {
    record[part.type] = part.value;
  }

  // The numeric Jalali year is usually reported as `year`. Older ICU builds
  // may emit `relatedYear` instead; accept both.
  const year = record.year ?? record.relatedYear;

  if (year === undefined || record.month === undefined || record.day === undefined) {
    throw new Error(
      `Intl persian calendar could not describe ${utc.toISOString()} ` +
        "(year/month/day parts unavailable; this Node.js version may lack persian calendar data)",
    );
  }

  return {
    year: Number(year),
    month: Number(record.month),
    day: Number(record.day),
  };
}

/**
 * Produces a UTC-midnight `Date` for the *local* calendar components of
 * `date`. This ensures both engines read a Gregorian date the same way —
 * using the caller's local date, exactly like `getFullYear()`/etc.
 */
function localMidnightToUtc(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * A lightweight structural check for the Jalali triple, before the more
 * expensive round-trip verification below.
 */
function assertRoughlyValid(jy: number, jm: number, jd: number): void {
  if (!Number.isInteger(jy) || jm < 1 || jm > 12 || !Number.isInteger(jd) || jd < 1 || jd > 31) {
    throw new Error(`Invalid Jalali date: ${jy}/${jm}/${jd}`);
  }
}

/**
 * The `intl` engine. Uses native `Intl.DateTimeFormat` with the persian
 * calendar — zero dependencies, but the conversion is implemented as an
 * iterative search rather than closed-form arithmetic, and leap/validation
 * results are derived rather than computed.
 *
 * Limitations vs the `jalaali-js` engine:
 * - Slightly slower (each `toGregorian`/`isLeapYear` performs a small search).
 * - Behaviour depends on the host ICU/Node version (consistent for modern
 *   dates on Node ≥ 18; older/edge environments may disagree slightly).
 */
export const intlEngine: CalendarEngine = {
  id: "intl",

  toJalali(date: Date): JalaliDate {
    return utcToJalali(localMidnightToUtc(date));
  },

  toGregorian: toGregorianIntl,

  isLeapYear(jy: number): boolean {
    // A Persian year is leap when its span covers 366 days. Compare the
    // Gregorian dates of two consecutive Farvardin 1st.
    const start = toGregorianIntl(jy, 1, 1).getTime();
    const end = toGregorianIntl(jy + 1, 1, 1).getTime();
    return Math.round((end - start) / DAY_MS) === 366;
  },
};

/**
 * Converts a validated Jalali date to the equivalent Gregorian `Date`
 * (local midnight). See the `intlEngine` doc comment for limitations.
 */
function toGregorianIntl(jy: number, jm: number, jd: number): Date {
  assertRoughlyValid(jy, jm, jd);

  // Start from a guess around Nowruz of the target year and iteratively
  // correct it. Each step moves a full (over-estimated) day-count, so it
  // converges within a handful of iterations for any plausible date.
  let guess = new Date(Date.UTC(jy + 621, NOWRUZ_GUESS_MONTH, NOWRUZ_GUESS_DAY));
  let current = utcToJalali(guess);

  for (let i = 0; i < 8 && !isSameJalali(current, jy, jm, jd); i += 1) {
    const dayOffset =
      (jy - current.year) * 372 + (jm - current.month) * 31 + (jd - current.day);
    guess = new Date(guess.getTime() + dayOffset * DAY_MS);
    current = utcToJalali(guess);
  }

  // Confirm the search landed exactly on the requested Jalali date. A
  // mismatch means the triple does not exist (e.g. 31 Esfand).
  if (!isSameJalali(current, jy, jm, jd)) {
    // Be tolerant of off-by-a-day drift from DST-free rounding.
    for (let offset = -3; offset <= 3; offset += 1) {
      const candidate = new Date(guess.getTime() + offset * DAY_MS);
      const jalali = utcToJalali(candidate);
      if (isSameJalali(jalali, jy, jm, jd)) {
        return utcMidnightToLocal(candidate);
      }
    }
    throw new Error(`Invalid Jalali date: ${jy}/${jm}/${jd}`);
  }

  return utcMidnightToLocal(guess);
}

/** Equality helper for the search loop above. */
function isSameJalali(jalali: JalaliDate, jy: number, jm: number, jd: number): boolean {
  return jalali.year === jy && jalali.month === jm && jalali.day === jd;
}

/**
 * Converts a UTC-midnight instant to a local-midnight `Date`, matching the
 * semantics of the `jalaali-js` engine's output.
 */
function utcMidnightToLocal(utc: Date): Date {
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}