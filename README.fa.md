# vite-plugin-persian

پلاگین سبک و مستقل از فریمورکِ Vite برای پروژه‌های فارسی. این پلاگین تنظیمات لازم برای **راست‌به‌چپ (RTL)** را روی HTML شما اعمال می‌کند و ابزارهای مبتنی بر تایپ را در اختیارتان می‌گذارد: تاریخ **جلالی (شمسی)**، تبدیل **اعداد فارسی و انگلیسی**، قالب‌بندی **پول (تومان و ریال)**، اعتبارسنجی **کد ملی و شماره موبایل ایرانی** و **تبدیل عدد به حروف** — همگی از طریق ماژول‌های مجازیِ بدون وابستگیِ زمان اجرا (zero runtime deps) با پشتیبانی اختیاری از React، Vue و Svelte.

> Vite ۵ • ۶ • ۷ • ۸ — Node نسخه ۱۸ و بالاتر — پشتیبانی از ESM و CJS

[English](README.md) · [فارسی](#vite-plugin-persian)

## امکانات

- **آماده‌سازی HTML برای RTL** — به‌صورت خودکار `lang="fa"` و `dir="rtl"` را روی تگ `<html>` می‌گذارد (هر دو قابل تغییر هستند).
- **تزریق فونت فارسی** (نسخه ۰.۳.۰، اختیاری) — با یک خط تنظیم، فونت فارسی از CDN (jsDelivr) یا از فایل‌های محلی `.woff2`/`.woff` پروژهٔ شما ارائه می‌شود؛ به‌همراه اعمال خودکار `body { font-family }`.
- **پراپرتی‌های منطقی CSS** (نسخه ۰.۳.۰، اختیاری) — بازنویسی `padding-left`/`margin-right`/`text-align: left` به معادل منطقی (`start`/`end`) تا RTL بدون CSS مخصوص جهت کار کند.
- **تاریخ جلالی (تقویم شمسی)** — توابع `formatJalali`، `toJalali`، `toGregorian`، `isLeapJalaliYear` و `getMonthName` با نام ماه‌های فارسی یا انگلیسی. به‌همراه هوک‌های فریمورک-محور `useJalaliDate` برای React و Vue و Svelte.
- **اعداد فارسی** — تبدیل هر دو جهت بین ارقام فارسی/هندی (`۰۱۲۳۴۵۶۷۸۹`) و انگلیسی، به‌همراه نرمال‌سازی متن فارسی.
- **ابزارهای پول** — توابع `toToman`، `toRial` و `formatCurrency` با ارقام فارسی/انگلیسی و جداکنندهٔ هزارگان.
- **اعتبارسنجی کد ملی و موبایل ایرانی** — تابع `isNationalCode` (بر اساس الگوریتم رسمی ۱۰ رقمی) و توابع `isMobileNumber`/`normalizeMobileNumber` (برای قالب استاندارد `09xxxxxxxxx`).
- **تبدیل عدد به حروف فارسی** — تابع `toNumberWords` برای اعداد بسیار بزرگ بدون خطای دقت (بر پایهٔ BigInt، تا ۱۰۲۴)، همراه با اعداد اعشاری: `۱۲۵۰۰ → «دوازده هزار و پانصد»`.
- **هوک‌های فریمورک-محور** — `useJalaliDate`، `useNationalCode`، `useMobileNumber`، `useNumberWords` و `usePersianDigits` برای React، Vue و Svelte.
- **قابل tree-shaking** — فقط موتوری که انتخاب می‌کنید (`jalaali-js` به‌صورت پیش‌فرض یا `intl`) باندل می‌شود و موتور دیگر حذف می‌ماند.
- **بدون وابستگی زمان اجرا** — `jalaali-js` به‌صورت مستقیم داخل پکیج کامپایل می‌شود.
- **TypeScript-first** — ماژول‌های مجازی به‌همراه تایپ‌ها ارائه می‌شوند و تمام ورودی‌های فریمورک‌ها کاملاً تایپ‌شده هستند.
- **هیپلپرهای اختیاری فریمورک‌ها** — هیچ کد فریمورکی در هسته نیست؛ فقط در صورت نیاز از `vite-plugin-persian/react`، `/vue` یا `/svelte` ایمپورت کنید.

## نصب

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

داوری‌نیازمندان (peer dependencies) اختیاری عبارت‌اند از `react` (نسخه ۱۸ به بالا)، `vue` (نسخه ۳ به بالا) و `svelte` (نسخه ۴ به بالا) — فقط اگر از همین‌هیپلپرها استفاده می‌کنید آن‌ها را نصب کنید.

## شروع سریع

پلاگین را به تنظیمات Vite اضافه کنید. همه‌چیز دیگر اختیاری است:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [persian()],
});
```

تمام شد. خروجی پروژهٔ شما حالا به‌این شکل است:

```html
<html lang="fa" dir="rtl"> ... </html>
```

## مثال‌ها (Examples)

پروژه‌های دموی آماده در پوشهٔ [`examples/`](./examples) قرار دارند: `react-demo`، `vue-demo` و `svelte-demo`. هرکدام یک پروژهٔ واقعی Vite هستند که پلاگین را از طریق `file:../..` مصرف می‌کنند و ویجت پول، اعتبارسنجی زندهٔ فیلدها، ساعت جلالی، تبدیل ارقام و دایرکتیو/اکشن مخصوص فریمورک را نمایش می‌دهند:

```bash
cd examples/react-demo    # یا vue-demo / svelte-demo
npm install
npm run build             # بررسی تایپ + بیلد نهایی
npm run dev               # اجرای سرور توسعه
```

## تنظیم RTL و زبان

به‌صورت پیش‌فرض پلاگین هنگام اجرا یا ساخت پروژه، `lang="fa"` و `dir="rtl"` را روی عنصر `<html>` می‌گذارد. هرکدام را می‌توانید تغییر دهید:

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

## فونت فارسی (نسخه ۰.۳.۰، اختیاری؛ `preload` در ۰.۳.۱)

گزینهٔ `font` یک استایل‌شیت `@font-face` را مستقیماً داخل HTML شما تزریق می‌کند — بدون نوشتن CSS و بدون دانلود دستی فایل فونت. تا زمانی که پیکربندی نکنید، غیرفعال است.

### فونت از CDN

سه فونت فارسی پرطرفدار از پیش ثبت شده و از jsDelivr ارائه می‌شوند (یک تگ `preconnect` هم به‌صورت خودکار اضافه می‌شود):

```ts
// vite.config.ts
import { persian } from "vite-plugin-persian";

