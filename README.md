# vite-plugin-persian

A lightweight, framework-agnostic Vite plugin for Persian (Farsi) projects. It sets up your HTML for RTL, and gives you typed Jalali date utilities and Persian digit helpers through clean virtual modules — plus optional React and Vue bindings.

> Vite 5 • 6 • 7 • 8 — Node ≥ 18 — ESM & CJS

## Features

- **RTL-ready HTML** — automatically sets `lang="fa"` and `dir="rtl"` on your `<html>` tag (both overridable).
- **Jalali (Persian / Solar Hijri) dates** — `formatJalali`, `toJalali`, `toGregorian`, `isLeapJalaliYear`, `getMonthName` with Persian or English month names.
- **Persian digits** — convert to/from Persian numerals (`۰۱۲۳۴۵۶۷۸۹`) and normalize Persian text.
- **Toman / Rial currency helpers** — `toToman`, `toRial`, and `formatCurrency` with Persian/English digits and thousands separators.
- **Tree-shakeable** — only the engine you pick (`jalaali-js` by default, or `intl`) is bundled; the other is dropped.
- **Zero runtime dependencies** — `jalaali-js` is compiled directly into the package.
- **TypeScript-first** — virtual modules ship with types, `react`/`vue` helpers are fully typed.
- **Optional React, Vue & Svelte helpers** — no framework code in the core; import `vite-plugin-persian/react`, `/vue`, or `/svelte` only when you need it.

## Installation

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

`react` (≥ 18), `vue` (≥ 3), and `svelte` (≥ 4) are optional peer dependencies — only install them if you use the corresponding helpers.

## Quick Start

Add the plugin to your Vite config. Everything else is optional:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [persian()],
});
```

That's it. Your build now outputs:

```html
<html lang="fa" dir="rtl"> ... </html>
```

## RTL & language tag

By default the plugin sets `lang="fa"` and `dir="rtl"` on the `<html>` element when your app is served or built. Override either one:

```ts
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [
    persian({
      html: { lang: "fa-IR", dir: "rtl" },
    }),
  ],
});
```

## Virtual modules

The plugin exposes three virtual modules. Add this line to `src/vite-env.d.ts` **once** to get full type safety (see [TypeScript](#typescript)):

```ts
/// <reference types="vite-plugin-persian/virtual" />
```

### `virtual:persian/jalali` — Jalali dates

```ts
import {
  formatJalali,
  toJalali,
  toGregorian,
  isLeapJalaliYear,
  getMonthName,
} from "virtual:persian/jalali";

formatJalali("2024-01-01", "YYYY/MM/DD");      // "1402/10/11"
formatJalali("2024-01-01", "d MMMM YYYY");     // "11 دی 1402"
toJalali("2024-01-01");                        // { year: 1402, month: 10, day: 11 }
toGregorian(1402, 10, 11);                     // Date (Monday, Jan 1 2024)
isLeapJalaliYear(1403);                        // true
getMonthName(10, "fa");                        // "دی"
getMonthName(10, "en");                        // "Dey"
```

`formatJalali` supports the tokens `YYYY`, `YY`, `MMMM`, `MMM`, `MM`, `DD`, `d`. Dates are converted using local time components.

### `virtual:persian/text` — Persian digits & normalization

```ts
import { toPersianDigits, toEnglishDigits, normalizePersianText } from "virtual:persian/text";

toPersianDigits(12500);             // "۱۲۵۰۰"
toPersianDigits("1,250,000");       // "۱,۲۵۰,۰۰۰"
toEnglishDigits("۱۲۵۰۰");           // "12500"
normalizePersianText("يك   تست");   // "یک تست"
```

#### Currency utilities (Toman / Rial)

```ts
import { toToman, toRial, formatCurrency } from "virtual:persian/text";

toToman(10000);        // 1000   (Rial → Toman, ÷ 10)
toRial(1000);          // 10000  (Toman → Rial, × 10)

formatCurrency(12500000);                          // "۱۲٬۵۰۰٬۰۰۰ تومان"
formatCurrency(12500000, { digits: "english" });   // "12,500,000 تومان"
formatCurrency(2500000, { unit: "ریال" });         // "۲٬۵۰۰٬۰۰۰ ریال"
formatCurrency(12500, { separator: false });       // "۱۲۵۰۰ تومان"
```

`toToman`/`toRial` accept English or Persian/Arabic digits (with or without separators) and return `NaN` for invalid input. `formatCurrency` accepts `unit: "تومان" | "ریال"`, `digits: "persian" | "english"`, and `separator: boolean` and returns `""` for invalid input.

### `virtual:persian` — everything at once

```ts
import { formatJalali, toPersianDigits } from "virtual:persian";
```

## React helpers

```bash
npm install react react-dom          # required peer dependencies
```

```ts
import { usePersianDigits, useEnglishDigits } from "vite-plugin-persian/react";
```

```tsx
function PriceTag({ value }: { value: number }) {
  const price = usePersianDigits(value); // "۱۲۵۰۰"
  return <span>{price}</span>;
}

