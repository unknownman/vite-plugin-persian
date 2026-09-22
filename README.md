# vite-plugin-persian

A lightweight and predictable Vite plugin for Persian (Farsi) projects – Jalali date, Persian digits, and RTL-ready HTML setup.

## Installation

```bash
npm install vite-plugin-persian
```

```bash
pnpm add vite-plugin-persian
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [persian()],
});
```

## TypeScript

Add this reference to your project's `env.d.ts` (or `vite-env.d.ts`) to get full type safety on the virtual modules:

```ts
/// <reference types="vite-plugin-persian/virtual" />
```

Then import directly:

```ts
import { formatJalali, toJalali, toGregorian } from "virtual:persian/jalali";
import { toPersianDigits, normalizePersianText } from "virtual:persian/text";
```

- `virtual:persian` re-exports everything from the two modules above, so you can import from a single specifier.
- The types are re-exported from `vite-plugin-persian`, so they stay in sync with the runtime implementation.

## Features

- Jalali (Persian/Solar Hijri) date utilities
- Persian digit conversion
- RTL-ready HTML setup

## License

MIT