export default defineConfig({
  plugins: [
    persian({
      font: {
        family: "Vazirmatn",          // "Vazirmatn" | "Sahel" | "Samim"
        display: "swap",              // font-display: auto | block | swap | fallback | optional
        injectToBody: true,           // پیش‌فرض — فونت را روی <body> اعمال می‌کند
      },
    }),
  ],
});
```

با `injectToBody: true` (پیش‌فرض) پلاگین این هم خروجی می‌دهد:

```css
:root {
  --persian-font-family: "Vazirmatn";
  --font-persian: "Vazirmatn", sans-serif; /* نسخه ۰.۳.۱ */
}
body { font-family: var(--persian-font-family), sans-serif !important; }
```

تا کل برنامه فوراً با این فونت رندر شود. اگر می‌خواهید خودتان `font-family` را کنترل کنید، `injectToBody: false` بگذارید — در این حالت فقط تزریق `:root`/`body` حذف می‌شود و قواعد `@font-face` همچنان تزریق می‌گردند.

علاوه بر `--persian-font-family`، نسخهٔ ۰.۳.۱ متغیر **`--font-persian`** را هم تعریف می‌کند — نام فونت به‌همراه پشتهٔ جایگزین — که با قرارداد نام‌گذاری `--font-*` در Tailwind هماهنگ است. آن را در کانفیگ Tailwind نگاشت کنید:

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

### فونت محلی (Self-hosted)

گزینهٔ `local` را با مسیرهای نسبی به ریشهٔ پروژه پر کنید. فایل‌ها در زمان پیکربندی اعتبارسنجی و به‌صورت خودکار داخل خروجی بیلد (و توسط سرور توسعه) ارائه می‌شوند:

```ts
persian({
  font: {
    family: "IRANSansX",                     // هر نامی — عیناً در font-family استفاده می‌شود
    local: {
      woff2: "src/fonts/IRANSansX.woff2",    // الزامی
      woff: "src/fonts/IRANSansX.woff",      // جایگزین اختیاری
    },
    preload: true,                           // نسخه ۰.۳.۱ — پیش‌بارگذاری زودهنگام woff2 محلی
  },
});
```

نکته‌ها:

- `local` و CDN متقابل هستند — اگر `local` تنظیم شده باشد، هیچ URL از CDN استفاده نمی‌شود (حتی برای `family` از پیش تعریف‌شده مثل `"Vazirmatn"`) و `preconnect` هم اضافه نمی‌شود.
- فایل‌های موجود نبودن یا خارج از پروژه، به‌صورت fail-fast با خطای شفاف در زمان پیکربندی گزارش می‌شوند.
- URL خروجی، گزینهٔ `base` مربوط به Vite را رعایت می‌کند.
- `preload: true` (نسخهٔ ۰.۳.۱) تگ `<link rel="preload" as="font" type="font/woff2" crossorigin>` را برای هر `.woff2` محلی تزریق می‌کند تا مرورگر پیش از اعمال CSS آن را دریافت کند (کاهش FOUT). فقط فونت‌های self-hosted پیش‌بارگذاری می‌شوند؛ پیش‌فرض‌های CDN هرگز.

## پراپرتی‌های منطقی CSS (نسخه ۰.۳.۰، اختیاری)

پراپرتی‌های فیزیکی (`padding-left`، `margin-right`، `left`، `text-align: left`) در RTL جهت اشتباهی را نشان می‌دهند. فلگ آزمایشی `logicalProperties` آن‌ها را در خط لولهٔ CSS به معادل منطقی‌شان بازنویسی می‌کند تا همان استایل‌شیت در هر دو جهت درست جریان یابد:

```ts
persian({
  experimental: { logicalProperties: true },
});
```

| فیزیکی                                | منطقی                             |
| ------------------------------------- | --------------------------------- |
| `padding-left` / `padding-right`      | `padding-inline-start` / `-end`   |
| `margin-left` / `margin-right`        | `margin-inline-start` / `-end`    |
| `left` / `right`                      | `inset-inline-start` / `-end`     |
| `text-align: left` / `right`          | `text-align: start` / `end`       |

مقادیری که از قبل منطقی هستند (`start`، `end`) و هر چیز دیگری بدون تغییر عبور می‌کنند. اعلامیه‌های فونت هرگز دستکاری نمی‌شوند — پلاگین فقط پراپرتی‌های چیدمان/محور inline را بازنویسی می‌کند.

### استثناها (نسخه ۰.۳.۱)

ویجت‌های قدیمی یا کامپوننت‌های شخص ثالث گاهی واقعاً به پراپرتی‌های فیزیکی نیاز دارند. می‌توانید آن‌ها را یا از طریق لیست انتخابگر `ignore` کنار بگذارید (رشته‌ها دقیقاً با یک انتخابگر برابر می‌شوند و RegExpها روی تک‌تک انتخابگرها آزمایش می‌شوند):

```ts
persian({
  experimental: {
    logicalProperties: {
      ignore: [".legacy-fixed-sidebar", /^\.island-/], // رشته و RegExp
    },
  },
});
```

…یا با کامنت `/* @persian-ignore */` دقیقاً بالای همان قاعده:

```css
/* @persian-ignore */
.legacy-fixed-sidebar {
  margin-left: 20px; /* به margin-inline-start تبدیل نخواهد شد */
}
```

همین کامنت بلافاصله قبل از یک اعلامیه هم کار می‌کند، و به‌عنوان اولین نشانهٔ یک فایل، تبدیل کل فایل را غیرفعال می‌کند (مگر اینکه مستقیماً از قاعدهٔ اول فایل محافظت کند).

## ماژول‌های مجازی

پلاگین سه ماژول مجازی در اختیار شما قرار می‌دهد. برای دریافت تایپ کامل فقط یک‌بار این خط را به `src/vite-env.d.ts` اضافه کنید (بخش [TypeScript](#typescript) را ببینید):

```ts
/// <reference types="vite-plugin-persian/virtual" />
```

### `virtual:persian/jalali` — تاریخ جلالی

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
toGregorian(1402, 10, 11);                     // Date (دوشنبه، ۱ ژانویهٔ ۲۰۲۴)
isLeapJalaliYear(1403);                        // true
getMonthName(10, "fa");                        // "دی"
getMonthName(10, "en");                        // "Dey"
```

