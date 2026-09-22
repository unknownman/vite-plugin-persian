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

## Features

- Jalali (Persian/Solar Hijri) date utilities
- Persian digit conversion
- RTL-ready HTML setup

## License

MIT
