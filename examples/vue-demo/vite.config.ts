import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [vue(), persian()],
});