`formatJalali` از توکن‌های `YYYY`، `YY`، `MMMM`، `MMM`، `MM`، `DD` و `d` پشتیبانی می‌کند و نام ماه‌ها را به فارسی نمایش می‌دهد. تبدیل تاریخ بر اساس اجزای زمان محلی (Local Time) انجام می‌شود.

### `virtual:persian/text` — ارقام، پول، اعتبارسنجی و عدد به حروف

#### تبدیل ارقام فارسی و نرمال‌سازی

```ts
import { toPersianDigits, toEnglishDigits, normalizePersianText } from "virtual:persian/text";

toPersianDigits(12500);             // "۱۲۵۰۰"
toPersianDigits("1,250,000");       // "۱,۲۵۰,۰۰۰"
toEnglishDigits("۱۲۵۰۰");           // "12500"
normalizePersianText("يك   تست");   // "یک تست"
```

#### ابزارهای پول (تومان / ریال)

```ts
import { toToman, toRial, formatCurrency } from "virtual:persian/text";

toToman(10000);        // 1000   (تبدیل ریال به تومان، تقسیم بر ۱۰)
toRial(1000);          // 10000  (تبدیل تومان به ریال، ضرب در ۱۰)

formatCurrency(12500000);                          // "۱۲٬۵۰۰٬۰۰۰ تومان"
formatCurrency(12500000, { digits: "english" });   // "12,500,000 تومان"
formatCurrency(2500000, { unit: "ریال" });         // "۲٬۵۰۰٬۰۰۰ ریال"
formatCurrency(12500, { separator: false });       // "۱۲۵۰۰ تومان"
```

