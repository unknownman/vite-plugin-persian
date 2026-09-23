// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { usePersianSlug } from "../src/react/index.js";
import type { SlugOptions } from "../src/types.js";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function SlugView({ title, options }: { title: string; options?: SlugOptions }) {
  const slug = usePersianSlug(title, options);
  return createElement("span", null, slug);
}

function mount(title: string, options?: SlugOptions): HTMLSpanElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(createElement(SlugView, options ? { title, options } : { title }));
  });
  return container.querySelector("span") as HTMLSpanElement;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("usePersianSlug", () => {
  it("renders the slug for a Persian title", () => {
    const view = mount("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
    expect(view.textContent).toBe("آموزش-جامع-vite-نسخه-جدید-بخش-۱");
  });

  it("reacts to title changes", () => {
    mount("سلام دنیا");
    act(() => {
      root!.render(createElement(SlugView, { title: "دنیای  جدید" }));
    });
    const view = container!.querySelector("span");
    expect(view?.textContent).toBe("دنیای-جدید");
  });

  it("respects a custom separator and lowercase toggle", () => {
    const view = mount("React 19 دوره", {
      separator: "_",
      lowercase: false,
    });
    expect(view.textContent).toBe("React_19_دوره");
  });

  it("treats an empty title as an empty slug", () => {
    const view = mount("");
    expect(view.textContent).toBe("");
  });
});