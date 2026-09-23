import postcss from "postcss";
import { describe, expect, it } from "vitest";
import {
  IGNORE_MARKER,
  INLINE_AXIS_MAP,
  TEXT_ALIGN_INLINE,
  createLogicalPropertiesPostCss,
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

describe("@persian-ignore magic comment", () => {
  it("exposes the marker constant", () => {
    expect(IGNORE_MARKER).toBe("@persian-ignore");
  });

  it("leaves a rule marked above untouched and rewrites siblings", () => {
    const css = `
      /* @persian-ignore */
      .legacy-fixed-sidebar {
        margin-left: 20px;
        padding-right: 4px;
      }
      .modern {
        margin-left: 30px;
      }
    `;
    const out = logicalize(css);
    expect(out).toContain("margin-left: 20px");
    expect(out).toContain("padding-right: 4px");
    expect(out).not.toContain("margin-inline-start: 20px");
    expect(out).toContain("margin-inline-start: 30px");
  });

  it("skips a single declaration marked inline", () => {
    const css = `.a { /* @persian-ignore */ margin-right: 1rem; padding-left: 2rem; }`;
    const out = logicalize(css);
    expect(out).toContain("margin-right: 1rem");
    expect(out).toContain("padding-inline-start: 2rem");
    expect(out).not.toContain("margin-inline-end: 1rem");
  });

  it("skips the entire file when the marker is the first token and guards no rule", () => {
    const css = `
      /* @persian-ignore */
      /* vendored third-party stylesheet */
      .a { margin-left: 1px; }
      .b { padding-right: 2px; }
    `;
    const out = logicalize(css);
    expect(out).toContain("margin-left: 1px");
    expect(out).toContain("padding-right: 2px");
    expect(out).not.toContain("margin-inline");
    expect(out).not.toContain("padding-inline");
  });

  it("scopes a top-of-file marker to its guarded first rule only", () => {
    const css = `
      /* @persian-ignore */
      .legacy { margin-left: 3px; }
      .modern { padding-right: 4px; }
    `;
    const out = logicalize(css);
    expect(out).toContain("margin-left: 3px");
    expect(out).toContain("padding-inline-end: 4px");
  });

  it("does not affect rules whose preceding comment has no marker", () => {
    const css = `/* keep */\n.a { margin-left: 1px; }`;
    const out = logicalize(css);
    expect(out).toContain("margin-inline-start: 1px");
  });
});

describe("ignore selector configuration", () => {
  it("bypasses rules whose selector matches the ignore list", () => {
    const plugin = createLogicalPropertiesPostCss({
      ignoreSelectors: [".legacy-fixed-sidebar"],
    });
    const out = postcss([plugin])
      .process(
        `
        .legacy-fixed-sidebar { margin-left: 20px; }
        .modern { margin-right: 20px; }
        `,
        { from: undefined },
      )
      .css;
    expect(out).toContain("margin-left: 20px");
    expect(out).toContain("margin-inline-end: 20px");
  });

  it("supports RegExp patterns across a comma-separated selector list", () => {
    const plugin = createLogicalPropertiesPostCss({ ignoreSelectors: [/^\.island-/] });
    const out = postcss([plugin])
      .process(
        ".island-legacy, .modern { padding-right: 5px; } .other { margin-right: 7px; }",
        { from: undefined },
      )
      .css;
    expect(out).toContain("padding-right: 5px");
    expect(out).toContain("margin-inline-end: 7px");
  });

  it("default-instance rewrites everything (no exclusions)", () => {
    const out = postcss([logicalPropertiesPostCss])
      .process(".a { margin-left: 1px; }", { from: undefined })
      .css;
    expect(out).toContain("margin-inline-start: 1px");
  });
});