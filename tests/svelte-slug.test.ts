import { describe, expect, it } from "vitest";
import { get, writable } from "svelte/store";
import { usePersianSlug } from "../src/svelte/index.js";

describe("usePersianSlug (Svelte store)", () => {
  it("generates a slug from a plain value", () => {
    const slug = usePersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
    expect(get(slug)).toBe("آموزش-جامع-vite-نسخه-جدید-بخش-۱");
  });

  it("reacts to a writable store and stays in sync", () => {
    const title = writable("سلام دنیا");
    const slug = usePersianSlug(title);
    expect(get(slug)).toBe("سلام-دنیا");

    title.set("دنیای    جدید");
    expect(get(slug)).toBe("دنیای-جدید");
  });

  it("accepts a store of nullish values", () => {
    const title = writable<string | null>(null);
    const slug = usePersianSlug(title);
    expect(get(slug)).toBe("");

    title.set("React 19 دوره");
    expect(get(slug)).toBe("react-19-دوره");
  });

  it("honors options", () => {
    const slug = usePersianSlug("Quick   Brown   FOX", { lowercase: false, separator: "_" });
    expect(get(slug)).toBe("Quick_Brown_FOX");
  });
});