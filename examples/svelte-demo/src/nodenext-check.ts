/**
 * NodeNext resolution check for the published `vite-plugin-persian` exports.
 *
 * Ran via `npm run verify:nodenext`. Uses Node's own `nodenext` resolution so
 * the package's `./svelte` subpath and its types resolve exactly as they will
 * for a real ESM consumer.
 */
import { readable } from "svelte/store";
import { persian } from "vite-plugin-persian";
import { useJalaliDate, useMobileNumber, useNationalCode, useNumberWords, usePersianDigits } from "vite-plugin-persian/svelte";
import { normalizeMobileNumber, toNumberWords } from "vite-plugin-persian/methods";

const plugin = persian();
const formatted = useJalaliDate(readable(new Date(2024, 2, 20)), "d MMMM YYYY");
const digits = usePersianDigits(readable("hello 123"));
const valid = useNationalCode(readable("0010042911"));
const mobile = useMobileNumber(readable(normalizeMobileNumber("+989123456789")));
const words = useNumberWords(readable(toNumberWords(12500)));

void plugin, formatted, digits, valid, mobile, words;