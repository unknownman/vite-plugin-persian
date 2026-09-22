# vite-plugin-persian

A lightweight and predictable Vite plugin for Persian (Farsi) projects – Jalali date, Persian digits, and RTL-ready HTML setup.

## Installation

Requires Node.js ≥ 18 and Vite 5, 6, 7, or 8.

```bash
npm install vite-plugin-persian
```

```bash
pnpm add vite-plugin-persian
```

```bash
yarn add vite-plugin-persian
```

```bash
bun add vite-plugin-persian
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

## Framework helpers

The core plugin is framework-agnostic. Optional subpath entries are provided
for React and Vue; `react` (≥ 18) and `vue` (≥ 3) are optional peer
dependencies and are only needed if you import these subpaths.

### React

```ts
import { usePersianDigits, useEnglishDigits } from "vite-plugin-persian/react";
```

```tsx
function PriceTag({ value }: { value: number }) {
  const price = usePersianDigits(value); // "۱۲۵۰۰"
  return <span>{price}</span>;
}
```

The React entry also re-exports `toPersianDigits`, `toEnglishDigits`, and `normalizePersianText`.

### Vue

```ts
import { vPersianDigits, usePersianDigits } from "vite-plugin-persian/vue";
```

Register the directive globally in your app entry, or per component:

```ts
// main.ts
import { vPersianDigits } from "vite-plugin-persian/vue";
app.use((app) => app.directive("persian-digits", vPersianDigits));
```

```html
<span v-persian-digits="price">{{ price }}</span>
```

Or use the composable in `<script setup>`:

```ts
const { toPersianDigits, normalizePersianText } = usePersianDigits();
const price = toPersianDigits(12500);
```

The Vue entry also re-exports `toPersianDigits`, `toEnglishDigits`, and `normalizePersianText`.

## Features

- Jalali (Persian/Solar Hijri) date utilities
- Persian digit conversion
- RTL-ready HTML setup

## License

MIT
