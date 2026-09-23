# vite-plugin-persian

A lightweight, framework-agnostic Vite plugin for Persian (Farsi) projects. It sets up your HTML for RTL, gives you typed Jalali (Solar Hijri) date utilities, Persian digit helpers, currency (Toman/Rial) formatting, Iranian National Code & mobile validation, number-to-Persian-words conversion, a caret-aware real-time form input formatter, and an SEO-friendly Persian slug generator — served through tree-shakeable virtual modules with optional React, Vue, and Svelte bindings.

> Vite 5 • 6 • 7 • 8 — Node ≥ 18 — ESM & CJS

[English](#vite-plugin-persian) · [فارسی](README.fa.md)

## Features

- **RTL-ready HTML** — automatically sets `lang="fa"` and `dir="rtl"` on your `<html>` tag (both overridable).
- **Persian webfont injection** (v0.3.0, opt-in) — one line serves a Persian font from jsDelivr CDN (`Vazirmatn`, `Sahel`, `Samim`) or from your own local `.woff2`/`.woff` files, plus an automatic `body { font-family }` application.
- **CSS logical properties** (v0.3.0, opt-in) — rewrite physical `padding-left`/`margin-right`/`text-align: left` into their logical (`start`/`end`) equivalents so RTL works without direction-specific CSS.
- **Jalali (Persian / Solar Hijri) dates** — `formatJalali`, `toJalali`, `toGregorian`, `isLeapJalaliYear`, `getMonthName` with Persian or English month names. Framework-native helpers: `useJalaliDate` for React, Vue, and Svelte.
- **Persian digits** — convert to/from Persian numerals (`۰۱۲۳۴۵۶۷۸۹`) and normalize Persian text.
- **Currency utilities** — `toToman`, `toRial`, and `formatCurrency` with Persian/English digits and thousands separators.
- **Iranian National Code & mobile validation** — `isNationalCode` (official 10-digit checksum), `isMobileNumber`/`normalizeMobileNumber` (`09xxxxxxxxx`).
- **Number-to-Persian-words** — `toNumberWords` spells out big numbers exactly (BigInt-safe, up to 10²⁴), including decimals: `12500 → «دوازده هزار و پانصد»`.
- **Form inputs formatter** (v0.4.0) — real-time Persian normalization for `<input>`/`<textarea>` (Arabic→Persian sanitizing, ZWNJ half-spaces, digits) with **built-in caret/cursor position retention**: `v-persian-input` (Vue), `usePersianInput` (React), `use:persianInput` (Svelte).
- **SEO Persian slug generator** (v0.4.0) — `toPersianSlug` turns mixed Persian/English titles into clean, URL-safe slugs (`«آموزش جامع Vite (نسخه جدید) - بخش ۱!»` → `آموزش-جامع-vite-نسخه-جدید-بخش-۱`), intelligently stripping invisible Arabic/Persian diacritics (harakat, tatweel, …). Reactive `usePersianSlug` hooks included.
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

## Persian webfont (v0.3.0, opt-in; `preload` in v0.3.1)

The `font` option injects an `@font-face` stylesheet straight into your HTML — no CSS to write, no font file to download by hand. It's disabled unless you configure it.

### CDN preset

Three popular Persian families are pre-registered and served from jsDelivr (a `preconnect` hint is added automatically):

```ts
// vite.config.ts
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [
    persian({
      font: {
        family: "Vazirmatn",          // "Vazirmatn" | "Sahel" | "Samim"
        display: "swap",              // font-display: auto | block | swap | fallback | optional
        injectToBody: true,           // default — applies the font to <body>
      },
    }),
  ],
});
```

With `injectToBody: true` (the default) the plugin also emits:

```css
:root {
  --persian-font-family: "Vazirmatn";
  --font-persian: "Vazirmatn", sans-serif; /* v0.3.1 */
}
body { font-family: var(--persian-font-family), sans-serif !important; }
```

So the whole app renders in the font immediately. Set `injectToBody: false` if you prefer to control `font-family` yourself — the `@font-face` rules are still injected, but the `:root`/`body` micro-injection is skipped entirely.

In addition to `--persian-font-family`, v0.3.1 defines **`--font-persian`** — the family plus its fallback stack — which follows Tailwind's `--font-*` theme naming convention. Map it into your Tailwind config and use the utility everywhere:

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        persian: "var(--font-persian)",
      },
    },
  },
};
```

```tsx
<div className="font-persian">متن فارسی</div>
```

### Custom local font (self-hosted)

Provide `local` with paths relative to your project root. The files are validated at config time and emitted into the build output (and served by the dev server) automatically:

```ts
persian({
  font: {
    family: "IRANSansX",                     // any name — used verbatim in font-family
    local: {
      woff2: "src/fonts/IRANSansX.woff2",    // required
      woff: "src/fonts/IRANSansX.woff",      // optional fallback
    },
    preload: true,                           // v0.3.1 — preload the local .woff2 early
  },
});
```

Notes:

- `local` and CDN are mutually exclusive — if `local` is set, CDN URLs are never referenced (even for a preset `family` like `"Vazirmatn"`), and no `preconnect` is added.
- Missing or out-of-project files fail fast with a clear error at config time.
- The emitted URL respects Vite's `base` option.
- `preload: true` (v0.3.1) injects `<link rel="preload" as="font" type="font/woff2" crossorigin>` for every local `.woff2` so the browser starts fetching it before CSS is applied — reducing FOUT. Only self-hosted fonts are preloaded; CDN presets never are.

## CSS logical properties (v0.3.0, opt-in)

Physical properties (`padding-left`, `margin-right`, `left`, `text-align: left`) point the wrong way in RTL. The experimental `logicalProperties` flag rewrites them to their logical equivalents during the CSS pipeline, so the same stylesheet flows correctly in both directions:

```ts
persian({
  experimental: { logicalProperties: true },
});
```

| Physical                              | Logical                          |
| ------------------------------------- | -------------------------------- |
| `padding-left` / `padding-right`      | `padding-inline-start` / `-end`  |
| `margin-left` / `margin-right`        | `margin-inline-start` / `-end`   |
| `left` / `right`                      | `inset-inline-start` / `-end`    |
| `text-align: left` / `right`          | `text-align: start` / `end`      |

Values that are already logical (`start`, `end`) and everything else pass through untouched. Font declarations are never affected — the plugin only rewrites layout/inline-axis properties.

### Exclusions (v0.3.1)

Legacy widgets and third-party components sometimes *need* physical properties. Opt them out either through the `ignore` selector list (strings match one selector exactly; RegExps are tested against each selector in a rule's selector list):

```ts
persian({
  experimental: {
    logicalProperties: {
      ignore: [".legacy-fixed-sidebar", /^\.island-/], // strings and RegExps
    },
  },
});
```

…or with a `/* @persian-ignore */` comment placed directly above the rule:

```css
/* @persian-ignore */
.legacy-fixed-sidebar {
  margin-left: 20px; /* will NOT be converted to margin-inline-start */
}
```

The same comment works immediately before a single declaration, and as the very first token of a file it disables transformation for the whole file (unless it directly guards the file's first rule).

## Form inputs formatter (v0.4.0)

Real-time, caret-aware Persian normalization for `<input>`/`<textarea>` elements. As the user types, the plugin runs the text pipeline — Arabic→Persian character sanitizing, ZWNJ half-space joining, and digit conversion — on every keystroke and paste, and **keeps the caret (cursor) exactly where it was**, even when the value is rewritten mid-field. The transform only ever performs 1:1 replacements or pure deletions, which is what makes precise caret retention possible.

Each framework ships a drop-in primitive:

| Framework | Helper                | Usage                                          |
| --------- | --------------------- | ---------------------------------------------- |
| Vue       | `vPersianInput`       | `<input v-model="name" v-persian-input />`     |
| React     | `usePersianInput`     | `const input = usePersianInput(); <input {...input} />` |
| Svelte    | `persianInput`        | `<input bind:value use:persianInput />`        |

All three accept the same options:

| Option        | Type                        | Default     | Description                                                      |
| ------------- | --------------------------- | ----------- | ---------------------------------------------------------------- |
| `sanitize`    | `boolean`                   | `true`      | Convert Arabic `ي`/`ى`→`ی` and `ك`→`ک`.                           |
| `halfSpaces`  | `boolean`                   | `true`      | Insert/correct ZWNJ (نیمفاصله) for `می`/`نمی`/`ها`/`های`/`تر`/`ترین` joins — `"می شود"` → `"می‌شود"`. |
| `digits`      | `"persian" \| "english" \| "none"` | `"persian"` | Numeral system applied to typed digits.                          |
| `transform`   | `(text: string) => string`  | —           | Replaces the entire pipeline with your own transform (other options are ignored). |
| `initialValue`| `string`                    | `""`        | Value rendered into the field on first mount (`usePersianInput`).|

> **Vue** — `v-persian-input` registers its `input` listener in the directive's `created` hook, so it runs *before* Vue's `v-model` handler on the same event. The model always receives the cleaned value — no double commit, no flicker, and the caret is restored in place.
>
> **React** — `usePersianInput` is a controlled-input hook: every keystroke/paste is intercepted, the raw `e.target.value` is normalized before React state sees it, the DOM is patched synchronously, and the caret is restored (with a render-phase effect as a safety net).
>
> **Svelte** — `use:persianInput` normalizes on `input`, restores the caret, and re-dispatches the `input` event only when the value actually changed, so `bind:value` picks up the cleaned text on the same keystroke with no event loop.

### Vue — `v-persian-input`

Register globally (`app.directive("persian-input", vPersianInput)`) or per component (`directives: { persianInput: vPersianInput }`):

```vue
<script setup>
import { vPersianInput } from "vite-plugin-persian/vue"; // or via app.directive
import { ref } from "vue";
const name = ref("");
const bio = ref("");
</script>

