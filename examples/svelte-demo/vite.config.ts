import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [svelte(), persian()],
});