/**
 * Shared DOM helpers for the framework input handlers (`v0.4.0`).
 *
 * `applyPersianInputTransform` is the single place where the "normalize the
 * live value, keep the caret in place" behavior for `<input>`/`<textarea>`
 * elements is implemented. The React/Vue/Svelte bindings all delegate to it,
 * which keeps cursor handling identical across frameworks.
 */
import type { ApplyPersianInputResult, PersianEditableElement } from "../types.js";
import type { PersianTextTransform } from "../types.js";
import { adjustSelection } from "./caret.js";

/**
 * The subset of an editable element that the formatter touches, so tests and
 * SSR-safe code can drive it with plain objects.
 */
export type { ApplyPersianInputResult, PersianEditableElement };

/**
 * Returns `true` when `node` is a text-bearing form control whose `.value`
 * carries the user's input (`<input>` or `<textarea>`, nothing else).
 */
export function isTextEditableElement(node: unknown): node is PersianEditableElement {
  return (
    (typeof HTMLInputElement !== "undefined" && node instanceof HTMLInputElement) ||
    (typeof HTMLTextAreaElement !== "undefined" && node instanceof HTMLTextAreaElement)
  );
}

/**
 * Applies `transform` to an editable element's live `.value`, writing the
 * normalized result back and restoring the caret to the position where the
 * user left it.
 *
 * - If the transform does not change the value, the element is left untouched
 *   (so it never fights the user or resets the caret on a no-op keystroke).
 * - Otherwise the value is replaced and the selection is re-mapped via
 *   {@link adjustSelection}. When `setSelectionRange` is unavailable or
 *   rejected (e.g. hidden/number inputs), the caret restore is best-effort.
 *
 * Returns the new value, whether it changed, and the restored selection.
 */
export function applyPersianInputTransform(
  element: PersianEditableElement,
  transform: PersianTextTransform,
): ApplyPersianInputResult {
  const raw = element.value;
  const transformed = transform(raw);
  const start = element.selectionStart ?? raw.length;
  const end = element.selectionEnd ?? start;

  if (transformed === raw) {
    return { value: raw, changed: false, selection: { start, end } };
  }

  const selection = adjustSelection(raw, transformed, start, end);
  element.value = transformed;

  if (typeof element.setSelectionRange === "function") {
    try {
      element.setSelectionRange(selection.start, selection.end);
    } catch {
      // Some hosts reject programmatic selection; the value is still
      // normalized and only the caret restore is skipped.
    }
  } else {
    element.selectionStart = selection.start;
    element.selectionEnd = selection.end;
  }

  return { value: transformed, changed: true, selection };
}