<template>
  <!-- defaults: sanitize + half-spaces + Persian digits -->
  <input v-model="name" v-persian-input />

  <!-- all options are configurable, or pass `false` to disable normalization -->
  <textarea v-model="bio" v-persian-input="{ halfSpaces: false, digits: 'english' }" />
</template>
```

### React — `usePersianInput`

```tsx
import { usePersianInput } from "vite-plugin-persian/react";

function PersianField() {
  const input = usePersianInput({ digits: "persian" });
  return <input {...input} placeholder="متن فارسی" />;
}
```

### Svelte — `use:persianInput`

```svelte
<script lang="ts">
  import { persianInput } from "vite-plugin-persian/svelte";
  let name = "";
</script>

<input bind:value={name} use:persianInput />
```

### Plain pipeline

The same engine is exposed without a DOM dependency, so it works anywhere — including one-shot normalization over arbitrary strings:

```ts
import {
  normalizePersianInput,
  createTextTransform,
  sanitizePersianText,
  normalizeHalfSpaces,
} from "virtual:persian/text";

normalizePersianInput("می شود 1، را 2");      // "می‌شود ۱، را ۲"
normalizePersianInput("يک متن", { sanitize: false }); // "يک متن"

const transform = createTextTransform({ halfSpaces: false }); // reusable
transform("می شود");                          // "می شود"

