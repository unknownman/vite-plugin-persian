# Examples

Minimal, real Vite applications that consume the plugin **from the local build**
via `file:../..`, so they behave exactly like published consumers. Each one
exercises the framework-specific entry, the virtual modules, and the plugin.

| Demo | Framework entry | Framework | Highlights |
| --- | --- | --- | --- |
| `react-demo` | `vite-plugin-persian/react` | React 19 | hooks (`useJalaliDate`, `useNationalCode`, …), live Jalali clock, Vazirmatn font injection + CSS logical-properties rewrite (v0.3.0) |
| `vue-demo` | `vite-plugin-persian/vue` | Vue 3 | hooks + global `v-persian-digits` directive, live clock |
| `svelte-demo` | `vite-plugin-persian/svelte` | Svelte 5 | hooks as stores, `use:persianDigits` action, live clock |

All three share the same shape: currency (Rial ↔ Toman), live national-code and
mobile validators, number-to-Persian-words, Persian digit conversion, and a
live Jalali clock.

## Prerequisites

The plugin must be built first so `file:../..` resolves to a real `dist/`:

```sh
npm install
npm run build   # in the repository root
```

## Usage

```sh
cd examples/react-demo   # (or vue-demo / svelte-demo)
npm install
npm run build            # typecheck + production build
```

Then `npm run dev` and open the printed URL.

## Verifying the published shape

Each example also carries a `tsconfig.nodenext.json` plus a
`src/nodenext-check.ts` that imports the package under Node's real
`nodenext` resolution (bypassing Vite's bundled resolver). This proves the
agent `exports` map — types and runtime — works for a genuine ESM consumer:

```sh
npm run verify:nodenext
```