توابع `toToman` و `toRial` ارقام انگلیسی یا فارسی/عربی (با یا بدون جداکننده) را می‌پذیرند و برای ورودی نامعتبر مقدار `NaN` برمی‌گردانند. تابع `formatCurrency` گزینه‌های `unit: "تومان" | "ریال"`، `digits: "persian" | "english"` و `separator: boolean` را می‌پذیرد و برای ورودی نامعتبر `""` برمی‌گرداند.

#### اعتبارسنجی کد ملی و شماره موبایل

```ts
import { isNationalCode, isMobileNumber, normalizeMobileNumber } from "virtual:persian/text";

isNationalCode("0010042911");            // true  (بر اساس الگوریتم رسمی ۱۰ رقمی)
isNationalCode("1234567890");            // false
isMobileNumber("09123456789");           // true
isMobileNumber("+98 912 345 6789");      // true
normalizeMobileNumber("+989123456789");  // "09123456789"
normalizeMobileNumber("۱۲۳");            // ""    (نامعتبر → رشتهٔ خالی)
```

در ابتدا فاصله‌ها و کاراکترهای غیرعددی حذف و ارقام فارسی/عربی به انگلیسی نرمال می‌شوند؛ بنابراین ورودی‌های ناخوانا (dirty input) به‌طور امن مدیریت می‌شوند.

