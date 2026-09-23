/**
 * Caret/cursor tracking for live input normalization (`v0.4.0`).
 *
 * When a transform rewrites text while the user types (inserts a ZWNJ, swaps
 * an Arabic letter for a Persian one), browsers move the caret to the end of
 * the field. `adjustSelection` maps the previous selection onto the
 * transformed string so handlers can restore the caret exactly.
 *
 * The mapping exploits a property of the transforms in `normalization.ts`:
 * every rewrite is either a **1:1 replacement** (same length, same position)
 * or a **pure deletion**. Insertions never happen, so an old caret boundary
 * always corresponds to exactly one new boundary.
 */
import type { PersianSelection } from "../types.js";

/**
 * Maps a selection range in `oldValue` onto `newValue`.
 *
 * - Boundaries inside the unchanged prefix/suffix map 1:1.
 * - Boundaries after an edited block shift by the length delta.
 * - Boundaries *inside* an edited block are aligned character-by-character:
 *   replaced characters consume one unit on each side, deleted characters
 *   consume only the old side.
 *
 * Returns a clamped, normalized range (`start <= end`, both within
 * `newValue.length`).
 */
export function adjustSelection(
  oldValue: string,
  newValue: string,
  selectionStart: number,
  selectionEnd: number,
): PersianSelection {
  const clampedStart = clamp(selectionStart, oldValue.length);
  const clampedEnd = clamp(selectionEnd, oldValue.length);

  if (oldValue === newValue) {
    return { start: clampedStart, end: Math.max(clampedStart, clampedEnd) };
  }

  const oldLen = oldValue.length;
  const newLen = newValue.length;

  // Longest unchanged prefix.
  const maxPrefix = Math.min(oldLen, newLen);
  let prefix = 0;
  while (prefix < maxPrefix && oldValue[prefix] === newValue[prefix]) {
    prefix++;
  }

  // Longest unchanged suffix (never overlapping the prefix).
  let suffix = 0;
  const maxSuffix = maxPrefix - prefix;
  while (
    suffix < maxSuffix &&
    oldValue[oldLen - 1 - suffix] === newValue[newLen - 1 - suffix]
  ) {
    suffix++;
  }

  // The edited region is [prefix, oldLen - suffix) in the old string and
  // maps onto [prefix, newLen - suffix) in the new one.
  const oldBlockEnd = oldLen - suffix;
  const delta = newLen - oldLen;

  const map = (position: number): number => {
    if (position <= prefix) {
      return position;
    }
    if (position >= oldBlockEnd) {
      return position + delta;
    }

    // Inside the edited block: walk both strings in parallel. Equal
    // characters advance together; on a mismatch, figure out whether the old
    // character was deleted (its successor matches the current new char) or
    // replaced (consume one unit from each side).
    let i = prefix;
    let j = prefix;
    while (i < position && i < oldLen && j < newLen) {
      if (oldValue[i] === newValue[j]) {
        i++;
        j++;
        continue;
      }
      let next = i + 1;
      while (next < oldLen && oldValue[next] !== newValue[j]) {
        next++;
      }
      if (next < oldLen) {
        // `newValue[j]` comes from a later old index → everything skipped was
        // deleted by the transform.
        i = next;
        continue;
      }
      // Otherwise `newValue[j]` is the replacement of `oldValue[i]`.
      i++;
      j++;
    }
    return j;
  };

  const start = clamp(map(clampedStart), newLen);
  const end = clamp(map(clampedEnd), newLen);
  return { start, end: Math.max(start, end) };
}

function clamp(value: number, max: number): number {
  if (Number.isNaN(value)) {
    return max;
  }
  return Math.max(0, Math.min(value, max));
}