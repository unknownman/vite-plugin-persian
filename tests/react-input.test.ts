// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import type { ChangeEvent, RefObject } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { usePersianInput } from "../src/react/index.js";
import type { PersianInputOptions } from "../src/types.js";

// React 19 requires this flag for `act(...)` to flush updates.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

/** Captures the latest `usePersianInput` bindings inside the mounted tree. */
let lastBind:
  | {
      ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
      value: string;
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    }
  | null = null;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function Field({ options }: { options?: PersianInputOptions }) {
  const bind = usePersianInput(options);
  lastBind = bind;
  return createElement("input", { ...bind });
}

function mount(options?: PersianInputOptions): HTMLInputElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(createElement(Field, options ? { options } : null));
  });
  return container.querySelector("input") as HTMLInputElement;
}

/** Sets `.value` through the prototype setter, bypassing React's per-instance
 * value tracker — otherwise React treats the assignment as "already seen"
 * and never dispatches `onChange` (same trick as testing-library's
 * `fireEvent.change`). */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
}

/** Simulates a user edit: replaces the value, places the caret, fires input. */
function edit(input: HTMLInputElement, value: string, caret: number) {
  editRange(input, value, caret, caret);
}

/** Simulates a user edit with an explicit selection range. */
function editRange(input: HTMLInputElement, value: string, start: number, end: number) {
  act(() => {
    setNativeValue(input, value);
    input.setSelectionRange(start, end);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  lastBind = null;
});

describe("usePersianInput", () => {
  it("normalizes a typed Arabic-yeh value", () => {
    const input = mount();
    edit(input, "يك كتاب", 8);
    expect(input.value).toBe("یک کتاب");
  });

  it("converts Persian digits as the user types", () => {
    const input = mount();
    edit(input, "0912", 4);
    expect(input.value).toBe("۰۹۱۲");
  });

  it("joins half-spaces typed with a plain space", () => {
    const input = mount();
    edit(input, "می شود", 6);
    expect(input.value).toBe("می\u200cشود");
  });

  it("preserves the caret when typing in the middle of the field", () => {
    const input = mount();
    edit(input, "کتاب ها", 5);
    expect(input.value).toBe("کتاب\u200cها");
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
  });

  it("preserves the caret past a ZWNJ+space fold (deletion)", () => {
    const input = mount();
    edit(input, "می\u200c شود", 4); // caret right before شود
    expect(input.value).toBe("می\u200cشود");
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
  });

  it("normalizes a pasted dirty region and keeps the selection on it", () => {
    const input = mount();
    // Space→ZWNJ is a length-preserving 1:1 replacement, so the selected
    // region keeps its exact boundaries on the transformed value.
    editRange(input, "می شودy", 0, 6);
    expect(input.value).toBe("می\u200cشودy");
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(6);
  });

  it("keeps digits Latin when requested", () => {
    const input = mount({ digits: "english" });
    edit(input, "۱۲۳", 3);
    expect(input.value).toBe("123");
  });

  it("disables normalization entirely when false", () => {
    const input = mount({ sanitize: false, halfSpaces: false, digits: "none" });
    edit(input, "مي شود 12", 8);
    expect(input.value).toBe("مي شود 12");
  });

  it("honors a custom transform", () => {
    const input = mount({ transform: (text) => text.replace(/!/g, "؟") });
    edit(input, "سلام!", 6);
    expect(input.value).toBe("سلام؟");
  });

  it("renders the initialValue through the pipeline", () => {
    const input = mount({ initialValue: "يك 12" });
    expect(input.value).toBe("یک ۱۲");
    expect(lastBind?.value).toBe("یک ۱۲");
  });

  it("does not overwrite the value when the transform is a no-op", () => {
    const input = mount({ initialValue: "سلام" });
    edit(input, "سلام", 4); // caret at the end of a 4-char value
    expect(input.value).toBe("سلام");
    expect(input.selectionStart).toBe(4);
  });
});