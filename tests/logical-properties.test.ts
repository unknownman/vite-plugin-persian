import postcss from "postcss";
import { describe, expect, it } from "vitest";
import {
  INLINE_AXIS_MAP,
  TEXT_ALIGN_INLINE,
  logicalPropertiesPostCss,
} from "../src/css/logical-properties.js";

/** Runs the transformer over a CSS string using a real PostCSS instance. */
function logicalize(css: string): string {
  return postcss([logicalPropertiesPostCss]).process(css, { from: undefined }).css;
}

describe("inline-axis property rewrites", () => {
  it("covers margin, padding, and the positioning left/right", () => {
    expect(INLINE_AXIS_MAP).toEqual({
      "margin-left": "margin-inline-start",
      "margin-right": "margin-inline-end",
      "padding-left": "padding-inline-start",
      "padding-right": "padding-inline-end",
      left: "inset-inline-start",
      right: "inset-inline-end",
    });
  });

  it("rewrites physical inline properties to logical ones", () => {
    const css = `
      .box {
        margin-left: 1rem;
        margin-right: 2rem;
        padding-left: 4px;
        padding-right: 8px;
        left: 0;
        right: auto;
      }
    `;
    const out = logicalize(css);
    expect(out).toContain("margin-inline-start: 1rem");
    expect(out).toContain("margin-inline-end: 2rem");
    expect(out).toContain("padding-inline-start: 4px");
    expect(out).toContain("padding-inline-end: 8px");
    expect(out).toContain("inset-inline-start: 0");
    expect(out).toContain("inset-inline-end: auto");
    expect(out).not.toContain("margin-left");
    expect(out).not.toContain("padding-right");
  });

  it("leaves already-logical properties alone", () => {
    const css = `
      .box {
        margin-inline-start: 1rem;
        margin-inline-end: 1rem;
        inset-inline: 0;
      }
    `;
    expect(logicalize(css).trim()).toBe(css.trim());
  });
});

describe("text-align rewrites", () => {
  it("maps left/right to start/end", () => {
    expect(TEXT_ALIGN_INLINE).toEqual({ left: "start", right: "end" });
    const out = logicalize(`
      .a { text-align: left; }
      .b { text-align: right; }
      .c { text-align: center; }
    `);
    expect(out).toContain("text-align: start");
    expect(out).toContain("text-align: end");
    expect(out).toContain("text-align: center");
  });

  it("is case-insensitive for values", () => {
    const out = logicalize(".a { text-align: LEFT; }");
    expect(out).toContain("text-align: start");
  });
});

describe("declaration edge cases", () => {
  it("preserves !important", () => {
    const out = logicalize(".a { margin-left: 1rem !important; }");
    expect(out).toContain("margin-inline-start: 1rem !important");
  });

  it("preserves values and comments around rewritten rules", () => {
    const out = logicalize("/* keep */\n.a { padding-right: 10px; } /* end */");
    expect(out).toContain("/* keep */");
    expect(out).toContain("padding-inline-end: 10px");
    expect(out).toContain("/* end */");
  });

  it("rewrites inside nested rules and media queries", () => {
    const out = logicalize(`
      @media (max-width: 600px) {
        .a { margin-right: 5px; }
      }
    `);
    expect(out).toContain("margin-inline-end: 5px");
  });
});

describe("plugin shape", () => {
  it("exposes a PostCSS-compatible plugin object", () => {
    expect(logicalPropertiesPostCss.postcssPlugin).toBe(
      "vite-plugin-persian:logical-properties",
    );
    expect(typeof logicalPropertiesPostCss.Declaration).toBe("function");
  });
});

describe("selectors and at-rules pass through", () => {
  it("does not touch rule selectors or @-rules", () => {
    const css = `@supports (display: grid) { .margin-left-custom { color: red; } }`;
    const out = logicalize(css);
    expect(out).toContain("@supports (display: grid)");
    expect(out).toContain(".margin-left-custom");
    expect(out).toContain("color: red");
  });
});