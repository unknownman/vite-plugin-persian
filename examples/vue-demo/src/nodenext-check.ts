/**
 * NodeNext resolution check for the published `vite-plugin-persian` exports.
 *
 * Ran via `npm run verify:nodenext`. Uses Node's own `nodenext` resolution so
 * the package's `./vue` subpath and its types resolve exactly as they will
 * for a real ESM consumer.
 */
import { persian } from "vite-plugin-persian";
import { useJalaliDate, useMobileNumber, useNationalCode, useNumberWords } from "vite-plugin-persian/vue";
import { normalizeMobileNumber, toNumberWords } from "vite-plugin-persian/methods";

const plugin = persian();
const formatted = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY");
const valid = useNationalCode("0010042911");
const mobile = useMobileNumber(normalizeMobileNumber("+989123456789"));
const words = useNumberWords(toNumberWords(12500));

void plugin, formatted, valid, mobile, words;