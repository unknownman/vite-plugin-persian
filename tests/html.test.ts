import { describe, expect, it } from "vitest";
import { createHtmlTransformer } from "../src/html.js";
import type { ResolvedPersianOptions } from "../src/types.js";

const htmlOptions: ResolvedPersianOptions["html"] = { lang: "fa", dir: "rtl" };

describe("createHtmlTransformer", () => {
  it("adds lang and dir to a bare <html> tag", () => {
    const transform = createHtmlTransformer(htmlOptions);
    expect(transform("<!doctype html>\n<html>\n</html>")).toBe(
      '<!doctype html>\n<html lang="fa" dir="rtl">\n</html>',
    );
  });

  it("updates an existing lang attribute", () => {
    const transform = createHtmlTransformer(htmlOptions);
    expect(transform('<html lang="en">')).toBe('<html lang="fa" dir="rtl">');
  });

  it("updates an existing dir attribute and keeps other attributes", () => {
    const transform = createHtmlTransformer(htmlOptions);
    expect(transform('<html lang="en" dir="ltr" class="app" data-x="1">')).toBe(
      '<html lang="fa" dir="rtl" class="app" data-x="1">',
    );
  });

  it("handles single-quoted attributes", () => {
    const transform = createHtmlTransformer(htmlOptions);
    expect(transform("<html lang='en' dir='ltr'>")).toBe(
      '<html lang="fa" dir="rtl">',
    );
  });

  it("handles mixed-case tags and attributes", () => {
    const transform = createHtmlTransformer(htmlOptions);
    expect(transform("<HTML LANG=\"en\">")).toBe('<html lang="fa" dir="rtl">');
  });

  it("preserves a > inside a quoted attribute value", () => {
    const transform = createHtmlTransformer(htmlOptions);
    expect(transform('<html lang="en" data-json="{&quot;a&gt;b&quot;}">')).toBe(
      '<html lang="fa" data-json="{&quot;a&gt;b&quot;}" dir="rtl">',
    );
  });

  it("returns the original HTML when no <html> tag exists", () => {
    const transform = createHtmlTransformer(htmlOptions);
    const input = "<htmlish lounge lint body></div>";
    expect(transform(input)).toBe(input);
  });

  it("does not touch a closing </html> tag when opening tag is present", () => {
    const transform = createHtmlTransformer(htmlOptions);
    expect(transform("<html>\n  <div>hi</div>\n</html>")).toBe(
      '<html lang="fa" dir="rtl">\n  <div>hi</div>\n</html>',
    );
  });

it("only applies attributes that are not undefined", () => {
    const dirOnly = createHtmlTransformer({ lang: "fa", dir: "rtl" });
    expect(dirOnly("<html lang=\"en\" data-x=\"1\">")).toBe(
      '<html lang="fa" data-x="1" dir="rtl">',
    );
  });
});