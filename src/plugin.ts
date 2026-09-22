import type { Plugin } from "vite";
import type { PersianOptions } from "./types.js";

export function persian(_options: PersianOptions = {}): Plugin {
  return {
    name: "vite-plugin-persian",
  };
}
