// @vitest-environment jsdom
import { expect, describe, it } from "vitest";
import { get, readable, writable } from "svelte/store";
import {
  formatCurrency,
  isMobileNumber,
  isNationalCode,
  normalizeMobileNumber,
  persianDigits,
  toNumberWords,
  toPersianDigits,
  toRial,
  toToman,
  useEnglishDigits,
  useJalaliDate,
  useMobileNumber,
  useNationalCode,
  useNumberWords,
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

describe("useJalaliDate", () => {
  const nowruz = new Date(2024, 2, 20); // ۱ فروردین ۱۴۰۳

  it("formats a plain date with the default pattern", () => {
    expect(get(useJalaliDate(nowruz))).toBe("1403/01/01");
  });

  it("reacts to a writable date store", async () => {
    const source = writable<Date>(nowruz);
    const jalaali = useJalaliDate(source);
    expect(get(jalaali)).toBe("1403/01/01");
    source.set(new Date(2025, 2, 21)); // ۱ فروردین ۱۴۰۴
    expect(get(jalaali)).toBe("1404/01/01");
    source.set(new Date(2024, 2, 19)); // ۲۹ اسفند ۱۴۰۲
    expect(get(jalaali)).toBe("1402/12/29");
    await flush();
  });

  it("reacts to changes in the format string (store and plain)", async () => {
    const format = writable("YYYY/MM/DD");
    const jalaali = useJalaliDate(nowruz, format);
    expect(get(jalaali)).toBe("1403/01/01");
    format.set("d MMMM YYYY");
    expect(get(jalaali)).toBe("1 فروردین 1403");
    format.set("YYYY");
    expect(get(jalaali)).toBe("1403");
    expect(get(useJalaliDate(nowruz, "d MMMM YYYY"))).toBe("1 فروردین 1403");
    await flush();
  });

  it("reacts when both the date and the format update", async () => {
    const source = writable<Date>(nowruz);
    const format = writable("YYYY/MM/DD");
    const jalaali = useJalaliDate(source, format);
    expect(get(jalaali)).toBe("1403/01/01");
    source.set(new Date(2025, 2, 20)); // ۳۰ اسفند ۱۴۰۳ (leap day)
    format.set("DD MMMM YYYY");
    expect(get(jalaali)).toBe("30 اسفند 1403");
    await flush();
  });

  it("works with an already-reactive readable date", () => {
    const jalaali = useJalaliDate(readable(nowruz), "YYYY");
    expect(get(jalaali)).toBe("1403");
  });

  it("handles leap-year boundaries (1403 has an Esfand 30)", () => {
    expect(get(useJalaliDate(new Date(2025, 2, 20), "DD MMMM YYYY"))).toBe("30 اسفند 1403");
    expect(get(useJalaliDate(new Date(2025, 2, 21), "d YYYY"))).toBe("1 1404");
  });

  it("returns an empty string for invalid, nullish, and garbage input", () => {
    expect(get(useJalaliDate(new Date("not a date")))).toBe("");
    // @ts-expect-error nullish input is only allowed at runtime
    expect(get(useJalaliDate(null))).toBe("");
    expect(get(useJalaliDate("nonsense-string"))).toBe("");
  });

  it("unsubscribes cleanly from both stores", async () => {
    const source = writable<Date>(nowruz);
    const format = writable("YYYY/MM/DD");
    const jalaali = useJalaliDate(source, format);
    const seen: string[] = [];
    const unsub = jalaali.subscribe((value) => seen.push(value));
    await flush();
    source.set(new Date(2025, 2, 21));
    await flush();
    unsub();
    format.set("YYYY");
    await flush();
    expect(seen).toEqual(["1403/01/01", "1404/01/01"]);
  });
});

describe("useNationalCode", () => {
  it("validates a plain value", () => {
    expect(get(useNationalCode("0010042911"))).toBe(true);
    expect(get(useNationalCode("1234567890"))).toBe(false);
  });

  it("reacts to a writable source", () => {
    const code = writable("0010042911");
    const valid = useNationalCode(code);
    expect(get(valid)).toBe(true);
    code.set("1234567890");
    expect(get(valid)).toBe(false);
  });
});

describe("useMobileNumber", () => {
  it("validates a plain value", () => {
    expect(get(useMobileNumber("+98 912 345 6789"))).toBe(true);
    expect(get(useMobileNumber("0912"))).toBe(false);
  });

  it("reacts to a writable source", () => {
    const phone = writable("00989123456789");
    const valid = useMobileNumber(phone);
    expect(get(valid)).toBe(true);
    phone.set("09500000000");
    expect(get(valid)).toBe(false);
  });
});

describe("useNumberWords", () => {
  it("spells out a plain value", () => {
    expect(get(useNumberWords(12500))).toBe("دوازده هزار و پانصد");
    expect(get(useNumberWords(0))).toBe("صفر");
    expect(get(useNumberWords(-7))).toBe("منفی هفت");
  });

  it("reacts to a writable source", async () => {
    const amount = writable<number>(12500);
    const words = useNumberWords(amount);
    expect(get(words)).toBe("دوازده هزار و پانصد");
    amount.set(12545);
    expect(get(words)).toBe("دوازده هزار و پانصد و چهل و پنج");
    amount.set(1000000);
    expect(get(words)).toBe("یک میلیون");
    await flush();
  });
});

describe("svelte entry re-exports", () => {
  it("re-exports text and currency utilities", () => {
    expect(toPersianDigits(7)).toBe("۷");
    expect(toToman("۱۰۰۰۰")).toBe(1000);
    expect(toRial(1000)).toBe(10000);
    expect(formatCurrency(12500000)).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
    expect(formatCurrency(2500000, { unit: "ریال", digits: "english" })).toBe("2,500,000 ریال");
    expect(isNationalCode("0010042911")).toBe(true);
    expect(isMobileNumber("09123456789")).toBe(true);
    expect(normalizeMobileNumber("+989123456789")).toBe("09123456789");
    expect(toNumberWords(21)).toBe("بیست و یک");
  });
});