sanitizePersianText("يك");                    // "یک"
normalizeHalfSpaces("می شود");                // "می‌شود"
```

## SEO Persian Slug Generator (v0.4.0)

`toPersianSlug` turns a Persian/English title into a clean, URL-safe, SEO-optimized slug. It understands mixed-language tokens and the quirks of the Arabic script:

- **Keeps** Persian letters, English letters, and digits (Persian *and* Arabic-Indic numerals) intact — so `۱۴۰۳` stays `۱۴۰۳` and `19` stays `19`.
- **Rewrites** every other character — spaces, `_`, existing `-`, punctuation, currency signs, ZWNJ, emojis — into a single word-boundary separator, collapsing runs and trimming leading/trailing separators.
- **Strips invisible Arabic/Persian typography** — harakat/tashkeel diacritics (U+064B–U+065F), tatweel `ـ` (U+0640), superscript alef, bidi marks, and Quranic annotation marks — *dropping* them instead of separating on them: `"دَست"` → `"دست"`, and ZWNJ still counts as a boundary: `"می‌خواهم"` → `"می-خواهم"`.
- **Handles mixed language gracefully**:

```ts
import { toPersianSlug } from "virtual:persian/text";

toPersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
// "آموزش-جامع-vite-نسخه-جدید-بخش-۱"

