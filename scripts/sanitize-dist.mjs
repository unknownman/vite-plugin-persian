/**
 * Post-build cleanup for the tsup output.
 *
 * The esbuild/sourcemap footer is emitted twice (once by esbuild, once by tsup
 * itself), producing consecutive `//# sourceMappingURL=` lines in every output
 * file. Collapse consecutive duplicates down to a single directive and make
 * sure files end with a newline.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = join(import.meta.dirname, "..", "dist");
const SOURCEMAP_LINE = /^\/\/# sourceMappingURL=[^\r\n]+$/;

function collect(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collect(full));
    else if (entry.name.endsWith(".js") || entry.name.endsWith(".cjs")) files.push(full);
  }
  return files;
}

let cleaned = 0;
for (const file of collect(DIST)) {
  const original = readFileSync(file, "utf8");
  const lines = original.split("\n");
  let fixed = "";
  let seenSourceMap = false;
  for (const line of lines) {
    if (SOURCEMAP_LINE.test(line)) {
      if (seenSourceMap) continue;
      seenSourceMap = true;
    }
    fixed += `${line}\n`;
  }
  if (fixed !== original) {
    writeFileSync(file, fixed);
    cleaned += 1;
    console.log(`sanitized ${relative(process.cwd(), file)}`);
  }
}
console.log(
  cleaned === 0
    ? "dist: no duplicate source maps found"
    : `dist: cleaned ${cleaned} file(s)`,
);