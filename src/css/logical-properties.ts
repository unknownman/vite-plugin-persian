/**
 * CSS logical properties transformer (v0.3.0, opt-in via
 * `experimental.logicalProperties`).
 *
 * Implemented as a PostCSS plugin object (no runtime import of `postcss`
 * needed — the consumer's own PostCSS instance — i.e. the one Vite wires
 * into its CSS pipeline — invokes the visitor). Because it hooks into Vite's
 * CSS pipeline, it covers `.css` files and `<style>` blocks (including
 * preprocessed output) with zero author-side refactoring.
 */

/** Shape of the Declaration node the visitor mutates. */
interface DeclarationLike {
  prop: string;
  value: string;
}

/**
 * Physical → logical rewrite table for inline-axis `margin`, `padding`, and
 * the positioning `left`/`right` properties. Rewrites are applied verbatim:
 * `margin-left` becomes `margin-inline-start`, etc.
 */
export const INLINE_AXIS_MAP: Readonly<Record<string, string>> = {
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  // Only positioned elements honor `left`/`right`; `inset-inline-*` is the
  // drop-in logical equivalent that also honors RTL.
  left: "inset-inline-start",
  right: "inset-inline-end",
};

/**
 * Value rewrites for `text-align`: physical `left`/`right` map to the logical
 * `start`/`end`, which follow the computed writing direction.
 */
export const TEXT_ALIGN_INLINE: Readonly<Record<string, string>> = {
  left: "start",
  right: "end",
};

/**
 * Rewrites a single CSS declaration in place: physical inline-axis properties
 * to their logical equivalents, and `text-align: left|right` to `start|end`.
 * Identifiers that are already logical pass through untouched.
 */
export function rewriteDeclaration(decl: DeclarationLike): void {
  const property = decl.prop.trim().toLowerCase();
  const logical = INLINE_AXIS_MAP[property];
  if (logical !== undefined) {
    decl.prop = logical;
    return;
  }
  if (property === "text-align") {
    const inline = TEXT_ALIGN_INLINE[decl.value.trim().toLowerCase()];
    if (inline !== undefined) {
      decl.value = inline;
    }
  }
}

/**
 * PostCSS plugin wired into Vite's `css.postcss.plugins`, marked by an
 * `experimental.*` namespace so it is clearly distinguishable from the core
 * plugin's own hooks.
 */
export const logicalPropertiesPostCss: {
  postcssPlugin: string;
  Declaration: (decl: DeclarationLike) => void;
} = {
  postcssPlugin: "vite-plugin-persian:logical-properties",
  Declaration: rewriteDeclaration,
};

/** Short, stable label used in option resolution and errors. */
export const LOGICAL_PROPERTIES_ID = "logical-properties";