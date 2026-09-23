import { useEffect, useState } from "react";
import {
  formatCurrency,
  toPersianDigits,
  toRial,
  toToman,
  useJalaliDate,
  useMobileNumber,
  useNationalCode,
  useNumberWords,
  usePersianDigits,
} from "vite-plugin-persian/react";
import { normalizePersianText } from "virtual:persian/text";

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function CurrencyCard() {
  const [amount, setAmount] = useState("12500000");
  const rial = Number(amount.replace(/[^\d]/g, "")) || 0;
  const toman = toToman(rial);

  return (
    <section className="card">
      <h2>Currency — Rial ↔ Toman</h2>
      <input
        inputMode="numeric"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        aria-label="Amount in Rial"
      />
      <ul>
        <li>
          Rial (fa): <strong>{formatCurrency(rial, { unit: "ریال" })}</strong>
        </li>
        <li>
          Toman (fa): <strong>{formatCurrency(toman)}</strong>
        </li>
        <li>
          Toman (en):{" "}
          <strong>{formatCurrency(toman, { unit: "تومان", digits: "english" })}</strong>
        </li>
        <li>
          Round-trip: <code>toRial(1000)</code> → <strong>{toPersianDigits(toRial(1000))}</strong>
        </li>
      </ul>
    </section>
  );
}

function ValidationCard() {
  const [nationalCode, setNationalCode] = useState("0010042911");
  const [mobile, setMobile] = useState("09123456789");
  const [amount, setAmount] = useState(12500);

  const codeValid = useNationalCode(nationalCode);
  const mobileValid = useMobileNumber(mobile);
  const words = useNumberWords(amount);

  return (
    <section className="card">
      <h2>Live validation &amp; words</h2>
      <label>
        کد ملی
        <input value={nationalCode} onChange={(event) => setNationalCode(event.target.value)} />
        <span className={codeValid ? "ok" : "bad"}>{codeValid ? "معتبر" : "نامعتبر"}</span>
      </label>
      <label>
        موبایل
        <input value={mobile} onChange={(event) => setMobile(event.target.value)} />
        <span className={mobileValid ? "ok" : "bad"}>{mobileValid ? "معتبر" : "نامعتبر"}</span>
      </label>
      <label>
        Number
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </label>
      <p className="words">{words}</p>
      <p>
        Normalized text: <em>{normalizePersianText("يك   تست  ميباشد")}</em>
      </p>
    </section>
  );
}

function JalaliClockCard() {
  const now = useNow(1000);
  const jalali = useJalaliDate(now, "d MMMM YYYY");
  const time = usePersianDigits(now.toLocaleTimeString("en-GB"));

  return (
    <section className="card">
      <h2>Jalali calendar</h2>
      <p className="big">{jalali}</p>
      <p className="time">{time}</p>
    </section>
  );
}

export default function App() {
  return (
    <main className="app" lang="fa" dir="rtl">
      <h1>vite-plugin-persian · React</h1>
      <p className="tagline">
        Uses <code>vite-plugin-persian/react</code>, the virtual modules, and{" "}
        <code>useJalaliDate</code> for the live clock.
      </p>
      <CurrencyCard />
      <ValidationCard />
      <JalaliClockCard />
    </main>
  );
}