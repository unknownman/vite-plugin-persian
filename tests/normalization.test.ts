import { describe, expect, it } from "vitest";
import {
  adjustSelection,
  applyPersianInputTransform,
  createTextTransform,
  normalizeHalfSpaces,
  normalizePersianInput,
  resolvePersianInputTransform,
  sanitizePersianText,
} from "../src/text/index.js";

describe("sanitizePersianText", () => {
  it("maps Arabic yeh to Persian yeh", () => {
    expect(sanitizePersianText("يك")).toBe("یک");
  });

  it("maps alef maksura (terminal yeh) to Persian yeh", () => {
    expect(sanitizePersianText("مى روم")).toBe("می روم");
  });

  it("maps Arabic kaf to Persian kaf", () => {
    expect(sanitizePersianText("كشور")).toBe("کشور");
  });

  it("converts both letters in mixed text", () => {
    expect(sanitizePersianText("تكرار كلمات")).toBe("تکرار کلمات");
  });

  it("preserves already-correct Persian letters", () => {
    expect(sanitizePersianText("چیزی")).toBe("چیزی");
    expect(sanitizePersianText("بزرگ")).toBe("بزرگ");
  });

  it("preserves whitespace runs exactly (no collapsing)", () => {
    expect(sanitizePersianText("يك  كتاب")).toBe("یک  کتاب");
  });

  it("keeps digits, Latin text, and empty input untouched", () => {
    expect(sanitizePersianText("ك 1250")).toBe("ک 1250");
    expect(sanitizePersianText("hello world")).toBe("hello world");
    expect(sanitizePersianText("")).toBe("");
  });

  it("is idempotent", () => {
    expect(sanitizePersianText(sanitizePersianText("يك ك"))).toBe("یک ک");
  });
});

describe("normalizeHalfSpaces", () => {
  it('joins the "می" prefix ("می شود" → "می‌شود")', () => {
    expect(normalizeHalfSpaces("می شود")).toBe("می\u200cشود");
  });

  it('joins the "نمی" prefix', () => {
    expect(normalizeHalfSpaces("نمی شود")).toBe("نمی\u200cشود");
  });

  it("joins the ها suffix", () => {
    expect(normalizeHalfSpaces("کتاب ها")).toBe("کتاب\u200cها");
    expect(normalizeHalfSpaces("کتاب های من")).toBe("کتاب\u200cهای من");
  });

  it("joins the تر / ترین suffixes", () => {
    expect(normalizeHalfSpaces("بزرگ تر")).toBe("بزرگ\u200cتر");
    expect(normalizeHalfSpaces("بزرگ ترین")).toBe("بزرگ\u200cترین");
  });

  it("leaves already-joined text untouched", () => {
    expect(normalizeHalfSpaces("می\u200cشود")).toBe("می\u200cشود");
    expect(normalizeHalfSpaces("کتاب\u200cها")).toBe("کتاب\u200cها");
  });

  it("folds a stray space beside an existing ZWNJ", () => {
    expect(normalizeHalfSpaces("می\u200c شود")).toBe("می\u200cشود");
    expect(normalizeHalfSpaces("می \u200cشود")).toBe("می\u200cشود");
  });

  it("collapses ZWNJ runs", () => {
    expect(normalizeHalfSpaces("می\u200c\u200cشود")).toBe("می\u200cشود");
  });

  it("does not split real compound words", () => {
    expect(normalizeHalfSpaces("میدان")).toBe("میدان");
    expect(normalizeHalfSpaces("میکس")).toBe("میکس");
    expect(normalizeHalfSpaces("بزرگترین")).toBe("بزرگترین");
  });

  it("only joins when a Persian letter follows the prefix", () => {
    expect(normalizeHalfSpaces("می 12 دقیقه")).toBe("می 12 دقیقه");
  });

  it("handles empty and non-Persian input", () => {
    expect(normalizeHalfSpaces("")).toBe("");
    expect(normalizeHalfSpaces("hello world")).toBe("hello world");
  });

  it("is idempotent", () => {
    const once = normalizeHalfSpaces("می شود و کتاب ها");
    expect(normalizeHalfSpaces(once)).toBe(once);
  });
});

describe("createTextTransform / normalizePersianInput", () => {
  it("runs the full pipeline by default (sanitize + half-spaces + Persian digits)", () => {
    expect(normalizePersianInput("مي شود 12")).toBe("می\u200cشود ۱۲");
  });

  it("chains digit conversion with normalization", () => {
    expect(normalizePersianInput("قیمت 100 تومان", { digits: "persian" })).toBe(
      "قیمت ۱۰۰ تومان",
    );
  });

  it("can request English digits instead", () => {
    expect(normalizePersianInput("قیمت ۱۲۵", { digits: "english" })).toBe("قیمت 125");
  });

  it("can leave digits alone", () => {
    expect(normalizePersianInput("می شود 12", { digits: "none" })).toBe("می\u200cشود 12");
  });

  it("can disable half-space correction", () => {
    expect(normalizePersianInput("می شود 12", { halfSpaces: false })).toBe("می شود ۱۲");
  });

  it("can disable Arabic sanitization", () => {
    expect(normalizePersianInput("مي شود", { sanitize: false, digits: "none" })).toBe("مي شود");
  });

  it("builds reusable, memo-safe transforms", () => {
    const transform = createTextTransform({ halfSpaces: true, digits: "none" });
    expect(transform("می شود")).toBe("می\u200cشود");
    expect(transform("می\u200cشود")).toBe("می\u200cشود");
  });

  it("handles empty input", () => {
    expect(normalizePersianInput("")).toBe("");
    expect(normalizePersianInput("", { digits: "english" })).toBe("");
  });
});

