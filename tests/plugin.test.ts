import { describe, expect, it } from "vitest";
import { persian } from "../src/index.js";

describe("persian", () => {
  it("returns a Vite plugin with the expected name", () => {
    const plugin = persian();
    expect(plugin.name).toBe("vite-plugin-persian");
  });
});
