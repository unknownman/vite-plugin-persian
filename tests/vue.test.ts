import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import {
  formatCurrency,
  toRial,
  toToman,
  useJalaliDate,
  useMobileNumber,
  useNationalCode,
  useNumberWords,
  usePersianDigits,
  vPersianDigits,
} from "../src/vue/index.js";

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

describe("vue entry re-exports", () => {
  it("re-exports the currency utilities", () => {
    expect(toToman("۱۰۰۰۰")).toBe(1000);
    expect(toRial(1000)).toBe(10000);
    expect(formatCurrency(12500000)).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
  });
});

describe("useJalaliDate", () => {
  const nowruz = new Date(2024, 2, 20); // ۱ فروردین ۱۴۰۳

  it("formats a plain value with the default pattern", () => {
    expect(useJalaliDate(nowruz).value).toBe("1403/01/01");
  });

  it("reacts to a Ref<Date> date", () => {
    const date = ref(new Date(2025, 2, 21)); // ۱ فروردین ۱۴۰۴
    const jalaali = useJalaliDate(date);
    expect(jalaali.value).toBe("1404/01/01");
    date.value = nowruz;
    expect(jalaali.value).toBe("1403/01/01");
  });

  it("reacts to a getter function date", () => {
    const date = ref(nowruz);
    const jalaali = useJalaliDate(() => date.value);
    expect(jalaali.value).toBe("1403/01/01");
    date.value = new Date(2024, 2, 21);
    expect(jalaali.value).toBe("1403/01/02");
  });

  it("reacts to changes in the format string (Ref and getter)", () => {
    const format = ref("YYYY/MM/DD");
    const jalaali = useJalaliDate(nowruz, format);
    expect(jalaali.value).toBe("1403/01/01");
    format.value = "d MMMM YYYY";
    expect(jalaali.value).toBe("1 فروردین 1403");
    const fromGetter = useJalaliDate(nowruz, () => "YYYY");
    expect(fromGetter.value).toBe("1403");
  });

  it("works alongside computed sources", () => {
    const date = ref(nowruz);
    const doubled = computed(() => new Date(date.value.getTime() + 24 * 60 * 60 * 1000));
    const jalaali = useJalaliDate(doubled, "d MMMM YYYY");
    expect(jalaali.value).toBe("2 فروردین 1403");
    date.value = new Date(2024, 2, 18);
    expect(jalaali.value).toBe("29 اسفند 1402");
  });

  it("handles leap-year boundaries (1403 has an Esfand 30)", () => {
    expect(useJalaliDate(new Date(2025, 2, 20), "DD MMMM YYYY").value).toBe("30 اسفند 1403");
    expect(useJalaliDate(new Date(2024, 2, 19), "DD MMMM YYYY").value).toBe("29 اسفند 1402");
  });

  it("returns an empty string for invalid, nullish, and garbage input", () => {
    const invalid = ref<Date>(new Date("not a date"));
    expect(useJalaliDate(invalid).value).toBe("");
    // @ts-expect-error nullish input is only allowed at runtime
    expect(useJalaliDate(null).value).toBe("");
    // @ts-expect-error undefined input is only allowed at runtime
    expect(useJalaliDate(undefined).value).toBe("");
    expect(useJalaliDate("nonsense-string").value).toBe("");
  });
});

describe("useNationalCode", () => {
  it("validates plain values", () => {
    expect(useNationalCode("0010042911").value).toBe(true);
    expect(useNationalCode("1234567890").value).toBe(false);
  });

  it("reacts to a Ref and a getter", () => {
    const code = ref("0010042911");
    const valid = useNationalCode(code);
    expect(valid.value).toBe(true);
    code.value = "1234567890";
    expect(valid.value).toBe(false);
    code.value = "0010042911";
    expect(useNationalCode(() => code.value).value).toBe(true);
  });
});

describe("useMobileNumber", () => {
  it("validates plain values", () => {
    expect(useMobileNumber("+989123456789").value).toBe(true);
    expect(useMobileNumber("0912").value).toBe(false);
  });

  it("reacts to a Ref and a getter", () => {
    const phone = ref("+98 912 345 6789");
    const valid = useMobileNumber(phone);
    expect(valid.value).toBe(true);
    phone.value = "09500000000";
    expect(valid.value).toBe(false);
    phone.value = "00989123456789";
    expect(useMobileNumber(() => phone.value).value).toBe(true);
  });
});

describe("useNumberWords", () => {
  it("spells plain values", () => {
    expect(useNumberWords(12500).value).toBe("دوازده هزار و پانصد");
    expect(useNumberWords(0).value).toBe("صفر");
    expect(useNumberWords(-7).value).toBe("منفی هفت");
  });

  it("reacts to a Ref and a getter", () => {
    const amount = ref(12500);
    const words = useNumberWords(amount);
    expect(words.value).toBe("دوازده هزار و پانصد");
    amount.value = 12545;
    expect(words.value).toBe("دوازده هزار و پانصد و چهل و پنج");
    amount.value = 0;
    expect(useNumberWords(() => amount.value).value).toBe("صفر");
  });
});