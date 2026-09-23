<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  useJalaliDate,
  useMobileNumber,
  useNationalCode,
  useNumberWords,
  usePersianDigits,
} from "vite-plugin-persian/vue";
import { formatCurrency, normalizePersianText, toEnglishDigits, toToman } from "virtual:persian/text";

const amount = ref("12500000");
const rial = computed(() => Number(toEnglishDigits(amount.value).replace(/\D+/g, "")) || 0);
const toman = computed(() => toToman(rial.value));
const rialFmt = computed(() => formatCurrency(rial.value, { unit: "ریال" }));
const tomanFmt = computed(() => formatCurrency(toman.value));
const tomanEn = computed(() => formatCurrency(toman.value, { unit: "تومان", digits: "english" }));

const nationalCode = ref("0010042911");
const mobile = ref("09123456789");
const number = ref(12500);

const codeValid = useNationalCode(nationalCode);
const mobileValid = useMobileNumber(mobile);
const words = useNumberWords(number);

const now = ref(new Date());
const jalali = useJalaliDate(now, "d MMMM YYYY");
const timeText = computed(() => usePersianDigits(now.value.toLocaleTimeString("en-GB")));

let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <main class="app" lang="fa" dir="rtl">
    <h1>vite-plugin-persian · Vue</h1>
    <p class="tagline">
      Uses <code>vite-plugin-persian/vue</code>, the global <code>v-persian-digits</code>
      directive, and <code>useJalaliDate</code> for the live clock.
    </p>

    <section class="card">
      <h2>Currency — Rial ↔ Toman</h2>
      <input v-model="amount" inputmode="numeric" aria-label="Amount in Rial" />
      <ul>
        <li>Rial (fa): <strong>{{ rialFmt }}</strong></li>
        <li>Toman (fa): <strong>{{ tomanFmt }}</strong></li>
        <li>Toman (en): <strong>{{ tomanEn }}</strong></li>
      </ul>
      <p>
        Directive output: <span v-persian-digits="rial">0</span>
      </p>
    </section>

    <section class="card">
      <h2>Live validation &amp; words</h2>
      <label>
        کد ملی
        <input v-model="nationalCode" />
        <span :class="codeValid ? 'ok' : 'bad'">{{ codeValid ? 'معتبر' : 'نامعتبر' }}</span>
      </label>
      <label>
        موبایل
        <input v-model="mobile" />
        <span :class="mobileValid ? 'ok' : 'bad'">{{ mobileValid ? 'معتبر' : 'نامعتبر' }}</span>
      </label>
      <label>
        Number
        <input v-model.number="number" type="number" inputmode="numeric" />
      </label>
      <p class="words">{{ words }}</p>
      <p>Normalized text: <em>{{ normalizePersianText('يك   تست  ميباشد') }}</em></p>
    </section>

    <section class="card">
      <h2>Jalali calendar</h2>
      <p class="big">{{ jalali }}</p>
      <p class="time">{{ timeText }}</p>
    </section>
  </main>
</template>