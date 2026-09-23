import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [react(), persian()],
});