import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import { usePersianSlug } from "../src/vue/index.js";

describe("usePersianSlug (Vue composable)", () => {
  it("generates a slug from a plain value", () => {
    const slug = usePersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
    expect(slug.value).toBe("آموزش-جامع-vite-نسخه-جدید-بخش-۱");
  });

  it("reacts to ref changes and stays in sync", () => {
    const title = ref("سلام دنیا");
    const slug = usePersianSlug(title);
    expect(slug.value).toBe("سلام-دنیا");

    title.value = "دنیای    جدید";
    expect(slug.value).toBe("دنیای-جدید");
  });

  it("accepts a getter and nullish input", () => {
    const title = ref<string | null>(null);
    const slug = usePersianSlug(() => title.value ?? "");
    expect(slug.value).toBe("");

    title.value = "React 19 از Vue 3 بهتر است";
    expect(slug.value).toBe("react-19-از-vue-3-بهتر-است");
  });

  it("honors options and composes with other computeds", () => {
    const title = ref("Quick   Brown   FOX");
    const slug = usePersianSlug(title, { lowercase: false, separator: "_" });
    const prefixed = computed(() => `/blog/${slug.value}`);
    expect(slug.value).toBe("Quick_Brown_FOX");
    expect(prefixed.value).toBe("/blog/Quick_Brown_FOX");
  });
});