#### تبدیل عدد به حروف فارسی

```ts
import { toNumberWords } from "virtual:persian/text";

toNumberWords(12500);            // "دوازده هزار و پانصد"
toNumberWords(0);                // "صفر"
toNumberWords(-3.5);             // "منفی سه ممیز پنج"
toNumberWords("1203450000");     // "یک میلیارد و دویست و سه میلیون و چهارصد و پنجاه هزار"
```

این تابع برای اعداد بسیار بزرگ (بر پایهٔ BigInt، تا ۱۰۲۴ یعنی «سپتیلیون»)، اعداد منفی و اعداد اعشاری دقیق است. ورودی نامعتبر مقدار `""` برمی‌گرداند.

### `virtual:persian` — همهٔ ابزارها یک‌جا

```ts
import { formatJalali, toPersianDigits } from "virtual:persian";
```

## هیپلپرهای مستقل (`vite-plugin-persian/methods`)

تمام توابع از زیرمسیر سادهٔ `vite-plugin-persian/methods` نیز قابل ایمپورت هستند — مناسب برای اسکریپت‌ها، Node.js یا سرورهای SSR که خارج از Vite اجرا می‌شوند:

```ts
import { toNumberWords, isNationalCode } from "vite-plugin-persian/methods";
import { formatJalali } from "vite-plugin-persian/methods";
```

این ورودی همان توابعی را دوباره صادر می‌کند که ماژول‌های مجازی آن‌ها را می‌پیچند (`formatJalali`، `toJalali`، `toGregorian`، `isLeapJalaliYear`، `getMonthName`، توابع ارقام/پول/اعتبارسنجی/عدد به حروف) به‌همراه تایپ‌های `CalendarEngine` و `JalaliEngine`.

## هیپلپرهای React

```bash
npm install react react-dom          # نصب dependencies ضروری
```

هوک‌ها نسبت به ورودی‌هایشان memoized هستند؛ بنابراین رندر مجدد با همان مقدار، نتیجهٔ پایداری برمی‌گرداند.

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

مسیر `vite-plugin-persian/react` همچنین توابع ساده را دوباره صادر می‌کند: `toPersianDigits`، `toEnglishDigits`، `normalizePersianText`، `toToman`، `toRial`، `formatCurrency`، `isNationalCode`، `isMobileNumber`، `normalizeMobileNumber` و `toNumberWords`.

## هیپلپرهای Vue

```bash
npm install vue                # نصب dependency ضروری
```

دایرکتیو را در فایل ورودی برنامه به‌صورت سراسری ثبت کنید (یا به‌صورت per-component با `directives: { persianDigits: vPersianDigits }`):

```ts
// main.ts
import { createApp } from "vue";
import { vPersianDigits } from "vite-plugin-persian/vue";
import App from "./App.vue";

createApp(App).directive("persian-digits", vPersianDigits).mount("#app");
```

