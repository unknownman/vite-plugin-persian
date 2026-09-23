import { describe, expect, it } from "vitest";
import {
  createTextModule,
  isMobileNumber,
  isNationalCode,
  normalizeMobileNumber,
  normalizePersianText,
  toEnglishDigits,
  toNumberWords,
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

describe("isNationalCode", () => {
  it("accepts a valid code with leading zeros", () => {
    expect(isNationalCode("0010042911")).toBe(true);
  });

  it("strips non-numeric characters from dirty input", () => {
    expect(isNationalCode("0010-042 911")).toBe(true);
    expect(isNationalCode("0010/042-9 11")).toBe(true);
  });

  it("accepts Persian/Arabic-Indic digit input", () => {
    expect(isNationalCode("۰۰۱۰۰۴۲۹۱۱")).toBe(true);
    expect(isNationalCode("٠٠١٠٠٤٢٩١١")).toBe(true);
  });

  it("rejects a checksum mismatch", () => {
    expect(isNationalCode("1234567890")).toBe(false);
  });

  it("rejects all-same-digit sequences", () => {
    expect(isNationalCode("1111111111")).toBe(false);
    expect(isNationalCode("0000000000")).toBe(false);
  });

  it("rejects wrong lengths and garbage", () => {
    expect(isNationalCode("123")).toBe(false);
    expect(isNationalCode("00100429111")).toBe(false);
    expect(isNationalCode("abc")).toBe(false);
    expect(isNationalCode("")).toBe(false);
  });
});

describe("isMobileNumber / normalizeMobileNumber", () => {
  it("accepts the standard 11-digit form", () => {
    expect(isMobileNumber("09123456789")).toBe(true);
  });

  it("accepts +98, 0098, and bare-9 variations", () => {
    expect(isMobileNumber("+989123456789")).toBe(true);
    expect(isMobileNumber("00989123456789")).toBe(true);
    expect(isMobileNumber("9123456789")).toBe(true);
  });

  it("strips spaces, dashes, and braces from dirty input", () => {
    expect(isMobileNumber("(0912) 345-6789")).toBe(true);
  });

  it("covers all operator regions (091/092/093/090/099)", () => {
    expect(isMobileNumber("09101234567")).toBe(true);
    expect(isMobileNumber("09200000000")).toBe(true);
    expect(isMobileNumber("09332211220")).toBe(true);
    expect(isMobileNumber("09019000000")).toBe(true);
    expect(isMobileNumber("09900000000")).toBe(true);
  });

  it("rejects unknown, short, and non-Iranian numbers", () => {
    expect(isMobileNumber("0912")).toBe(false);
    expect(isMobileNumber("09500000000")).toBe(false);
    expect(isMobileNumber("1234567890")).toBe(false);
    expect(isMobileNumber("")).toBe(false);
  });

  it("normalizes every common variation to 09xxxxxxxxx", () => {
    expect(normalizeMobileNumber("+98 912 345 6789")).toBe("09123456789");
    expect(normalizeMobileNumber("00989123456789")).toBe("09123456789");
    expect(normalizeMobileNumber("9123456789")).toBe("09123456789");
    expect(normalizeMobileNumber("09123456789")).toBe("09123456789");
    expect(normalizeMobileNumber("٠٩١٢٣٤٥٦٧٨٩")).toBe("09123456789");
    expect(normalizeMobileNumber("garbage")).toBe("");
  });
});

describe("toNumberWords", () => {
  it("handles zero specially", () => {
    expect(toNumberWords(0)).toBe("صفر");
  });

  it("spells small integers correctly", () => {
    expect(toNumberWords(1)).toBe("یک");
    expect(toNumberWords(10)).toBe("ده");
    expect(toNumberWords(11)).toBe("یازده");
    expect(toNumberWords(20)).toBe("بیست");
    expect(toNumberWords(21)).toBe("بیست و یک");
    expect(toNumberWords(99)).toBe("نود و نه");
  });

  it("spells hundreds correctly", () => {
    expect(toNumberWords(100)).toBe("صد");
    expect(toNumberWords(101)).toBe("صد و یک");
    expect(toNumberWords(110)).toBe("صد و ده");
    expect(toNumberWords(200)).toBe("دویست");
    expect(toNumberWords(999)).toBe("نهصد و نود و نه");
  });

  it("spells thousands and the example figure", () => {
    expect(toNumberWords(1000)).toBe("یک هزار");
    expect(toNumberWords(1001)).toBe("یک هزار و یک");
    expect(toNumberWords(12500)).toBe("دوازده هزار و پانصد");
    expect(toNumberWords(12545)).toBe("دوازده هزار و پانصد و چهل و پنج");
  });

  it("spells millions, billions, and beyond", () => {
    expect(toNumberWords(1000000)).toBe("یک میلیون");
    expect(toNumberWords(125000000)).toBe("صد و بیست و پنج میلیون");
    expect(toNumberWords(1000000000)).toBe("یک میلیارد");
    expect(toNumberWords("1000000000000000000000000")).toBe("یک سپتیلیون");
  });

  it("spells extremely large integers exactly", () => {
    const words = toNumberWords(9007199254740991);
    expect(words).toBe(
      "نه کوادریلیون و هفت تریلیون و صد و نود و نه میلیارد و دویست و پنجاه و چهار میلیون و هفتصد و چهل هزار و نهصد و نود و یک",
    );
  });

  it("handles negative numbers", () => {
    expect(toNumberWords(-12500)).toBe("منفی دوازده هزار و پانصد");
    expect(toNumberWords(-7)).toBe("منفی هفت");
  });

  it("spells decimal fractions digit by digit", () => {
    expect(toNumberWords(12345.67)).toBe("دوازده هزار و سیصد و چهل و پنج ممیز شش هفت");
    expect(toNumberWords(0.5)).toBe("صفر ممیز پنج");
    expect(toNumberWords("1٫05")).toBe("یک ممیز صفر پنج");
  });

  it("accepts Persian digits and thousands separators", () => {
    expect(toNumberWords("۱۲٬۵۰۰")).toBe("دوازده هزار و پانصد");
    expect(toNumberWords("1,250,000")).toBe("یک میلیون و دویست و پنجاه هزار");
  });

  it("returns an empty string for invalid input", () => {
    expect(toNumberWords("")).toBe("");
    expect(toNumberWords("abc")).toBe("");
    expect(toNumberWords(NaN)).toBe("");
    expect(toNumberWords(Infinity)).toBe("");
  });
});

describe("textModule", () => {
  it("exposes all three functions with consistent behaviour", () => {
    expect(textModule.toPersianDigits(10)).toBe("۱۰");
    expect(textModule.toEnglishDigits("۱۰")).toBe("10");
    expect(textModule.normalizePersianText("يك")).toBe("یک");
    expect(createTextModule().toPersianDigits(5)).toBe("۵");
  });

  it("re-exports the utility functions", () => {
    expect(textModule.isNationalCode("0010042911")).toBe(true);
    expect(textModule.isMobileNumber("09123456789")).toBe(true);
    expect(textModule.normalizeMobileNumber("9123456789")).toBe("09123456789");
    expect(textModule.toNumberWords(12500)).toBe("دوازده هزار و پانصد");
  });

  it("exposes the v0.4.0 normalization primitives", () => {
    expect(textModule.sanitizePersianText("يك ك")).toBe("یک ک");
    expect(textModule.normalizeHalfSpaces("می شود")).toBe("می\u200cشود");
    expect(textModule.normalizePersianInput("مي شود 12")).toBe("می\u200cشود ۱۲");
    expect(textModule.createTextTransform({ digits: "english" })("۱۲۳")).toBe("123");
    expect(createTextModule().sanitizePersianText("ك")).toBe("ک");
  });

  it("exposes the v0.4.0 slug generator", () => {
    expect(textModule.toPersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»")).toBe(
      "آموزش-جامع-vite-نسخه-جدید-بخش-۱",
    );
    expect(createTextModule().toPersianSlug("سلام دنیا", { separator: "_" })).toBe("سلام_دنیا");
  });
});