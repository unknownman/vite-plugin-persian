import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  formatCurrency,
  toRial,
  toToman,
  useEnglishDigits,
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

describe("react entry re-exports", () => {
  it("re-exports the currency utilities", () => {
    expect(toToman("۱۰۰۰۰")).toBe(1000);
    expect(toRial(1000)).toBe(10000);
    expect(formatCurrency(12500000)).toBe("۱۲٬۵۰۰٬۰۰۰ تومان");
  });
});