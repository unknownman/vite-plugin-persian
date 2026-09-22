import { describe, expect, it } from "vitest";
import {
  createTextModule,
  normalizePersianText,
  toEnglishDigits,
  toPersianDigits,
  textModule,
} from "../src/text/index.js";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const ENGLISH_DIGITS = "0123456789";

describe("toPersianDigits", () => {
  it("converts the full range of English digits", () => {
    expect(toPersianDigits(ENGLISH_DIGITS)).toBe(PERSIAN_DIGITS);
  });

  it("handles a positive number input", () => {
    expect(toPersianDigits(12345)).toBe("۱۲۳۴۵");
  });

  it("handles negative and decimal numbers", () => {
    expect(toPersianDigits(-7)).toBe("-۷");
    expect(toPersianDigits(-12.5)).toBe("-۱۲.۵");
    expect(toPersianDigits(3.14)).toBe("۳.۱۴");
  });

  it("converts digits inside mixed text and leaves everything else untouched", () => {
    expect(toPersianDigits("Version 9.2.1 runs fast!")).toBe("Version ۹.۲.۱ runs fast!");
    expect(toPersianDigits("اختار 100 در 200")).toBe("اختار ۱۰۰ در ۲۰۰");
    expect(toPersianDigits("2024-03-20")).toBe("۲۰۲۴-۰۳-۲۰");
  });

  it("leaves existing Persian or Arabic digits unchanged", () => {
    expect(toPersianDigits(`a${PERSIAN_DIGITS}b`)).toBe(`a${PERSIAN_DIGITS}b`);
    expect(toPersianDigits(ARABIC_DIGITS)).toBe(ARABIC_DIGITS);
  });

  it("handles empty strings", () => {
    expect(toPersianDigits("")).toBe("");
  });

  it("round-trips with toEnglishDigits", () => {
    for (const sample of [ENGLISH_DIGITS, "-12.5", "Vo 1.2.3", "0", "1234567890"]) {
      expect(toEnglishDigits(toPersianDigits(sample))).toBe(sample);
    }
  });
});

describe("toEnglishDigits", () => {
  it("converts Persian digits to English digits", () => {
    expect(toEnglishDigits(PERSIAN_DIGITS)).toBe(ENGLISH_DIGITS);
  });

  it("converts Arabic-Indic digits to English digits", () => {
    expect(toEnglishDigits(ARABIC_DIGITS)).toBe(ENGLISH_DIGITS);
  });

  it("converts digits inside Persian text", () => {
    expect(toEnglishDigits("قیمت: ۱۲۳/۴۵۶")).toBe("قیمت: 123/456");
  });

  it("leaves non-digit characters unchanged", () => {
    expect(toEnglishDigits("شماره ۰۹۱۲ - تلفن!")).toBe("شماره 0912 - تلفن!");
  });

  it("accepts a number input", () => {
    expect(toEnglishDigits(123)).toBe("123");
  });

  it("handles empty strings", () => {
    expect(toEnglishDigits("")).toBe("");
  });

  it("round-trips with toPersianDigits", () => {
    expect(toPersianDigits(toEnglishDigits(PERSIAN_DIGITS))).toBe(PERSIAN_DIGITS);
    expect(toPersianDigits(toEnglishDigits(ARABIC_DIGITS))).toBe(PERSIAN_DIGITS);
    expect(toPersianDigits(toEnglishDigits("متن ۵۰٪ و ۱/۲"))).toBe("متن ۵۰٪ و ۱/۲");
  });
});

describe("normalizePersianText", () => {
  it("maps Arabic yeh to Persian yeh", () => {
    expect(normalizePersianText("يك")).toBe("یک");
  });

  it("maps Arabic kaf to Persian kaf", () => {
    expect(normalizePersianText("كشور")).toBe("کشور");
  });

  it("normalizes both letters in mixed text", () => {
    expect(normalizePersianText("تكرار كلمات")).toBe("تکرار کلمات");
  });

  it("preserves Persian yeh and kaf", () => {
    expect(normalizePersianText("چیزی")).toBe("چیزی");
    expect(normalizePersianText("بزرگ")).toBe("بزرگ");
  });

  it("collapses whitespace runs and trims edges", () => {
    expect(normalizePersianText("  سلام    خوبی   ")).toBe("سلام خوبی");
    expect(normalizePersianText("یک\tدو\nسه")).toBe("یک دو سه");
  });

  it("preserves half-space (ZWNJ) characters", () => {
    expect(normalizePersianText("می\u200cرود")).toBe("می\u200cرود");
  });

  it("handles empty and whitespace-only strings", () => {
    expect(normalizePersianText("")).toBe("");
    expect(normalizePersianText("   ")).toBe("");
  });

  it("is idempotent", () => {
    const input = "يك  سلام";
    expect(normalizePersianText(normalizePersianText(input))).toBe(
      normalizePersianText(input),
    );
  });
});

describe("textModule", () => {
  it("exposes all three functions with consistent behaviour", () => {
    expect(textModule.toPersianDigits(10)).toBe("۱۰");
    expect(textModule.toEnglishDigits("۱۰")).toBe("10");
    expect(textModule.normalizePersianText("يك")).toBe("یک");
    expect(createTextModule().toPersianDigits(5)).toBe("۵");
  });
});