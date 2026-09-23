/**
 * Persian text normalization primitives (`v0.4.0`).
 *
 * Everything in this file is a pure, side-effect-free function. Unlike
 * `normalizePersianText` (which also collapses whitespace and trims), the
 * functions here deliberately preserve whitespace: they are designed to run
 * on live `<input>`/`<textarea>` values where collapsing or trimming would
 * fight the user while typing.
 *
 * The transforms produced here are either **1:1 character replacements**
 * (Arabic → Persian letters, digit conversion, space → ZWNJ) or **pure
 * deletions** (folding stray spaces/ZWNJs). That property is what lets the
 * caret-restoration logic in `caret.ts` map cursor positions exactly.
 */

import type {
  CreateTextTransform,
  NormalizeHalfSpaces,
  NormalizePersianInput,
  PersianInputOptions,
  PersianTextTransform,
  SanitizePersianText,
  TextNormalizationOptions,
} from "../types.js";
import { toEnglishDigits, toPersianDigits } from "./runtime.js";

/** Zero-width non-joiner (نیم‌فاصله, U+200C). */
const ZWNJ = "\u200c";

/** The Arabic letters that differ from their Persian cousins, mapped to Persian. */
const ARABIC_TO_PERSIAN_LETTERS: ReadonlyMap<string, string> = new Map<string, string>([
  ["\u064a", "\u06cc"], // Arabic yeh ي → Persian yeh ی
  ["\u0649", "\u06cc"], // Alef maksura ى → Persian yeh ی (terminal yeh variation)
  ["\u0643", "\u06a9"], // Arabic kaf ك → Persian kaf ک
]);

const ARABIC_LETTERS_TO_REPLACE = new RegExp(
  `[${[...ARABIC_TO_PERSIAN_LETTERS.keys()].join("")}]`,
  "g",
);

/**
 * Converts Arabic letters to their Persian equivalents without touching
 * anything else:
 *
 * - `ي` (Arabic yeh) and `ى` (alef maksura) → `ی` (Persian yeh)
 * - `ك` (Arabic kaf) → `ک` (Persian kaf)
 *
 * Whitespace, digits, and punctuation are preserved exactly — unlike
 * `normalizePersianText`, this function never collapses or trims, so it is
 * safe to run on the live value of an input field mid-typing.
 *
 * @example
 * ```ts
 * sanitizePersianText("يك كتاب"); // "یک کتاب"
 * sanitizePersianText("مى روم");   // "می روم"
 * ```
 */
export const sanitizePersianText: SanitizePersianText = (value: string): string =>
  value.replace(ARABIC_LETTERS_TO_REPLACE, (char) => ARABIC_TO_PERSIAN_LETTERS.get(char) ?? char);

/**
 * A single space or tab run, matched repeatedly by the half-space rules.
 */
const SPACE_RUN = "[ \\t]+";

/**
 * Folds stray spaces around an existing ZWNJ and collapses ZWNJ runs, so
 * `"می‌ شود"`, `"می ‌شود"`, and `"می‌‌شود"` all become `"می‌شود"`.
 */
const ZWNJ_FOLD_RULES: ReadonlyArray<[RegExp, string]> = [
  [new RegExp(`${ZWNJ}${SPACE_RUN}`, "g"), ZWNJ],
  [new RegExp(`${SPACE_RUN}${ZWNJ}`, "g"), ZWNJ],
  [new RegExp(`${ZWNJ}{2,}`, "g"), ZWNJ],
];

/**
 * Joins the continuous verb prefix `می`/`نمی` to a following verb written
 * with a regular space (`"می شود"` → `"می‌شود"`). The lookbehind keeps the
 * rule from firing mid-word, and the lookahead requires a Persian letter to
 * follow, so `"می 5 دقیقه"` is untouched.
 *
 * Only bind when the "word" before is a boundary (start of string, whitespace,
 * or another ZWNJ) so `میکس`/`میدان` (real words) never get split.
 */
const VERB_PREFIX_RULE = /(?<=^|[\s\u200c])(می|نمی)[ \t]+(?=[\u0600-\u06FF])/g;

/**
 * Joins the suffixes `ها`, `های`, `تر`, and `ترین` to the preceding word when
 * written with a regular space (`"کتاب ها"` → `"کتاب‌ها"`, `"بزرگ تر"` →
 * `"بزرگ‌تر"`). The letter before the space is included so the join is
 * anchored to the previous word, and the following suffix must end cleanly
 * (no further Persian letters) so partial-word matches (e.g. `شتر`) are never
 * rewritten.
 */