toPersianSlug("سلام   دنیا!!!",  { separator: "_" });  // "سلام_دنیا"
toPersianSlug("MIKHAIL",         { lowercase: false }); // "MIKHAIL"
toPersianSlug("",                                      ) // ""
```

Reactive hooks are included for all three frameworks — `usePersianSlug(text, options)`:

| Framework | Signature                                                 | Returns           |
| --------- | --------------------------------------------------------- | ----------------- |
| React     | `usePersianSlug(text: string \| null \| undefined, options?)` | `string`          |
| Vue       | `usePersianSlug(text: MaybeRefOrGetter<...>, options?)`      | `ComputedRef<string>` |
| Svelte    | `usePersianSlug(source: string \| Readable<...>, options?)`  | `Readable<string>` |

```tsx
// React
const slug = usePersianSlug("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
// "آموزش-جامع-vite-نسخه-جدید-بخش-۱"
```

```vue
<!-- Vue -->
<script setup>
import { ref } from "vue";
import { usePersianSlug } from "vite-plugin-persian/vue";
const title = ref("آموزش جامع Vite");
const slug = usePersianSlug(title); // ComputedRef<string>
</script>
```

```svelte
<!-- Svelte -->
<script lang="ts">
  import { writable } from "svelte/store";
  import { usePersianSlug } from "vite-plugin-persian/svelte";
  const title = writable("آموزش جامع Vite");
  const slug = usePersianSlug(title); // Readable<string>
</script>
<span>preview: {$slug}</span>
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

### `virtual:persian/text` — digits, currency, validation, words, input formatting & slugs

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

#### Real-time input pipeline & SEO slugs (v0.4.0)

`sanitizePersianText`, `normalizeHalfSpaces`, `normalizePersianInput`, and `createTextTransform` power the [form inputs formatter](#form-inputs-formatter-v040), and `toPersianSlug` generates [SEO slugs](#seo-persian-slug-generator-v040) — all importable straight from the text module:

```ts
import { normalizePersianInput, toPersianSlug } from "virtual:persian/text";

normalizePersianInput("می شود 1");            // "می‌شود ۱"
toPersianSlug("آموزش جامع Vite");            // "آموزش-جامع-vite"
```

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
  usePersianInput,
  usePersianSlug,
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

function PersianField() {
  const input = usePersianInput();                // caret-aware formatter (v0.4.0)
  return <input {...input} placeholder="متن فارسی" />;
}

function ArticleEditor() {
  const [title] = useState("«آموزش جامع Vite (نسخه جدید) - بخش ۱!»");
  const slug = usePersianSlug(title);             // "آموزش-جامع-vite-نسخه-جدید-بخش-۱"
  return <small>slug: {slug}</small>;
}
```

`vite-plugin-persian/react` also re-exports the plain helpers: `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, `sanitizePersianText`, `normalizeHalfSpaces`, `normalizePersianInput`, `createTextTransform`, `toPersianSlug`, `toToman`, `toRial`, `formatCurrency`, `isNationalCode`, `isMobileNumber`, `normalizeMobileNumber`, `toNumberWords`.

## Vue helpers

```bash
npm install vue                # required peer dependency
```

Register the directive globally in your app entry (or per-component via `directives: { persianDigits: vPersianDigits }`):

```ts
// main.ts
import { createApp } from "vue";
import { vPersianDigits, vPersianInput } from "vite-plugin-persian/vue";
import App from "./App.vue";

createApp(App)
  .directive("persian-digits", vPersianDigits)
  .directive("persian-input", vPersianInput)
  .mount("#app");
```

```vue
<template>
  <!-- converts the bound value, and re-converts on updates -->
  <span v-persian-digits="price">{{ price }}</span>

  <!-- converts the element's own text once -->
  <span v-persian-digits>12.500</span>

  <!-- form controls get their .value converted -->
  <input v-persian-digits="model" />

  <!-- v0.4.0: real-time, caret-aware Persian input formatter -->
  <input v-model="name" v-persian-input />
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  useJalaliDate,
  useNationalCode,
  useMobileNumber,
  useNumberWords,
  usePersianSlug,
} from "vite-plugin-persian/vue";

const price = ref(12500);
const jalali = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY"); // ComputedRef<string>
const codeValid = useNationalCode("0010042911");                    // ComputedRef<boolean>
const phoneValid = useMobileNumber("09123456789");                  // ComputedRef<boolean>
const words = useNumberWords(price);                                // ComputedRef<string>
const slug = usePersianSlug("آموزش جامع Vite");                     // ComputedRef<string>
</script>
```

Composables accept a plain value, a `Ref`, or a getter function (`MaybeRefOrGetter`) and return reactive `ComputedRef`s — they stay in sync when a `ref` changes. `usePersianDigits()` returns `{ toPersianDigits, toEnglishDigits, normalizePersianText }` as plain functions.

`vite-plugin-persian/vue` also re-exports the plain helpers: `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, `sanitizePersianText`, `normalizeHalfSpaces`, `normalizePersianInput`, `createTextTransform`, `toPersianSlug`, `toToman`, `toRial`, `formatCurrency`, `isNationalCode`, `isMobileNumber`, `normalizeMobileNumber`, `toNumberWords`.

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
    usePersianSlug,
    persianDigits,
    persianInput,
  } from "vite-plugin-persian/svelte";

  export let price: number; // number

  const priceFa = usePersianDigits(price);                       // Readable
  const jalaali = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY"); // Readable

  const code = writable("0010042911");
  const phone = writable("09123456789");
  const codeValid = useNationalCode(code);   // Readable<boolean>
  const phoneValid = useMobileNumber(phone); // Readable<boolean>
  const words = useNumberWords(writable(12500)); // Readable<string>
  const slug = usePersianSlug("آموزش جامع Vite");          // Readable<string>
  const name = writable("");
</script>

<!-- actions: convert bound values, re-running on updates -->
<span use:persianDigits={price}>{price}</span>
<input use:persianDigits bind:value />

<!-- v0.4.0: real-time, caret-aware Persian input formatter -->
<input bind:value={name} use:persianInput />

<!-- hook output is reactive via the $ store syntax -->
<span>{$priceFa}</span>
<span>{$jalaali}</span>
<span>{$words}</span>
<span>{$slug}</span>
```

`usePersianDigits`, `useEnglishDigits`, `useJalaliDate`, `useNationalCode`, `useMobileNumber`, `useNumberWords`, and `usePersianSlug` accept a plain value or any `Readable` from `svelte/store`, and return `Readable`s that react to changes. `persianDigits` and `persianInput` are standard Svelte actions with `update`/`destroy` lifecycle.

`vite-plugin-persian/svelte` also re-exports the plain helpers: `toPersianDigits`, `toEnglishDigits`, `normalizePersianText`, `sanitizePersianText`, `normalizeHalfSpaces`, `normalizePersianInput`, `createTextTransform`, `toPersianSlug`, `toToman`, `toRial`, `formatCurrency`, `isNationalCode`, `isMobileNumber`, `normalizeMobileNumber`, `toNumberWords`.

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
| `font.family`     | `string`                | —             | Font-family name. Presets `"Vazirmatn" \| "Sahel" \| "Samim"` load from jsDelivr; any other name requires `font.local`. |
| `font.display`    | `"auto" \| "block" \| "swap" \| "fallback" \| "optional"` | `"swap"` | `font-display` descriptor for the injected `@font-face` rules. |
| `font.local`      | `{ woff2: string; woff?: string }` | — | Self-hosted font paths (relative to project root). When set, CDN sourcing is disabled. |
| `font.injectToBody` | `boolean`             | `true`        | Apply the font to `body` via `:root { --persian-font-family }` + `body { font-family: var(...) !important }`. |
| `font.preload` | `boolean` | `false` | Emit `<link rel="preload" as="font" type="font/woff2" crossorigin>` for each local `.woff2` (v0.3.1). Local fonts only; CDN presets are never preloaded. |
| `experimental.logicalProperties` | `boolean \| { ignore?: (string \| RegExp)[] }` | `false` | Rewrite physical CSS properties (`padding-left`, `margin-right`, `left`/`right`, `text-align: left/right`) into logical ones (`*-inline-start`/`-end`, `start`/`end`). Bypass per rule via `@persian-ignore` comments or the `ignore` selector list (v0.3.1). |

```ts
persian({
  html: { lang: "fa-IR" },
  jalali: { engine: "intl" },
  text: { enabled: true },
  font: { family: "Vazirmatn", display: "swap", injectToBody: true },
  experimental: { logicalProperties: { ignore: [".legacy-fixed-sidebar"] } },
});
```

> **v0.4.0 options live on the helpers, not the plugin.** The input formatter options (`sanitize`, `halfSpaces`, `digits`, `transform`, `initialValue`) and slug options (`lowercase`, `separator`) are passed to the individual React/Vue/Svelte call-sites — see [Form inputs formatter](#form-inputs-formatter-v040) and [SEO Persian Slug Generator](#seo-persian-slug-generator-v040). They need no plugin-level configuration.

## Notes & limitations

- **No magic transforms.** The plugin never rewrites your components or auto-converts code. Only the virtual-module imports and helpers convert digits — and the `<html lang/dir>` attributes are the only automatic output. This keeps behavior predictable and bundle-safe for tree-shaking.
- **Local time, not timezones.** Date conversion uses the local timezone of the running machine.
- **`intl` engine caveats.** It derives leap years and conversions from the host's `Intl`/ICU data, so results can vary slightly across environments and it is slower than `jalaali-js` (iterative search). Use it when you want a ~zero-footprint calendar. The default `jalaali-js` engine is deterministic.
- **Not an i18n/styling library.** It sets `dir="rtl"`, but does not flip your CSS or localize UI strings — unless you opt into `experimental.logicalProperties`, which rewrites physical layout properties to logical ones (see [CSS logical properties](#css-logical-properties-v030-opt-in)).
- **Requires Vite 5–8.** It is a build-time plugin; content you hand-render on a server outside Vite is unaffected.

## License

MIT © [unknownman](https://github.com/unknownman)