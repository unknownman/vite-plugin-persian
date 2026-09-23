/**
 * CSS logical properties transformer (v0.3.0, opt-in via
 * `experimental.logicalProperties`).
 *
 * Implemented as a PostCSS plugin object (no runtime import of `postcss`
 * needed — the consumer's own PostCSS instance — i.e. the one Vite wires
 * into its CSS pipeline — invokes the visitor). Because it hooks into Vite's
 * CSS pipeline, it covers `.css` files and `<style>` blocks (including
 * preprocessed output) with zero author-side refactoring.
 *
 * Exclusions (v0.3.1):
 *
 * - A comment containing `@persian-ignore` directly *above* a rule skips that
 *   whole rule.
 * - The same comment directly *before* a declaration skips that declaration.
 * - The same comment as the very first token of a file skips the entire file,
 *   unless it directly guards the file's first rule (then it is scoped to that
 *   rule only) — handy for vendored third-party stylesheets.
 * - Selectors may be listed in `ignoreSelectors` (exact strings or RegExps);
 *   any rule whose selector matches is left untouched.
 */

/** Shape of the Declaration node the visitor mutates. */
interface DeclarationLike {
  prop: string;
  value: string;
  /** Optional PostCSS wiring used only for the ignore-marker feature. */
  parent?: { selector?: string; prev?: () => unknown } | null | undefined;
  prev?: () => unknown;
  root?: () => unknown;
}

/** Extra PostCSS container wiring needed for ignore detection. */
interface ContainerLike {
  first?: unknown;
  next?: () => unknown;
  type?: string;
}

/** The marker that opts a rule/declaration/file out of the transformation. */
export const IGNORE_MARKER = "@persian-ignore";

/** Matches the marker inside a PostCSS comment's `text`. */
const IGNORE_PATTERN = /@persian-ignore/;

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

/** Guards against empty/null PostCSS siblings. */
function isNode(value: unknown): value is { type?: string; text?: string } {
  return typeof value === "object" && value !== null;
}

/** The node is a comment whose text carries the `@persian-ignore` marker. */
export function isIgnoreComment(value: unknown): boolean {
  return (
    isNode(value) &&
    value.type === "comment" &&
    typeof value.text === "string" &&
    IGNORE_PATTERN.test(value.text)
  );
}

/** The node's immediately preceding sibling is an `@persian-ignore` comment. */
function hasIgnoringPreviousSibling(node: unknown): boolean {
  if (!isNode(node)) {
    return false;
  }
  const prev = (node as { prev?: () => unknown }).prev?.();
  return isIgnoreComment(prev);
}

/**
 * True when the file-wide opt-out applies: the very first token of the file
 * is an `@persian-ignore` comment that is NOT directly guarding the file's
 * first rule (that case is scoped to the rule instead).
 */
function fileWideMarkerPresent(node: unknown): boolean {
  const root = (node as { root?: () => unknown } | undefined)?.root?.() as
    | ContainerLike
    | null
    | undefined;
  const first = root?.first;
  if (!isIgnoreComment(first)) {
    return false;
  }
  const second = (first as { next?: () => unknown } | null | undefined)?.next?.();
  return !second || !isNode(second) || second.type !== "rule";
}

/** Any selector in the rule's (comma-separated) selector list matches an ignore entry. */
function selectorMatchesIgnore(
  node: unknown,
  ignoreSelectors: readonly (string | RegExp)[],
): boolean {
  const selector = (node as { parent?: { selector?: string } } | undefined)?.parent
    ?.selector;
  if (selector === undefined) {
    return false;
  }
  const selectors = selector.split(",").map((s) => s.trim());
  for (const rule of ignoreSelectors) {
    for (const candidate of selectors) {
      const hit = typeof rule === "string" ? rule === candidate : rule.test(candidate);
      if (hit) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Decides whether a declaration must bypass the transformation, checking the
 * three comment markers first (file → rule → declaration precedence) and then
 * the configured selector list.
 */
export function isDeclarationIgnored(
  decl: DeclarationLike,
  options: LogicalPropertiesPluginOptions,
): boolean {
  if (options.ignoreSelectors !== undefined && options.ignoreSelectors.length > 0) {
    if (selectorMatchesIgnore(decl, options.ignoreSelectors)) {
      return true;
    }
  }
  // Whole-file opt-out unless the marker directly guards the first rule.
  if (fileWideMarkerPresent(decl)) {
    return true;
  }
  // Rule-level opt-out: the marker sits directly above the rule.
  if (hasIgnoringPreviousSibling(decl.parent)) {
    return true;
  }
  // Declaration-level opt-out: the marker sits directly above the declaration.
  return hasIgnoringPreviousSibling(decl);
}

/**
 * Configuration for the configured-exclusion mechanism (the `ignore` array
 * from `experimental.logicalProperties`).
 */
export interface LogicalPropertiesPluginOptions {
  /**
   * Selectors that bypass the transformation. Strings match one selector in a
   * rule's selector list exactly; RegExps are tested against each selector.
   */
  ignoreSelectors?: readonly (string | RegExp)[];
}

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
 * Creates the PostCSS plugin wired into Vite's `css.postcss.plugins`, marked
 * by an `experimental.*` namespace so it is clearly distinguishable from the
 * core plugin's own hooks. Pass `ignoreSelectors` to bypass transformation
 * for matching rules.
 */
export function createLogicalPropertiesPostCss(
  options: LogicalPropertiesPluginOptions = {},
): {
  postcssPlugin: string;
  Declaration: (decl: DeclarationLike) => void;
} {
  return {
    postcssPlugin: "vite-plugin-persian:logical-properties",
    Declaration(decl) {
      if (isDeclarationIgnored(decl, options)) {
        return;
      }
      rewriteDeclaration(decl);
    },
  };
}

/**
 * Default PostCSS plugin instance with no exclusions, kept for the
 * backward-compatible `true` toggle.
 */
export const logicalPropertiesPostCss = createLogicalPropertiesPostCss();

/** Short, stable label used in option resolution and errors. */
export const LOGICAL_PROPERTIES_ID = "logical-properties";