const SUFFIX_JOIN_RULE = /([\u0600-\u06FF])(?:[ \t]+)(ها|های|تر|ترین)(?![\u0600-\u06FF\u200c])/g;

/**
 * Inserts or corrects zero-width non-joiners (ZWNJ, نیم‌فاصله) for the common
 * Persian affixes:
 *
 * - Verb prefixes: `"می شود"` → `"می‌شود"`, `"نمی شود"` → `"نمی‌شود"`
 * - Suffixes: `"کتاب ها"` → `"کتاب‌ها"`, `"کتاب های من"` → `"کتاب‌های من"`,
 *   `"بزرگ تر"` → `"بزرگ‌تر"`
 * - Re-pairs already-broken text: `"می‌ شود"`, `"می ‌شود"`, and `"می‌‌شود"`
 *   all collapse to `"می‌شود"`
 *
 * The rules are deliberately conservative — joins happen only where a space
 * (or a stray space beside a ZWNJ) marks an affix boundary. Already-correct
 * text and true compound words are left untouched, and the function is
 * idempotent.
 *
 * @example
 * ```ts
 * normalizeHalfSpaces("می شود و کتاب ها"); // "می‌شود و کتاب‌ها"
 * normalizeHalfSpaces("می ‌شود");          // "می‌شود"
 * ```
 */
export const normalizeHalfSpaces: NormalizeHalfSpaces = (value: string): string => {
  if (value === "" || !/[\u0600-\u06FF]/.test(value)) {
    return value;
  }

  let out = value;
  for (const [rule, replacement] of ZWNJ_FOLD_RULES) {
    out = out.replace(rule, replacement);
  }
  out = out.replace(VERB_PREFIX_RULE, (_match, prefix: string) => `${prefix}${ZWNJ}`);
  out = out.replace(SUFFIX_JOIN_RULE, (_match, letter: string, suffix: string) =>
    `${letter}${ZWNJ}${suffix}`,
  );
  return out;
};

/**
 * Resolves the individual option flags into a fully populated options object.
 */
function resolveNormalizationOptions(options?: TextNormalizationOptions): Required<TextNormalizationOptions> {
  return {
    sanitize: options?.sanitize ?? true,
    halfSpaces: options?.halfSpaces ?? true,
    digits: options?.digits ?? "persian",
  };
}

/**
 * Builds a reusable `PersianTextTransform` that chains the requested
 * normalization steps over any string. Steps run in a fixed order —
 * character sanitization, then half-space correction, then digit conversion —
 * so results are deterministic and idempotent.
 *
 * @example
 * ```ts
 * const input = createTextTransform({ halfSpaces: false });
 * input("می شود"); // "می شود" (digits still converted)
 * ```
 */
export const createTextTransform: CreateTextTransform = (options) => {
  const { sanitize, halfSpaces, digits } = resolveNormalizationOptions(options);
  return (text: string): string => {
    let out = text;
    if (sanitize) {
      out = sanitizePersianText(out);
    }
    if (halfSpaces) {
      out = normalizeHalfSpaces(out);
    }
    if (digits === "persian") {
      out = toPersianDigits(out);
    } else if (digits === "english") {
      out = toEnglishDigits(out);
    }
    return out;
  };
};

/**
 * One-shot convenience wrapper around {@link createTextTransform}: applies the
 * full pipeline to a raw string in a single call.
 *
 * @example
 * ```ts
 * normalizePersianInput("مي شود 12"); // "می‌شود ۱۲"
 * normalizePersianInput("مي شود 12", { digits: "english", halfSpaces: false });
 *                                  // "می شود 12"
 * ```
 */
export const normalizePersianInput: NormalizePersianInput = (text, options) =>
  createTextTransform(options)(text);

/**
 * Accepts either a `PersianInputOptions` object, a boolean toggle, or
 * `undefined`, and returns the transform to apply. `false` disables
 * normalization entirely (identity); `true` / `undefined` use the defaults.
 */
export function resolvePersianInputTransform(
  options?: PersianInputOptions | boolean,
): PersianTextTransform {
  if (options === false) {
    return (text: string): string => text;
  }
  const opts = options === true || options === undefined ? undefined : options;
  if (opts?.transform !== undefined) {
    return opts.transform;
  }
  return createTextTransform(opts);
}

/** Re-exported for consumers that want to annotate their own handlers. */
export type {
  PersianDigitMode,
  PersianInputOptions,
  PersianTextTransform,
  TextNormalizationOptions,
} from "../types.js";