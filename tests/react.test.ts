import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  formatCurrency,
  toRial,
  toToman,
  useEnglishDigits,
  useJalaliDate,
  usePersianDigits,
} from "../src/react/index.js";

/**
 * The hooks run inside a real rendered component, which also proves they are
 * valid React hooks (e.g. they can be invoked from React's render phase).
 */
function PersianPrice({ value }: { value: string | number }) {
  return createElement(
    "output",
    { "data-transformed": usePersianDigits(value) },
    usePersianDigits(value),
  );
}

function EnglishPrice({ value }: { value: string | number }) {
  return createElement("output", null, useEnglishDigits(value));
}

function JalaliDate({
  date,
  format,
}: {
  date: string | Date | number;
  format?: string;
}) {
  return createElement("output", { "data-date": useJalaliDate(date, format) }, null);
}

describe("react helpers", () => {
  it("usePersianDigits returns Persian digits for numbers and strings", () => {
    const html = renderToStaticMarkup(createElement(PersianPrice, { value: 12500 }));
    expect(html).toBe('<output data-transformed="۱۲۵۰۰">۱۲۵۰۰</output>');
  });

  it("usePersianDigits leaves existing Persian digits unchanged", () => {
    const html = renderToStaticMarkup(createElement(PersianPrice, { value: "۱۲۵۰۰" }));
    expect(html).toContain("۱۲۵۰۰");
  });

  it("usePersianDigits returns a stable string across values", () => {
    const results: string[] = [];
    function Collector({ value }: { value: string | number }) {
      results.push(usePersianDigits(value));
      return createElement("span");
    }
    renderToStaticMarkup(
      createElement(Collector, { value: 1 }),
    );
    renderToStaticMarkup(createElement(Collector, { value: 99 }));
    expect(results).toEqual(["۱", "۹۹"]);
  });

  it("useEnglishDigits converts Persian digits back to English", () => {
    const html = renderToStaticMarkup(createElement(EnglishPrice, { value: "۱۲۵۰۰" }));
    expect(html).toBe("<output>12500</output>");
  });
});

describe("useJalaliDate", () => {
  const nowruz = new Date(2024, 2, 20); // ۱ فروردین ۱۴۰۳
  const lastDay = new Date(2025, 2, 20); // ۳۰ اسفند ۱۴۰۳ (leap year day)

  it("formats a Date with the default YYYY/MM/DD pattern", () => {
    const html = renderToStaticMarkup(createElement(JalaliDate, { date: nowruz }));
    expect(html).toBe('<output data-date="1403/01/01"></output>');
  });

  it("accepts ISO strings and Unix timestamps", () => {
    const byString = renderToStaticMarkup(
      createElement(JalaliDate, { date: nowruz.toString() }),
    );
    const byNumber = renderToStaticMarkup(
      createElement(JalaliDate, { date: nowruz.getTime() }),
    );
    expect(byString).toBe('<output data-date="1403/01/01"></output>');
    expect(byNumber).toBe('<output data-date="1403/01/01"></output>');
  });

  it("re-formats when the date changes", () => {
    const results: string[] = [];
    function Collector({ date }: { date: string | Date | number }) {
      results.push(useJalaliDate(date));
      return createElement("span");
    }
    renderToStaticMarkup(createElement(Collector, { date: nowruz }));
    renderToStaticMarkup(createElement(Collector, { date: lastDay }));
    expect(results).toEqual(["1403/01/01", "1403/12/30"]);
  });

  it("re-formats when the format string changes", () => {
    const results: string[] = [];
    function Collector({ format }: { format?: string }) {
      results.push(useJalaliDate(nowruz, format));
      return createElement("span");
    }
    renderToStaticMarkup(createElement(Collector, {}));
    renderToStaticMarkup(createElement(Collector, { format: "d MMMM YYYY" }));
    expect(results).toEqual(["1403/01/01", "1 فروردین 1403"]);
  });

  it("renders Persian month names for MMMM/MMM tokens", () => {
    const full = renderToStaticMarkup(
      createElement(JalaliDate, { date: nowruz, format: "d MMMM YYYY" }),
    );
    const abbr = renderToStaticMarkup(
      createElement(JalaliDate, { date: nowruz, format: "YYYY MMM DD" }),
    );
    expect(full).toBe('<output data-date="1 فروردین 1403"></output>');
    expect(abbr).toContain("فروردین");
  });

  it("handles leap-year boundaries (1403 has an Esfand 30)", () => {
    const wrap = new Date(2025, 2, 21); // ۱ فروردین ۱۴۰۴
    const before = new Date(2024, 2, 19); // ۲۹ اسفند ۱۴۰۲
    const html = renderToStaticMarkup(createElement(JalaliDate, { date: wrap }));
    const htmlBefore = renderToStaticMarkup(createElement(JalaliDate, { date: before }));
    expect(html).toBe('<output data-date="1404/01/01"></output>');
    expect(htmlBefore).toBe('<output data-date="1402/12/29"></output>');
  });

  it("returns an empty string for invalid and nullish input", () => {
    const invalid = renderToStaticMarkup(
      createElement(JalaliDate, { date: new Date("not a date") }),
    );
    // @ts-expect-error nullish input is only allowed at runtime
    const nullish = renderToStaticMarkup(createElement(JalaliDate, { date: null }));
    const garbage = renderToStaticMarkup(
      createElement(JalaliDate, { date: "nonsense-string" }),
    );
    expect(invalid).toBe('<output data-date=""></output>');
    expect(nullish).toBe('<output data-date=""></output>');
    expect(garbage).toBe('<output data-date=""></output>');
  });
});

describe("react entry re-exports", () => {
  it("re-exports the currency utilities", () => {
    expect(toToman("۱۰۰۰۰")).toBe(1000);
    expect(toRial(1000)).toBe(10000);
    expect(formatCurrency(12500000)).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
  });
});