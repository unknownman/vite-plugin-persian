<script lang="ts">
  import { onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import {
    persianDigits,
    useJalaliDate,
    useMobileNumber,
    useNationalCode,
    useNumberWords,
    usePersianDigits,
  } from "vite-plugin-persian/svelte";
  import { formatCurrency, normalizePersianText, toEnglishDigits, toToman } from "virtual:persian/text";

  let amount = $state("12500000");
  const rial = writable(12500000);

  function updateRial(event: Event): void {
    const target = event.target as HTMLInputElement;
    rial.set(Number(toEnglishDigits(target.value).replace(/\D+/g, "")) || 0);
  }

  const rialFmt = writable("");
  const tomanFmt = writable("");
  const tomanEn = writable("");
  rial.subscribe((value) => {
    rialFmt.set(formatCurrency(value, { unit: "ریال" }));
    tomanFmt.set(formatCurrency(toToman(value)));
    tomanEn.set(formatCurrency(toToman(value), { unit: "تومان", digits: "english" }));
  });

  let nationalCode = $state("0010042911");
  let mobile = $state("09123456789");
  let number = $state(12500);

  const codeStore = writable("");
  const mobileStore = writable("");
  const numberStore = writable(0);
  $effect(() => codeStore.set(nationalCode));
  $effect(() => mobileStore.set(mobile));
  $effect(() => numberStore.set(number));

  const codeValid = useNationalCode(codeStore);
  const mobileValid = useMobileNumber(mobileStore);
  const words = useNumberWords(numberStore);

  const now = writable(new Date());
  const jalali = useJalaliDate(now, "d MMMM YYYY");
  const timeText = writable("");
  now.subscribe((date) => timeText.set(date.toLocaleTimeString("en-GB")));
  const time = usePersianDigits(timeText);

  const timer = setInterval(() => now.set(new Date()), 1000);
  onDestroy(() => clearInterval(timer));
</script>

<main class="app" lang="fa" dir="rtl">
  <h1>vite-plugin-persian · Svelte</h1>
  <p class="tagline">
    Uses <code>vite-plugin-persian/svelte</code>, the <code>use:persianDigits</code> action,
    derived stores for validation, and <code>useJalaliDate</code> for the live clock.
  </p>

  <section class="card">
    <h2>Currency — Rial ↔ Toman</h2>
    <input bind:value={amount} oninput={updateRial} inputmode="numeric" aria-label="Amount in Rial" />
    <ul>
      <li>Rial (fa): <strong>{$rialFmt}</strong></li>
      <li>Toman (fa): <strong>{$tomanFmt}</strong></li>
      <li>Toman (en): <strong>{$tomanEn}</strong></li>
    </ul>
    <p>
      Action output: <span use:persianDigits>1234567</span>
    </p>
  </section>

  <section class="card">
    <h2>Live validation &amp; words</h2>
    <label>
      کد ملی
      <input bind:value={nationalCode} />
      <span class:ok={$codeValid} class:bad={!$codeValid}>{$codeValid ? 'معتبر' : 'نامعتبر'}</span>
    </label>
    <label>
      موبایل
      <input bind:value={mobile} />
      <span class:ok={$mobileValid} class:bad={!$mobileValid}>{$mobileValid ? 'معتبر' : 'نامعتبر'}</span>
    </label>
    <label>
      Number
      <input type="number" inputmode="numeric" bind:value={number} />
    </label>
    <p class="words">{$words}</p>
    <p>Normalized text: <em>{normalizePersianText('يك   تست  ميباشد')}</em></p>
  </section>

  <section class="card">
    <h2>Jalali calendar</h2>
    <p class="big">{$jalali}</p>
    <p class="time">{$time}</p>
  </section>
</main>