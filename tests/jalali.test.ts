import { describe, expect, it } from "vitest";
import { createJalaliModule, jalaliModule, toDate } from "../src/jalali/index.js";
import type { CalendarEngine } from "../src/types.js";

const intl = createJalaliModule("intl");

describe("toDate", () => {
  it("accepts a Date, string, and number", () => {
    const local = new Date(2024, 2, 20);
    expect(toDate(local).getTime()).toBe(local.getTime());
    expect(toDate(local.getTime()).getTime()).toBe(local.getTime());
    expect(toDate(local.toISOString()).getTime()).toBe(local.getTime());
  });

  it("throws on invalid input", () => {
    expect(() => toDate(new Date("nope"))).toThrow(/Invalid Gregorian date/);
    expect(() => toDate("not a date")).toThrow(/Invalid Gregorian date/);
    expect(() => toDate(Number.NaN)).toThrow(/Invalid Gregorian date/);
  });
});

describe("toJalali", () => {
  it("converts the well-known Nowruz 1403 anchor", () => {
    expect(jalaliModule.toJalali(new Date(2024, 2, 20))).toEqual({
      year: 1403,
      month: 1,
      day: 1,
    });
  });

  it("accepts string and number inputs", () => {
    const local = new Date(2024, 2, 20);
    expect(jalaliModule.toJalali(local.getTime())).toEqual({
      year: 1403,
      month: 1,
      day: 1,
    });
  });

  it("round-trips through toGregorian", () => {
    const local = new Date(2026, 0, 15);
    const jalali = jalaliModule.toJalali(local);
    const back = jalaliModule.toGregorian(jalali.year, jalali.month, jalali.day);
    expect([back.getFullYear(), back.getMonth(), back.getDate()]).toEqual([
      local.getFullYear(),
      local.getMonth(),
      local.getDate(),
    ]);
  });
});

describe("toGregorian", () => {
  it("converts the Nowruz 1403 anchor", () => {
    const g = jalaliModule.toGregorian(1403, 1, 1);
    expect([g.getFullYear(), g.getMonth(), g.getDate()]).toEqual([2024, 2, 20]);
  });

  it("handles the leap-year Esfand 30", () => {
    const g = jalaliModule.toGregorian(1403, 12, 30);
    expect([g.getFullYear(), g.getMonth(), g.getDate()]).toEqual([2025, 2, 20]);
  });

  it("round-trips for a valid Jalali date", () => {
    const jalali = jalaliModule.toJalali(new Date(2025, 5, 10));
    const back = jalaliModule.toJalali(
      jalaliModule.toGregorian(jalali.year, jalali.month, jalali.day),
    );
    expect(back).toEqual(jalali);
  });

  it("throws on invalid Jalali dates", () => {
    expect(() => jalaliModule.toGregorian(1403, 13, 1)).toThrow(/Invalid Jalali date/);
    expect(() => jalaliModule.toGregorian(1403, 12, 31)).toThrow(/Invalid Jalali date/);
    expect(() => jalaliModule.toGregorian(1402, 12, 30)).toThrow(/Invalid Jalali date/);
    expect(() => jalaliModule.toGregorian(1403, 0, 1)).toThrow(/Invalid Jalali date/);
  });
});

describe("isLeapJalaliYear", () => {
  it("agrees with the Persian leap-year cycle", () => {
    expect(jalaliModule.isLeapJalaliYear(1403)).toBe(true);
    expect(jalaliModule.isLeapJalaliYear(1408)).toBe(true);
    expect(jalaliModule.isLeapJalaliYear(1402)).toBe(false);
    expect(jalaliModule.isLeapJalaliYear(1404)).toBe(false);
  });
});

