import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/methods.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "node18",
  // The virtual modules import `vite-plugin-persian/methods`, which must be
  // self-contained so the package works from any environment (Node ESM, Node
  // CJS, and browser bundlers) without depending on CJS interop of deps.
  noExternal: ["jalaali-js"],
});
