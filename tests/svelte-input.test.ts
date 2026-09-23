// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { persianInput } from "../src/svelte/index.js";
import { isTextEditableElement } from "../src/text/index.js";

afterEach(() => {
  for (const node of Array.from(document.querySelectorAll("template, .persian-fixture"))) {
    node.remove();
  }
});

/**
 * Emulates a Svelte `bind:value` binding: the listener Svelte attaches when
 * compiling `<input bind:value>` listens to `input` events and stores
 * `target.value`. It is attached *before* the action runs, matching Svelte's
 * mount ordering.
 */
function bindValueLike(input: HTMLInputElement | HTMLTextAreaElement): { value: string } {
  const bound = { value: "" };
  input.addEventListener("input", () => {
    bound.value = input.value;
  });
  return bound;
}

function edit(input: HTMLInputElement | HTMLTextAreaElement, value: string, caret: number) {
  input.value = value;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event("input"));
}

describe("persianInput action", () => {
  it("normalizes a typed value and syncs bind:value", () => {
    const input = document.createElement("input");
    const bound = bindValueLike(input);
    const action = persianInput(input, true);

    edit(input, "مي شود", 6);
    expect(input.value).toBe("می\u200cشود");
    expect(bound.value).toBe("می\u200cشود");
    action.destroy?.();
  });

  it("preserves the caret when typing in the middle", () => {
    const input = document.createElement("input");
    const action = persianInput(input, true);

    edit(input, "کتاب ها", 5);
    expect(input.value).toBe("کتاب\u200cها");
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
    action.destroy?.();
  });

  it("preserves the caret past a ZWNJ+space fold", () => {
    const input = document.createElement("input");
    const action = persianInput(input, true);

    edit(input, "می\u200c شود", 4);
    expect(input.value).toBe("می\u200cشود");
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
    action.destroy?.();
  });

  it("works on textareas and converts digits", () => {
    const textarea = document.createElement("textarea");
    const bound = bindValueLike(textarea);
    const action = persianInput(textarea, { digits: "persian" });

    edit(textarea, "Sum 12", 6);
    expect(textarea.value).toBe("Sum ۱۲");
    expect(bound.value).toBe("Sum ۱۲");
    action.destroy?.();
  });

  it("dispatches only one follow-up input event when something changed", () => {
    const input = document.createElement("input");
    let inputEvents = 0;
    input.addEventListener("input", () => inputEvents++);
    const action = persianInput(input, true);

    edit(input, "ك", 1);
    expect(input.value).toBe("ک");
    // The native event + exactly one follow-up for the binding sync.
    expect(inputEvents).toBe(2);

    // A no-op change fires the native event but no follow-up.
    edit(input, "ک", 1);
    expect(inputEvents).toBe(3);
    action.destroy?.();
  });

  it("does not fire when the transform is a no-op", () => {
    const input = document.createElement("input");
    let inputEvents = 0;
    input.addEventListener("input", () => inputEvents++);
    const action = persianInput(input, false);

    edit(input, "مي شود", 6);
    expect(input.value).toBe("مي شود");
    expect(inputEvents).toBe(1);
    action.destroy?.();
  });

  it("re-binds the transform on update()", () => {
    const input = document.createElement("input");
    const action = persianInput(input, false);

    edit(input, "۱۲۳", 3);
    expect(input.value).toBe("۱۲۳");

    action.update?.({ digits: "english" });
    edit(input, "۴۵۶", 3);
    expect(input.value).toBe("456");
    action.destroy?.();
  });

  it("ignores non-editable elements", () => {
    const span = document.createElement("span");
    span.textContent = "hello";
    const action = persianInput(span, true);
    expect(span.textContent).toBe("hello");
    action.destroy?.();
  });
});

describe("isTextEditableElement", () => {
  it("recognizes input and textarea only", () => {
    expect(isTextEditableElement(document.createElement("input"))).toBe(true);
    expect(isTextEditableElement(document.createElement("textarea"))).toBe(true);
    expect(isTextEditableElement(document.createElement("select"))).toBe(false);
    expect(isTextEditableElement(document.createElement("span"))).toBe(false);
    expect(isTextEditableElement({ value: "plain object" })).toBe(false);
    expect(isTextEditableElement(null)).toBe(false);
  });
});