```vue
<template>
  <!-- مقدارِ باندشده را تبدیل می‌کند و هنگام به‌روزرسانی دوباره تبدیل می‌شود -->
  <span v-persian-digits="price">{{ price }}</span>

  <!-- متن خودِ عنصر را یک‌بار تبدیل می‌کند -->
  <span v-persian-digits>12.500</span>

  <!-- فیلدهای فرم: .value آن‌ها تبدیل می‌شود -->
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

کمپوزبل‌ها یک مقدار ساده، یک `Ref` یا یک تابع getter (`MaybeRefOrGetter`) می‌پذیرند و `ComputedRef`های واکنش‌گرا برمی‌گردانند — با تغییر `ref` همگام می‌مانند. تابع `usePersianDigits()` نیز آبجکت `{ toPersianDigits, toEnglishDigits, normalizePersianText }` را به‌صورت توابع ساده برمی‌گرداند.

مسیر `vite-plugin-persian/vue` همچنین توابع ساده را دوباره صادر می‌کند: `toPersianDigits`، `toEnglishDigits`، `normalizePersianText`، `toToman`، `toRial`، `formatCurrency`، `isNationalCode`، `isMobileNumber`، `normalizeMobileNumber` و `toNumberWords`.

## هیپلپرهای Svelte

```bash
npm install svelte              # نصب dependency ضروری
```

هم با Svelte 4 (استورها) و هم با Svelte 5 (runes) کار می‌کند. همه‌چیز تایپ‌اسکریپت ساده است — بدون پلاگین اضافه یا wrapper:

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

<!-- اَکشن‌ها: مقدار باندشده را تبدیل می‌کنند و هنگام تغییر دوباره اجرا می‌شوند -->
<span use:persianDigits={price}>{price}</span>
<input use:persianDigits bind:value />

<!-- خروجی هوک‌ها با سینتکس $ استور واکنش‌گرا است -->
<span>{$priceFa}</span>
<span>{$jalaali}</span>
<span>{$words}</span>
```

توابع `usePersianDigits`، `useEnglishDigits`، `useJalaliDate`، `useNationalCode`، `useMobileNumber` و `useNumberWords` یک مقدار ساده یا هر `Readable` از `svelte/store` می‌پذیرند و `Readable`هایی برمی‌گردانند که به تغییرات واکنش نشان می‌دهند. `persianDigits` یک اکشن استاندارد Svelte با چرخهٔ `update`/`destroy` است.

مسیر `vite-plugin-persian/svelte` همچنین توابع ساده را دوباره صادر می‌کند: `toPersianDigits`، `toEnglishDigits`، `normalizePersianText`، `toToman`، `toRial`، `formatCurrency`، `isNationalCode`، `isMobileNumber`، `normalizeMobileNumber` و `toNumberWords`.

## TypeScript

پلاگین، گزینه‌های آن و هیپلپرهای React/Vue/Svelte به‌صورت پیش‌فرض تایپ‌شده هستند. برای **ماژول‌های مجازی** فقط یک‌بار این ارجاع را به `src/vite-env.d.ts` اضافه کنید:

```ts
/// <reference types="vite-plugin-persian/virtual" />
```

همچنین می‌توانید تایپ‌های عمومی را از خود پکیج ایمپورت کنید:

```ts
import type { PersianOptions, JalaliEngine, CalendarEngine } from "vite-plugin-persian";
```

## گزینه‌ها (Options)