describe("getMonthName", () => {
  it("returns Persian month names by default", () => {
    expect(jalaliModule.getMonthName(1)).toBe("فروردین");
    expect(jalaliModule.getMonthName(10)).toBe("دی");
    expect(jalaliModule.getMonthName(12)).toBe("اسفند");
  });

  it("returns English month names when requested", () => {
    expect(jalaliModule.getMonthName(1, "en")).toBe("Farvardin");
    expect(jalaliModule.getMonthName(10, "en")).toBe("Dey");
  });

  it("throws on out-of-range months", () => {
    expect(() => jalaliModule.getMonthName(0)).toThrow();
    expect(() => jalaliModule.getMonthName(13)).toThrow();
    expect(() => jalaliModule.getMonthName(1.5)).toThrow();
  });
});

describe("formatJalali", () => {
  const nowruz = new Date(2024, 2, 20);

  it("uses YYYY/MM/DD by default", () => {
    expect(jalaliModule.formatJalali(nowruz)).toBe("1403/01/01");
  });

  it("supports all documented tokens", () => {
    expect(jalaliModule.formatJalali(nowruz, "YYYY/MM/DD")).toBe("1403/01/01");
    expect(jalaliModule.formatJalali(nowruz, "YY")).toBe("03");
    expect(jalaliModule.formatJalali(nowruz, "MMMM")).toBe("فروردین");
    expect(jalaliModule.formatJalali(nowruz, "MMM")).toBe("فروردین");
    expect(jalaliModule.formatJalali(nowruz, "DD/MM/YYYY")).toBe("01/01/1403");
    expect(jalaliModule.formatJalali(nowruz, "d/MM")).toBe("1/01");
  });

  it("preserves literal text and mixed tokens", () => {
    expect(jalaliModule.formatJalali(nowruz, "امروز: d MMMM YYYY")).toBe("امروز: 1 فروردین 1403");
  });

  it("throws on invalid input", () => {
    expect(() => jalaliModule.formatJalali("garbage")).toThrow(/Invalid Gregorian date/);
  });
});

describe("engine switching", () => {
  it("defaults to the jalaali-js engine", () => {
    expect(jalaliModule.toJalali(new Date(2024, 2, 20))).toEqual(intl.toJalali(new Date(2024, 2, 20)));
  });

  it("agrees with the intl engine across a broad date range", () => {
    for (let gy = 2000; gy <= 2030; gy += 1) {
      for (let gm = 1; gm <= 12; gm += 1) {
        for (const gd of [1, 15, 28]) {
          const date = new Date(gy, gm - 1, gd);
          expect(intl.toJalali(date)).toEqual(jalaliModule.toJalali(date));
        }
      }
    }
  });

  it("agrees with the intl engine on toGregorian and leap years", () => {
    for (let jy = 1375; jy <= 1410; jy += 1) {
      expect(intl.isLeapJalaliYear(jy)).toBe(jalaliModule.isLeapJalaliYear(jy));
      expect(intl.toGregorian(jy, 1, 1).getTime()).toBe(
        jalaliModule.toGregorian(jy, 1, 1).getTime(),
      );
      expect(intl.toGregorian(jy, 6, 15).getTime()).toBe(
        jalaliModule.toGregorian(jy, 6, 15).getTime(),
      );
      expect(intl.toGregorian(jy, 12, 29).getTime()).toBe(
        jalaliModule.toGregorian(jy, 12, 29).getTime(),
      );
    }
  });

  it("accepts a custom CalendarEngine instance", () => {
    const fake: CalendarEngine = {
      id: "intl",
      toJalali: (_date) => ({ year: 2100, month: 1, day: 1 }),
      toGregorian: () => new Date(0),
      isLeapYear: () => true,
    };
    const module = createJalaliModule(fake);
    expect(module.toJalali(new Date(2024, 2, 20)).year).toBe(2100);
    expect(module.isLeapJalaliYear(1403)).toBe(true);
    expect(module.toGregorian(1403, 1, 1).getTime()).toBe(0);
    expect(module.formatJalali(new Date(2024, 2, 20))).toBe("2100/01/01");
  });

  it("throws on an unknown engine identifier", () => {
    expect(() => createJalaliModule("nope" as never)).toThrow(/Unknown Jalali engine/);
  });
});