import { describe, expect, it } from "vitest";
import {
  createTextModule,
  formatCurrency,
  textModule,
  toRial,
  toToman,
} from "../src/text/index.js";

describe("toToman", () => {
  it("divides Rial by 10", () => {
    expect(toToman(10000)).toBe(1000);
    expect(toToman("250000")).toBe(25000);
    expect(toToman(50)).toBe(5);
  });

  it("accepts Persian-digit input", () => {
    expect(toToman("۱۰۰۰۰")).toBe(1000);
    expect(toToman("۱۰٬۰۰۰")).toBe(1000);
  });

  it("accepts grouped English-digit input", () => {
    expect(toToman("1,000,000")).toBe(100000);
    expect(toToman("2,500,000")).toBe(250000);
    expect(toToman("2٬500٬000")).toBe(250000);
  });

  it("handles zero, negatives, and decimals", () => {
    expect(toToman(0)).toBe(0);
    expect(toToman(-1000)).toBe(-100);
    expect(toToman("105")).toBe(10.5);
    expect(toToman(" ۱۲٬۵۰۰ ")).toBe(1250);
  });

  it("returns NaN for invalid input", () => {
    for (const bad of ["abc", "", "۱۲٬۰۰۰ تومان", "1.2.3", "1e3", "٠x١٠"]) {
      expect(Number.isNaN(toToman(bad))).toBe(true);
    }
    expect(Number.isNaN(toToman(undefined as unknown as string))).toBe(true);
    expect(Number.isNaN(toToman(null as unknown as string))).toBe(true);
    expect(Number.isNaN(toToman(Number.NaN))).toBe(true);
    expect(Number.isNaN(toToman(Number.POSITIVE_INFINITY))).toBe(true);
  });
});

describe("toRial", () => {
  it("multiplies Toman by 10", () => {
    expect(toRial(1000)).toBe(10000);
    expect(toRial("500")).toBe(5000);
    expect(toRial(0)).toBe(0);
  });

  it("accepts Persian-digit input", () => {
    expect(toRial("۲۵")).toBe(250);
    expect(toRial("۱٬۰۰۰")).toBe(10000);
  });

  it("handles negatives and decimals", () => {
    expect(toRial(-2)).toBe(-20);
    expect(toRial("10.5")).toBe(105);
  });

  it("returns NaN for invalid input", () => {
    for (const bad of ["abc", "", "تومان", "12x"]) {
      expect(Number.isNaN(toRial(bad))).toBe(true);
    }
    expect(Number.isNaN(toRial(undefined as unknown as number))).toBe(true);
  });
});

describe("formatCurrency", () => {
  it("formats with Persian digits and Toman by default", () => {
    expect(formatCurrency(12500000)).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
    expect(formatCurrency(100)).toBe("۱۰۰ تومان");
  });

  it("renders English digits with comma separators", () => {
    expect(formatCurrency(12500000, { digits: "english" })).toBe("12,500,000 تومان");
    expect(formatCurrency(12500000, { digits: "english" })).not.toContain("٬");
  });

  it("supports the Rial unit", () => {
    expect(formatCurrency(2500000, { unit: "ریال" })).toBe("۲٬۵۰۰٬۰۰۰ ریال");
    expect(formatCurrency(2500000, { unit: "ریال", digits: "english" })).toBe("2,500,000 ریال");
  });

  it("can disable separators", () => {
    expect(formatCurrency(12500, { separator: false })).toBe("۱۲۵۰۰ تومان");
    expect(formatCurrency(12500, { digits: "english", separator: false })).toBe("12500 تومان");
  });

  it("accepts Persian-digit string input", () => {
    expect(formatCurrency("۱۲٬۵۰۰٬۰۰۰")).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
    expect(formatCurrency("100,000", { unit: "ریال" })).toBe("۱۰۰٬۰۰۰ ریال");
    expect(formatCurrency("2,500,000", { digits: "english" })).toBe("2,500,000 تومان");
  });

  it("rounds fractional amounts to whole numbers", () => {
    expect(formatCurrency(1234.6)).toBe("۱٬۲۳۵ تومان");
    expect(formatCurrency(12.5, { digits: "english" })).toBe("13 تومان");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("۰ تومان");
    expect(formatCurrency(0, { digits: "english" })).toBe("0 تومان");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-12500)).toBe("-۱۲٬۵۰۰ تومان");
    expect(formatCurrency(-12500, { digits: "english" })).toBe("-12,500 تومان");
  });

  it("formats large sums without scientific notation", () => {
    expect(formatCurrency(1200000000000)).toBe("۱٬۲۰۰٬۰۰۰٬۰۰۰٬۰۰۰ تومان");
    expect(formatCurrency(1200000000000, { digits: "english" })).toBe("1,200,000,000,000 تومان");
  });

  it("returns an empty string for invalid input", () => {
    for (const bad of ["abc", "", "تومان ۵۰", "1.2.3"]) {
      expect(formatCurrency(bad)).toBe("");
    }
    expect(formatCurrency(undefined as unknown as number)).toBe("");
    expect(formatCurrency(Number.NaN)).toBe("");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("text surface", () => {
  it("exposes the currency helpers on the text module", () => {
    expect(typeof textModule.toToman).toBe("function");
    expect(typeof textModule.toRial).toBe("function");
    expect(typeof textModule.formatCurrency).toBe("function");
    expect(createTextModule().toToman(10000)).toBe(1000);
    expect(createTextModule().formatCurrency(5000)).toBe("۵٬۰۰۰ تومان");
  });
});