| گزینه            | نوع                     | پیش‌فرض        | توضیح                                                 |
| ----------------- | ----------------------- | -------------- | ------------------------------------------------------ |
| `html.lang`       | `string`                | `"fa"`         | مقدار ویژگی `lang` بر روی تگ `<html>`.                 |
| `html.dir`        | `"rtl" \| "ltr"`        | `"rtl"`        | مقدار ویژگی `dir` بر روی تگ `<html>`.                  |
| `jalali.enabled`  | `boolean`               | `true`         | سرویس‌دهی `virtual:persian/jalali`. غیرفعال‌کردن + ایمپورت = خطا هنگام بیلد. |
| `jalali.engine`   | `"jalaali-js" \| "intl"`| `"jalaali-js"` | موتور تقویم. `intl` از `Intl.DateTimeFormat` داخلی مرورگر استفاده می‌کند (سبک‌تر اما وابسته به محیط)؛ `jalaali-js` در همه‌جا یکسان و پایدار است. |
| `text.enabled`    | `boolean`               | `true`         | سرویس‌دهی `virtual:persian/text`.                      |
| `font.family`     | `string`                | —              | نام فونت. پیش‌فرض‌های `"Vazirmatn" \| "Sahel" \| "Samim"` از jsDelivr بارگذاری می‌شوند؛ هر نام دیگری به `font.local` نیاز دارد. |
| `font.display`    | `"auto" \| "block" \| "swap" \| "fallback" \| "optional"` | `"swap"` | ویژگی `font-display` برای قواعد `@font-face` تزریق‌شده. |
| `font.local`      | `{ woff2: string; woff?: string }` | — | مسیر فایل‌های فونت محلی (نسبت به ریشهٔ پروژه). در صورت تنظیم، CDN استفاده نمی‌شود. |
| `font.injectToBody` | `boolean`             | `true`         | اعمال فونت روی `body` با `:root { --persian-font-family }` + `body { font-family: var(...) !important }`. |
| `font.preload` | `boolean` | `false` | انتشار `<link rel="preload" as="font" type="font/woff2" crossorigin>` برای هر `.woff2` محلی (نسخهٔ ۰.۳.۱). فقط فونت‌های محلی؛ پیش‌فرض‌های CDN هرگز پیش‌بارگذاری نمی‌شوند. |
| `experimental.logicalProperties` | `boolean \| { ignore?: (string \| RegExp)[] }` | `false` | بازنویسی پراپرتی‌های فیزیکی (`padding-left`، `margin-right`، `left`/`right`، `text-align: left/right`) به منطقی (`*-inline-start`/`-end`، `start`/`end`). حذف به‌ازای قاعده با کامنت `@persian-ignore` یا لیست انتخابگر `ignore` (نسخهٔ ۰.۳.۱). |

```ts
persian({
  html: { lang: "fa-IR" },
  jalali: { engine: "intl" },
  text: { enabled: true },
  font: { family: "Vazirmatn", display: "swap", injectToBody: true },
  experimental: { logicalProperties: { ignore: [".legacy-fixed-sidebar"] } },
});
```

## نکات و محدودیت‌ها

- **بدون تبدیل‌های جادویی.** پلاگین هرگز کدهای شما را بازنویسی یا به‌صورت خودکار تبدیل نمی‌کند. فقط ایمپورت‌های ماژول مجازی و هیپلپرها ارقام را تبدیل می‌کنند — و ویژگی‌های `<html lang/dir>` تنها خروجی خودکار هستند. این رویکرد، رفتار را قابل‌پیش‌بینی و برای tree-shaking امن نگه می‌دارد.
- **زمان محلی، نه منطقهٔ زمانی.** تبدیل تاریخ بر اساس منطقهٔ زمانی دستگاه در حال اجرا انجام می‌شود.
- **ملاحظات موتور `intl`.** سال‌های کبیسه و تبدیل‌ها از دادهٔ `Intl`/ICU میزبان استخراج می‌شوند؛ بنابراین نتایج ممکن است در محیط‌های مختلف کمی متفاوت باشند و از `jalaali-js` (جستجوی تکراری) کندتر است. وقتی می‌خواهید تقویم تقریباً بدون سربار داشته باشید از آن استفاده کنید. موتور پیش‌فرض `jalaali-js` قطعی و پایدار است.
- **یک کتابخانهٔ i18n/استایل نیست.** مقدار `dir="rtl"` را تنظیم می‌کند اما CSS شما را برنمی‌گرداند و متن رابط کاربری را بومی‌سازی نمی‌کند — مگر اینکه `experimental.logicalProperties` را فعال کنید که پراپرتی‌های چیدمان فیزیکی را به منطقی بازنویسی می‌کند (بخش [پراپرتی‌های منطقی CSS](#پراپرتیهای-منطقی-css-نسخه-۰۳۰-اختیاری)).
- **نیازمند Vite 5 تا 8 است.** این یک پلاگین زمان بیلد است؛ محتوایی که خارج از Vite و به‌صورت دستی در سرور رندر می‌کنید تحت تأثیر قرار نمی‌گیرد.

## مجوز

MIT © [unknownman](https://github.com/unknownman)