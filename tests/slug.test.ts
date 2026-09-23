import { describe, expect, it } from "vitest";
import { toPersianSlug } from "../src/text/slug.js";

const ZWNJ = "\u200c";

describe("toPersianSlug", () => {
  it("handles the requirement example verbatim", () => {
    expect(toPersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»")).toBe(
      "آموزش-جامع-vite-نسخه-جدید-بخش-۱",
    );
  });

  it("keeps Persian letters, English letters, and numbers intact", () => {
    // Digits stay in their own numeral system: Persian ۱۴۰۳, English 19.
    expect(toPersianSlug("آموزش فارسی ۱۴۰۳ و React 19")).toBe("آموزش-فارسی-۱۴۰۳-و-react-19");
  });

  it("lowercases English by default and keeps case when requested", () => {
    expect(toPersianSlug("Quick Brown FOX")).toBe("quick-brown-fox");
    expect(toPersianSlug("Quick Brown FOX", { lowercase: false })).toBe("Quick-Brown-FOX");
  });

  it("keeps Persian digits and Arabic-Indic digits untouched", () => {
    expect(toPersianSlug("۳۰ روز و ٢٤ ساعت")).toBe("۳۰-روز-و-٢٤-ساعت");
  });

  it("collapses spaces, tabs, and newlines into a single separator", () => {
    expect(toPersianSlug("سلام    دنیا")).toBe("سلام-دنیا");
    expect(toPersianSlug("سلام\tدنیا\nخوبی")).toBe("سلام-دنیا-خوبی");
    expect(toPersianSlug("  پیش و پس  ")).toBe("پیش-و-پس");
  });

  it("collapses multiple and mixed dashes/underscores", () => {
    expect(toPersianSlug("a---b")).toBe("a-b");
    expect(toPersianSlug("a___b")).toBe("a-b");
    expect(toPersianSlug("a -_ b __ c")).toBe("a-b-c");
  });

  it("strips punctuation, symbols, and currency signs", () => {
    // `&` is a boundary too — it never survives into the slug.
    const dirty = "قیمت: ۵۰٬۰۰۰$ یا ۴۰€ & ۳۰% (با تخفیف!)؟";
    expect(toPersianSlug(dirty)).toBe("قیمت-۵۰-۰۰۰-یا-۴۰-۳۰-با-تخفیف");
  });

  it("removes Persian punctuation and typographic marks", () => {
    expect(toPersianSlug("سلام، دنیا!")).toBe("سلام-دنیا");
    expect(toPersianSlug("«دو نقل قول» و «الیگزیوم»؟")).toBe("دو-نقل-قول-و-الیگزیوم");
    expect(toPersianSlug("سلام،«دنیا»؛:!؟")).toBe("سلام-دنیا");
    expect(toPersianSlug("کتاب یعنی \u00abخیلی\u00bb خوب")).toBe("کتاب-یعنی-خیلی-خوب");
  });

  it("strips emojis but keeps the words around them", () => {
    expect(toPersianSlug("سلام 👋 دنیا 🌍")).toBe("سلام-دنیا");
    expect(toPersianSlug("🎉 جشن 🎂 تولد 🎉")).toBe("جشن-تولد");
  });

  it("drops Arabic diacritics and tatweel without splitting words", () => {
    expect(toPersianSlug("دَست و مَدَد")).toBe("دست-و-مدد");
    expect(toPersianSlug("میـراثِ بُرز")).toBe("میراث-برز");
  });

  it("turns ZWNJ half-spaces into separators", () => {
    expect(toPersianSlug(`می${ZWNJ}خواهم`)).toBe("می-خواهم");
    expect(toPersianSlug("می شود")).toBe("می-شود");
  });

  it("supports a custom separator", () => {
    expect(toPersianSlug("آموزش جامع Vite", { separator: "_" })).toBe("آموزش_جامع_vite");
    expect(toPersianSlug("a  b  c", { separator: "/" })).toBe("a/b/c");
  });

  it("uses the default separator when only `lowercase` is configured", () => {
    expect(toPersianSlug("Hi There", { lowercase: false })).toBe("Hi-There");
  });

  it("trims leading and trailing separators", () => {
    expect(toPersianSlug("---سلام دنیا---")).toBe("سلام-دنیا");
    expect(toPersianSlug("!!!سلام!!!")).toBe("سلام");
    expect(toPersianSlug("  سلام  ", { separator: "_" })).toBe("سلام");
  });

  it("handles invalid and empty inputs", () => {
    expect(toPersianSlug("")).toBe("");
    expect(toPersianSlug("   ")).toBe("");
    expect(toPersianSlug("!!!؟،«»")).toBe("");
    expect(toPersianSlug("👋✨")).toBe("");
    expect(toPersianSlug("---")).toBe("");
  });

  it("keeps Arabic-letter (non-Persian) text as-is", () => {
    expect(toPersianSlug("يك كتاب")).toBe("يك-كتاب");
  });

  it("handles mixed whitespace + punctuation + digits endings", () => {
    expect(toPersianSlug("بخش ۱!")).toBe("بخش-۱");
    expect(toPersianSlug("نسخه ۱.۲.۳")).toBe("نسخه-۱-۲-۳");
  });

  it("is idempotent on its own output", () => {
    const once = toPersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
    expect(toPersianSlug(once)).toBe(once);
  });

  it("throws a clear error for an empty separator", () => {
    expect(() => toPersianSlug("سلام", { separator: "" })).toThrow(RangeError);
  });
});