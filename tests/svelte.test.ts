// @vitest-environment jsdom
import { expect, describe, it } from "vitest";
import { get, writable } from "svelte/store";
import {
  formatCurrency,
  persianDigits,
  toPersianDigits,
  toRial,
  toToman,
  useEnglishDigits,
  usePersianDigits,
} from "../src/svelte/index.js";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("usePersianDigits", () => {
  it("derives Persian digits from a plain value", () => {
    expect(get(usePersianDigits(12500))).toBe("۱۲۵۰۰");
    expect(get(usePersianDigits("2024/09/22"))).toBe("۲۰۲۴/۰۹/۲۲");
  });

  it("reacts to a writable source", async () => {
    const source = writable(12500);
    const digits = usePersianDigits(source);
    expect(get(digits)).toBe("۱۲۵۰۰");
    source.set(99);
    expect(get(digits)).toBe("۹۹");
    source.set(742);
    expect(get(digits)).toBe("۷۴۲");
    await flush();
  });

  it("unsubscribes cleanly (no updates after the last subscriber leaves)", async () => {
    const source = writable(1);
    const digits = usePersianDigits(source);
    const seen: string[] = [];
    const unsub = digits.subscribe((value) => seen.push(value));
    await flush();
    source.set(2);
    await flush();
    unsub();
    source.set(3);
    await flush();
    expect(seen).toEqual(["۱", "۲"]);
  });
});

describe("useEnglishDigits", () => {
  it("converts Persian digits back to English", () => {
    expect(get(useEnglishDigits("۱۲۵۰۰"))).toBe("12500");
    expect(get(useEnglishDigits(123))).toBe("123");
  });

  it("reacts to a writable source", () => {
    const source = writable("۱۲");
    const digits = useEnglishDigits(source);
    expect(get(digits)).toBe("12");
    source.set("۳۳");
    expect(get(digits)).toBe("33");
  });
});

describe("persianDigits action", () => {
  it("renders the parameter as Persian digits into textContent", () => {
    const el = document.createElement("span");
    persianDigits(el, 12500);
    expect(el.textContent).toBe("۱۲۵۰۰");
  });

  it("converts the element's existing text when no parameter is given", () => {
    const el = document.createElement("span");
    el.textContent = "12.500";
    persianDigits(el, undefined);
    expect(el.textContent).toBe("۱۲.۵۰۰");
  });

  it("re-applies on update()", () => {
    const el = document.createElement("span");
    const action = persianDigits(el, 1);
    expect(el.textContent).toBe("۱");
    action.update?.(22);
    expect(el.textContent).toBe("۲۲");
  });

  it("follows a Readable parameter and unsubscribes on destroy", async () => {
    const source = writable(10000);
    const el = document.createElement("span");
    const action = persianDigits(el, source);
    expect(el.textContent).toBe("۱۰۰۰۰");
    source.set(5000);
    await flush();
    expect(el.textContent).toBe("۵۰۰۰");
    action.destroy?.();
    source.set(7);
    await flush();
    expect(el.textContent).toBe("۵۰۰۰");
  });

  it("converts form-control .value for input/textarea", () => {
    const input = document.createElement("input");
    input.value = "250000";
    persianDigits(input, "250000");
    expect(input.value).toBe("۲۵۰۰۰۰");

    const textarea = document.createElement("textarea");
    textarea.value = "1200";
    persianDigits(textarea, 1200);
    expect(textarea.value).toBe("۱۲۰۰");
  });

  it("is idempotent on already-converted text", () => {
    const el = document.createElement("span");
    const action = persianDigits(el, "۱۲۳");
    expect(el.textContent).toBe("۱۲۳");
    action.update?.("۱۲۳");
    expect(el.textContent).toBe("۱۲۳");
  });

  it("switches between plain values and stores", async () => {
    const source = writable(10);
    const el = document.createElement("span");
    const action = persianDigits(el, source);
    action.update?.(42);
    expect(el.textContent).toBe("۴۲");
    source.set(99);
    await flush();
    expect(el.textContent).toBe("۴۲");
    action.destroy?.();
  });

  it("re-renders the element's own text after an update with no value", () => {
    const el = document.createElement("span");
    el.textContent = "500";
    const action = persianDigits(el, undefined);
    expect(el.textContent).toBe("۵۰۰");
    el.textContent = "700";
    action.update?.(undefined);
    expect(el.textContent).toBe("۷۰۰");
  });
});

describe("svelte entry re-exports", () => {
  it("re-exports text and currency utilities", () => {
    expect(toPersianDigits(7)).toBe("۷");
    expect(toToman("۱۰۰۰۰")).toBe(1000);
    expect(toRial(1000)).toBe(10000);
    expect(formatCurrency(12500000)).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
    expect(formatCurrency(2500000, { unit: "ریال", digits: "english" })).toBe("2,500,000 ریال");
  });
});