function EditableInput() {
  const [raw, setRaw] = useState("");
  const numeric = useEnglishDigits(raw); // read "۴۲" back as "42"
  return <input value={raw} onChange={(e) => setRaw(e.target.value)} />;
}
```

The hook results are memoized against the input, so re-renders with the same value return a stable string. `vite-plugin-persian/react` also re-exports `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, and the currency utilities (`toToman`, `toRial`, `formatCurrency`).

## Vue helpers

```bash
npm install vue                      # required peer dependency
```

```ts
import { vPersianDigits, usePersianDigits } from "vite-plugin-persian/vue";
```

Register the directive globally in your app entry (or per component via `directives: { persianDigits: vPersianDigits }`):

```ts
// main.ts
import { createApp } from "vue";
import { vPersianDigits } from "vite-plugin-persian/vue";
import App from "./App.vue";

createApp(App).directive("persian-digits", vPersianDigits).mount("#app");
```

```vue
<template>
  <!-- converts the bound value, and re-converts on updates -->
  <span v-persian-digits="price">{{ price }}</span>

  <!-- converts the element's own text once -->
  <span v-persian-digits>12.500</span>

  <!-- form controls get their .value converted -->
  <input v-persian-digits="model" />
</template>

<script setup>
import { usePersianDigits } from "vite-plugin-persian/vue";

const { toPersianDigits, toEnglishDigits, normalizePersianText } = usePersianDigits();
const price = toPersianDigits(12500); // "۱۲۵۰۰"
</script>
```

Conversion is idempotent, so the directive is safe to run on every patch. `vite-plugin-persian/vue` also re-exports `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, and the currency utilities (`toToman`, `toRial`, `formatCurrency`).

## Svelte helpers

```bash
npm install svelte                   # required peer dependency
```

```ts
import { usePersianDigits, persianDigits } from "vite-plugin-persian/svelte";
```

```svelte
<script>
  export let price; // number

  const priceFa = usePersianDigits(price); // Readable, reactive via the `$` store syntax
</script>

<!-- action: converts the bound value, and re-converts on updates -->
<span use:persianDigits={price}>{price}</span>

<!-- action without a value: converts the element's own text once -->
<span use:persianDigits>12.500</span>

<!-- form controls get their .value converted -->
<input use:persianDigits bind:value />

<!-- runes- or store-based reactivity -->
<span>{$priceFa}</span>
```

`usePersianDigits` and `useEnglishDigits` accept a plain number/string or any `Readable` from `svelte/store` (so they react to changing values). `persianDigits` is a standard Svelte action with `update`/`destroy` lifecycle. `vite-plugin-persian/svelte` also re-exports `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, and the currency utilities (`toToman`, `toRial`, `formatCurrency`).

## TypeScript

The plugin, its options, and the React/Vue/Svelte helpers are typed out of the box. For the **virtual modules**, add one reference in your `src/vite-env.d.ts`:

```ts
/// <reference types="vite-plugin-persian/virtual" />
```

Then the imports above are fully typed. You can also import the public types from `vite-plugin-persian` for things like custom engine types:

```ts
import type { PersianOptions, JalaliEngine, CalendarEngine } from "vite-plugin-persian";
import type { JalaliEngine as Engine } from "vite-plugin-persian/methods";
```

## Options

| Option            | Type                    | Default      | Description                                            |
| ----------------- | ----------------------- | ------------ | ------------------------------------------------------ |
| `html.lang`       | `string`                | `"fa"`       | Value of the `lang` attribute on `<html>`.             |
| `html.dir`        | `"rtl" \| "ltr"`        | `"rtl"`      | Value of the `dir` attribute on `<html>`.              |
| `jalali.enabled`  | `boolean`               | `true`       | Serve `virtual:persian/jalali`. Disabling + importing throws at build time. |
| `jalali.engine`   | `"jalaali-js" \| "intl"` | `"jalaali-js"` | Calendar engine. `intl` uses native `Intl.DateTimeFormat` (smaller, environment-dependent); `jalaali-js` is consistent everywhere. |
| `text.enabled`    | `boolean`               | `true`       | Serve `virtual:persian/text`.                          |

```ts
persian({
  html: { lang: "fa-IR" },
  jalali: { engine: "intl" },
  text: { enabled: true },
});
```

## Notes & limitations

- **No magic transforms.** The plugin never rewrites your components or auto-converts code. Only the virtual-module imports and helpers convert digits — and the `<html lang/dir>` attributes are the only automatic output. This keeps behavior predictable and bundle-safe for tree-shaking.
- **Local time, not timezones.** Date conversion uses the local timezone of the running machine.
- **`intl` engine caveats.** It derives leap years and conversions from the host's `Intl`/ICU data, so results can vary slightly across environments and it is slower than `jalaali-js` (iterative search). Use it when you want a ~zero-footprint calendar. The default `jalaali-js` engine is deterministic.
- **Not an i18n/RTL styling library.** It sets `dir="rtl"`, but does not flip your CSS, localize UI strings, or format numbers with separators.
- **Requires Vite 5–8.** It is a build-time plugin; content you hand-render on a server outside Vite is unaffected.

## License

MIT © [unknownman](https://github.com/unknownman)