# vite-plugin-persian

A lightweight, framework-agnostic Vite plugin for Persian (Farsi) projects. It sets up your HTML for RTL, gives you typed Jalali (Solar Hijri) date utilities, Persian digit helpers, currency (Toman/Rial) formatting, Iranian National Code & mobile validation, and number-to-Persian-words conversion — served through tree-shakeable virtual modules with optional React, Vue, and Svelte bindings.

> Vite 5 • 6 • 7 • 8 — Node ≥ 18 — ESM & CJS

[English](#vite-plugin-persian) · [فارسی](README.fa.md)

## Features

- **RTL-ready HTML** — automatically sets `lang="fa"` and `dir="rtl"` on your `<html>` tag (both overridable).
- **Jalali (Persian / Solar Hijri) dates** — `formatJalali`, `toJalali`, `toGregorian`, `isLeapJalaliYear`, `getMonthName` with Persian or English month names. Framework-native helpers: `useJalaliDate` for React, Vue, and Svelte.
- **Persian digits** — convert to/from Persian numerals (`۰۱۲۳۴۵۶۷۸۹`) and normalize Persian text.
- **Currency utilities** — `toToman`, `toRial`, and `formatCurrency` with Persian/English digits and thousands separators.
- **Iranian National Code & mobile validation** — `isNationalCode` (official 10-digit checksum), `isMobileNumber`/`normalizeMobileNumber` (`09xxxxxxxxx`).
- **Number-to-Persian-words** — `toNumberWords` spells out big numbers exactly (BigInt-safe, up to 10²⁴), including decimals: `12500 → «دوازده هزار و پانصد»`.
- **Framework-native hooks** — `useJalaliDate`, `useNationalCode`, `useMobileNumber`, `useNumberWords`, `usePersianDigits` for React, Vue, and Svelte.
- **Tree-shakeable** — only the engine you pick (`jalaali-js` by default, or `intl`) is bundled; the other is dropped.
- **Zero runtime dependencies** — `jalaali-js` is compiled directly into the package.
- **TypeScript-first** — virtual modules ship with types; every framework entry is fully typed.
- **Optional framework helpers** — no framework code in the core; import `vite-plugin-persian/react`, `/vue`, or `/svelte` only when you need it.

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

`react` (≥ 18), `vue` (≥ 3), and `svelte` (≥ 4) are optional peer dependencies — install them only if you use the corresponding helpers.

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

## Examples

Turn-key demo applications live in [`examples/`](./examples): `react-demo`, `vue-demo`, and `svelte-demo`. Each is a real Vite project that consumes the plugin through `file:../..`, and demonstrates the currency widgets, live field validators, the Jalali clock, digit conversion, and the framework-specific directives/actions:

```bash
cd examples/react-demo    # or vue-demo / svelte-demo
npm install
npm run build             # typecheck + production build
npm run dev               # launch the dev server
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

`formatJalali` supports the tokens `YYYY`, `YY`, `MMMM`, `MMM`, `MM`, `DD`, `d` and renders Persian month names. Dates are converted using local time components.

### `virtual:persian/text` — digits, currency, validation & words

#### Persian digits & normalization

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

#### Iranian National Code & mobile validation

```ts
import { isNationalCode, isMobileNumber, normalizeMobileNumber } from "virtual:persian/text";

isNationalCode("0010042911");            // true  (official 10-digit checksum)
isNationalCode("1234567890");            // false
isMobileNumber("09123456789");           // true
isMobileNumber("+98 912 345 6789");      // true
normalizeMobileNumber("+989123456789");  // "09123456789"
normalizeMobileNumber("۱۲۳");            // ""   (invalid → empty string)
```

Validation strips whitespace and non-digits and normalizes Persian/Arabic-Indic digits first, so dirty input is handled safely.

#### Number-to-Persian-words

```ts
import { toNumberWords } from "virtual:persian/text";

toNumberWords(12500);            // "دوازده هزار و پانصد"
toNumberWords(0);                // "صفر"
toNumberWords(-3.5);             // "منفی سه ممیز پنج"
toNumberWords("1203450000");     // "یک میلیارد و دویست و سه میلیون و چهارصد و پنجاه هزار"
```

Exact for arbitrarily large numbers (BigInt-based, up to 10²⁴ «سپتیلیون»), including negative values and decimals. Invalid input yields `""`.

### `virtual:persian` — everything at once

```ts
import { formatJalali, toPersianDigits } from "virtual:persian";
```

## Standalone helpers (`vite-plugin-persian/methods`)

Every utility is also exported from the plain `vite-plugin-persian/methods` subpath — handy for scripts, Node.js, or SSR servers that run outside Vite:

```ts
import { toNumberWords, isNationalCode } from "vite-plugin-persian/methods";
import { formatJalali } from "vite-plugin-persian/methods";
```

It re-exports the same functions the virtual modules wrap (`formatJalali`, `toJalali`, `toGregorian`, `isLeapJalaliYear`, `getMonthName`, digit/currency/validation/words helpers) plus the `CalendarEngine`/`JalaliEngine` types.

## React helpers

```bash
npm install react react-dom          # required peer dependencies
```

Hooks are memoized against their inputs, so re-renders with the same value return a stable result.

```tsx
import {
  usePersianDigits,
  useEnglishDigits,
  useJalaliDate,
  useNationalCode,
  useMobileNumber,
  useNumberWords,
} from "vite-plugin-persian/react";
```

```tsx
function PriceTag({ value }: { value: number }) {
  const price = usePersianDigits(value);          // "۱۲۵۰۰"
  const words = useNumberWords(value);            // "دوازده هزار و پانصد"
  return (
    <span>
      {words} ({price})
    </span>
  );
}

function BirthdateCard() {
  const jalali = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY"); // "۱ فروردین ۱۴۰۳"
  return <time>{jalali}</time>;
}

function PersonForm() {
  const [code] = useState("0010042911");
  const [phone] = useState("09123456789");
  const codeValid = useNationalCode(code);        // boolean
  const phoneValid = useMobileNumber(phone);      // boolean
  return (
    <>
      <span className={codeValid ? "ok" : "bad"}>
        {codeValid ? "کد ملی معتبر" : "کد ملی نامعتبر"}
      </span>
      <span className={phoneValid ? "ok" : "bad"}>
        {phoneValid ? "موبایل معتبر" : "موبایل نامعتبر"}
      </span>
    </>
  );
}
```

`vite-plugin-persian/react` also re-exports the plain helpers: `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, `toToman`, `toRial`, `formatCurrency`, `isNationalCode`, `isMobileNumber`, `normalizeMobileNumber`, `toNumberWords`.

## Vue helpers

```bash
npm install vue                # required peer dependency
```

Register the directive globally in your app entry (or per-component via `directives: { persianDigits: vPersianDigits }`):

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

<script setup lang="ts">
import { ref } from "vue";
import {
  useJalaliDate,
  useNationalCode,
  useMobileNumber,
  useNumberWords,
} from "vite-plugin-persian/vue";

const price = ref(12500);
const jalali = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY"); // ComputedRef<string>
const codeValid = useNationalCode("0010042911");                    // ComputedRef<boolean>
const phoneValid = useMobileNumber("09123456789");                  // ComputedRef<boolean>
const words = useNumberWords(price);                                // ComputedRef<string>
</script>
```

Composables accept a plain value, a `Ref`, or a getter function (`MaybeRefOrGetter`) and return reactive `ComputedRef`s — they stay in sync when a `ref` changes. `usePersianDigits()` returns `{ toPersianDigits, toEnglishDigits, normalizePersianText }` as plain functions.

`vite-plugin-persian/vue` also re-exports the plain helpers: `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, `toToman`, `toRial`, `formatCurrency`, `isNationalCode`, `isMobileNumber`, `normalizeMobileNumber`, `toNumberWords`.

## Svelte helpers

```bash
npm install svelte              # required peer dependency
```

Works with both Svelte 4 (stores) and Svelte 5 (runes). Everything is plain TypeScript — no extra plugins or `.svelte` wrapping:

```svelte
<script lang="ts">
  import { writable } from "svelte/store";
  import {
    usePersianDigits,
    useJalaliDate,
    useNationalCode,
    useMobileNumber,
    useNumberWords,
    persianDigits,
  } from "vite-plugin-persian/svelte";

  export let price: number; // number

  const priceFa = usePersianDigits(price);                       // Readable
  const jalaali = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY"); // Readable

  const code = writable("0010042911");
  const phone = writable("09123456789");
  const codeValid = useNationalCode(code);   // Readable<boolean>
  const phoneValid = useMobileNumber(phone); // Readable<boolean>
  const words = useNumberWords(writable(12500)); // Readable<string>
</script>

<!-- actions: convert bound values, re-running on updates -->
<span use:persianDigits={price}>{price}</span>
<input use:persianDigits bind:value />

<!-- hook output is reactive via the $ store syntax -->
<span>{$priceFa}</span>
<span>{$jalaali}</span>
<span>{$words}</span>
```

`usePersianDigits`, `useEnglishDigits`, `useJalaliDate`, `useNationalCode`, `useMobileNumber`, and `useNumberWords` accept a plain value or any `Readable` from `svelte/store`, and return `Readable`s that react to changes. `persianDigits` is a standard Svelte action with `update`/`destroy` lifecycle.

`vite-plugin-persian/svelte` also re-exports the plain helpers: `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, `toToman`, `toRial`, `formatCurrency`, `isNationalCode`, `isMobileNumber`, `normalizeMobileNumber`, `toNumberWords`.

## TypeScript

The plugin, its options, and the React/Vue/Svelte helpers are typed out of the box. For the **virtual modules**, add one reference in your `src/vite-env.d.ts`:

```ts
/// <reference types="vite-plugin-persian/virtual" />
```

You can also import the public types from `vite-plugin-persian`:

```ts
import type { PersianOptions, JalaliEngine, CalendarEngine } from "vite-plugin-persian";
```

## Options

| Option            | Type                    | Default       | Description                                            |
| ----------------- | ----------------------- | ------------- | ------------------------------------------------------ |
| `html.lang`       | `string`                | `"fa"`        | Value of the `lang` attribute on `<html>`.             |
| `html.dir`        | `"rtl" \| "ltr"`        | `"rtl"`       | Value of the `dir` attribute on `<html>`.              |
| `jalali.enabled`  | `boolean`               | `true`        | Serve `virtual:persian/jalali`. Disabling + importing throws at build time. |
| `jalali.engine`   | `"jalaali-js" \| "intl"`| `"jalaali-js"`| Calendar engine. `intl` uses native `Intl.DateTimeFormat` (smaller, environment-dependent); `jalaali-js` is consistent everywhere. |
| `text.enabled`    | `boolean`               | `true`        | Serve `virtual:persian/text`.                          |

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
- **Not an i18n/styling library.** It sets `dir="rtl"`, but does not flip your CSS or localize UI strings.
- **Requires Vite 5–8.** It is a build-time plugin; content you hand-render on a server outside Vite is unaffected.

## License

MIT © [unknownman](https://github.com/unknownman)