describe("resolvePersianInputTransform", () => {
  it("defaults to the full pipeline", () => {
    expect(resolvePersianInputTransform(undefined)("مي شود 12")).toBe("می\u200cشود ۱۲");
    expect(resolvePersianInputTransform(true)("مي شود 12")).toBe("می\u200cشود ۱۲");
  });

  it("disables normalization when false", () => {
    expect(resolvePersianInputTransform(false)("مي شود 12")).toBe("مي شود 12");
  });

  it("honors a custom transform", () => {
    const custom = (text: string) => text.toUpperCase();
    expect(resolvePersianInputTransform({ transform: custom })("مي")).toBe("مي".toUpperCase());
  });

  it("passes options through to the pipeline", () => {
    expect(resolvePersianInputTransform({ digits: "english" })("۱۲۳")).toBe("123");
  });
});

describe("adjustSelection", () => {
  it("returns the same selection for an unchanged value", () => {
    expect(adjustSelection("سلام دنیا", "سلام دنیا", 3, 5)).toEqual({ start: 3, end: 5 });
  });

  it("keeps a caret inside a 1:1 letter replacement", () => {
    expect(adjustSelection("يك", "یک", 2, 2)).toEqual({ start: 2, end: 2 });
    expect(adjustSelection("يك", "یک", 1, 1)).toEqual({ start: 1, end: 1 });
  });

  it("maps a caret after a space→ZWNJ join in place", () => {
    expect(adjustSelection("کتاب ها", "کتاب\u200cها", 5, 5)).toEqual({ start: 5, end: 5 });
  });

  it("shifts a caret past a folded stray space", () => {
    const before = "می\u200c شود"; // م ی ZWNJ sp ش و د
    const after = "می\u200cشود";
    expect(adjustSelection(before, after, 4, 4)).toEqual({ start: 3, end: 3 });
  });

  it("shifts a caret past a collapsed ZWNJ run", () => {
    expect(adjustSelection("می\u200c\u200cشود", "می\u200cشود", 4, 4)).toEqual({
      start: 3,
      end: 3,
    });
  });

  it("maps a paste region across a mixed replacement+fold", () => {
    const before = "مي شود"; // Arabic yeh + space
    const after = "می\u200cشود";
    expect(adjustSelection(before, after, 3, 5)).toEqual({ start: 3, end: 5 });
  });

  it("shifts a caret past a deletion at the very end of the value", () => {
    expect(adjustSelection("کتاب ها", "کتاب\u200cها", 8, 8)).toEqual({ start: 7, end: 7 });
  });

  it("clamps out-of-range and NaN selections", () => {
    expect(adjustSelection("اب", "اب", 99, 99)).toEqual({ start: 2, end: 2 });
    expect(adjustSelection("اب", "اب", Number.NaN, Number.NaN)).toEqual({ start: 2, end: 2 });
  });
});

describe("applyPersianInputTransform", () => {
  const defaultTransform = resolvePersianInputTransform();

  it("normalizes a dirty value and restores the caret", () => {
    let restored: { start: number; end: number } | null = null;
    const element = {
      value: "مي شود",
      selectionStart: 5,
      selectionEnd: 5,
      setSelectionRange(start: number, end: number) {
        restored = { start, end };
      },
    };
    const result = applyPersianInputTransform(element, defaultTransform);
    expect(result.value).toBe("می\u200cشود");
    expect(result.changed).toBe(true);
    expect(restored).toEqual({ start: 5, end: 5 });
  });

  it("leaves the element untouched when nothing changes", () => {
    let selections: unknown[] = [];
    const element = {
      value: "می\u200cشود",
      selectionStart: 4,
      selectionEnd: 4,
      setSelectionRange: (start: number, end: number) => selections.push([start, end]),
    };
    const result = applyPersianInputTransform(element, defaultTransform);
    expect(result.changed).toBe(false);
    expect(result.value).toBe("می\u200cشود");
    expect(selections).toEqual([]);
  });

  it("falls back to selectionStart/selectionEnd assignment without setSelectionRange", () => {
    const element = {
      value: "ك",
      selectionStart: 1,
      selectionEnd: 1,
    };
    const result = applyPersianInputTransform(element, resolvePersianInputTransform(false));
    expect(result.changed).toBe(false);
    expect(result.value).toBe("ك");
  });

  it("restores the caret past a fold on a fake element", () => {
    let restored: { start: number; end: number } | null = null;
    const element = {
      value: "می\u200c شود",
      selectionStart: 4,
      selectionEnd: 4,
      setSelectionRange(start: number, end: number) {
        restored = { start, end };
      },
    };
    applyPersianInputTransform(element, defaultTransform);
    expect(element.value).toBe("می\u200cشود");
    expect(restored).toEqual({ start: 3, end: 3 });
  });
});