/// <reference types="vite/client" />
/// <reference types="vite-plugin-persian/virtual" />

declare module "*.svelte" {
  import type { ComponentType } from "svelte";
  const component: ComponentType;
  export default component;
}