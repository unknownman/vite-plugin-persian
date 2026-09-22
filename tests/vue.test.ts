import { describe, expect, it } from "vitest";
import { usePersianDigits, vPersianDigits } from "../src/vue/index.js";

/** Minimal structural view of the directive's hooks, for use outside Vue. */
interface DirectiveHooks {
  mounted?: (el: HTMLElement, binding: { value: string | number | undefined }) => void;
  updated?: (el: HTMLElement, binding: { value: string | number | undefined }) => void;
}

const directive = vPersianDigits as unknown as DirectiveHooks;

/** A fake DOM element that only carries `textContent` (no document needed). */
function textElement(): HTMLElement {
  return { textContent: "" } as unknown as HTMLElement;
}

describe("vPersianDigits directive", () => {
  it("converts a bound numeric value", () => {
    const el = textElement();
    directive.mounted?.(el, { value: 12500 });
    expect(el.textContent).toBe("۱۲۵۰۰");
  });

  it("converts a bound string value", () => {
    const el = textElement();
    directive.mounted?.(el, { value: "1,250,000" });
    expect(el.textContent).toBe("۱,۲۵۰,۰۰۰");
  });

  it("converts the element's pre-existing text when no value is bound", () => {
    const el = textElement();
    el.textContent = "2024/09/22";
    directive.mounted?.(el, { value: undefined });
    expect(el.textContent).toBe("۲۰۲۴/۰۹/۲۲");
  });

  it("re-applies on update with a new value", () => {
    const el = textElement();
    directive.mounted?.(el, { value: 1 });
    expect(el.textContent).toBe("۱");
    directive.updated?.(el, { value: 22 });
    expect(el.textContent).toBe("۲۲");
  });

  it("is idempotent on already-converted text", () => {
    const el = textElement();
    directive.mounted?.(el, { value: "۱۲۵۰۰" });
    directive.updated?.(el, { value: "۱۲۵۰۰" });
    expect(el.textContent).toBe("۱۲۵۰۰");
  });
});

describe("usePersianDigits composable", () => {
  it("exposes the digit and text utilities", () => {
    const { toPersianDigits, toEnglishDigits, normalizePersianText } = usePersianDigits();
    expect(toPersianDigits(2024)).toBe("۲۰۲۴");
    expect(toEnglishDigits("۲۰۲۴")).toBe("2024");
    expect(normalizePersianText("يك   تست")).toBe("یک تست");
  });
});