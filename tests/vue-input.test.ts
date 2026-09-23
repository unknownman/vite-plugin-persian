// @vitest-environment jsdom
import { createApp, h, nextTick, ref, withDirectives } from "vue";
import type { App } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import { vPersianInput } from "../src/vue/index.js";
import type { PersianInputOptions } from "../src/types.js";

interface Mounted {
  app: App;
  container: HTMLDivElement;
  input: HTMLInputElement;
  model: { value: string };
}

/** Mounts an `<input v-model="model" v-persian-input="...">`. The directive
 * attaches its input listener in `created`, so it runs before Vue's own
 * `onInput` (registered during prop patching) — emulating real `v-model`
 * ordering. */
async function mount(options?: PersianInputOptions | boolean): Promise<Mounted> {
  const model = ref("");
  const container = document.createElement("div");
  document.body.appendChild(container);
  const app = createApp({
    setup() {
      return () =>
        withDirectives(
          h("input", {
            value: model.value,
            onInput: (event: Event) => {
              model.value = (event.target as HTMLInputElement).value;
            },
          }),
          [[vPersianInput, options ?? true]],
        );
    },
  });
  app.mount(container);
  // Let Vue settle so the directive's input listener is guaranteed to be attached.
  await nextTick();
  const input = container.querySelector("input") as HTMLInputElement;
  return { app, container, input, model };
}

function edit(input: HTMLInputElement, value: string, caret: number) {
  input.value = value;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event("input"));
}

afterEach(() => {
  // Clean up leftover DOM roots between tests.
  for (const div of Array.from(document.querySelectorAll("div"))) {
    div.remove();
  }
});

describe("vPersianInput directive", () => {
  it("normalizes the live value and feeds the cleaned value to v-model", async () => {
    const { app, input, model } = await mount();
    edit(input, "مي شود", 6);
    await nextTick();
    expect(input.value).toBe("می\u200cشود");
    expect(model.value).toBe("می\u200cشود");
    app.unmount();
  });

  it("converts digits before v-model reads the value", async () => {
    const { app, input, model } = await mount();
    edit(input, "Total 2500", 10);
    await nextTick();
    expect(input.value).toBe("Total ۲۵۰۰");
    expect(model.value).toBe("Total ۲۵۰۰");
    app.unmount();
  });

  it("preserves the caret when editing in the middle", async () => {
    const { app, input } = await mount();
    edit(input, "کتاب ها", 5);
    await nextTick();
    expect(input.value).toBe("کتاب\u200cها");
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
    app.unmount();
  });

  it("preserves the caret past a ZWNJ+space fold", async () => {
    const { app, input } = await mount();
    edit(input, "می\u200c شود", 4);
    await nextTick();
    expect(input.value).toBe("می\u200cشود");
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
    app.unmount();
  });

  it("applies option flags (English digits, no half-spaces)", async () => {
    const { app, input, model } = await mount({
      halfSpaces: false,
      digits: "english",
    });
    edit(input, "می شود ۱۲", 8);
    await nextTick();
    expect(input.value).toBe("می شود 12");
    expect(model.value).toBe("می شود 12");
    app.unmount();
  });

  it("acts as a no-op when bound to false", async () => {
    const { app, input, model } = await mount(false);
    edit(input, "مي شود", 6);
    await nextTick();
    expect(input.value).toBe("مي شود");
    expect(model.value).toBe("مي شود");
    app.unmount();
  });

  it("updates its transform when the binding changes", async () => {
    const model = ref("");
    const options = ref<PersianInputOptions | boolean>(true);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const app = createApp({
      setup() {
        return () =>
          withDirectives(
            h("input", {
              value: model.value,
              onInput: (event: Event) => {
                model.value = (event.target as HTMLInputElement).value;
              },
            }),
            [[vPersianInput, options.value]],
          );
      },
    });
    app.mount(container);
    await nextTick();
    const input = container.querySelector("input") as HTMLInputElement;

    options.value = { digits: "english" };
    await nextTick();
    edit(input, "۱۲۳", 3);
    await nextTick();
    expect(input.value).toBe("123");
    expect(model.value).toBe("123");

    options.value = false;
    await nextTick();
    edit(input, "مي", 2);
    await nextTick();
    expect(input.value).toBe("مي");
    expect(model.value).toBe("مي");

    app.unmount();
    container.remove();
  });

  it("does not transform textarea values after unmount", async () => {
    const model = ref("");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const app = createApp({
      setup() {
        return () =>
          withDirectives(
            h("textarea", {
              value: model.value,
              onInput: (event: Event) => {
                model.value = (event.target as HTMLTextAreaElement).value;
              },
            }),
            [[vPersianInput, true]],
          );
      },
    });
    app.mount(container);
    await nextTick();
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    app.unmount();
    textarea.value = "ك";
    textarea.dispatchEvent(new Event("input"));
    await nextTick();
    // The directive's listener was removed on unmount — no transform runs,
    // so the raw value survives untouched.
    expect(textarea.value).toBe("ك");
    container.remove();
  });
});