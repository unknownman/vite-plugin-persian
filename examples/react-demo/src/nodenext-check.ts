/**
 * NodeNext resolution check for the published `vite-plugin-persian` exports.
 *
 * Ran via `npm run verify:nodenext`. This file intentionally uses Node's own
 * `nodenext` resolution (not Vite's bundled resolver) so that the package's
 * real `exports` map — including the `./react` subpath types — is exercised
 * exactly as an ESM consumer would see it.
 */
import { persian } from "vite-plugin-persian";
import { useJalaliDate, useMobileNumber, useNationalCode, useNumberWords } from "vite-plugin-persian/react";
import { isNationalCode, normalizeMobileNumber, toNumberWords } from "vite-plugin-persian/methods";

const plugin = persian();
const formatted = useJalaliDate(new Date(2024, 2, 20), "d MMMM YYYY");
const valid = useNationalCode("0010042911") && isNationalCode("0010042911");
const mobile = useMobileNumber("09123456789") && normalizeMobileNumber("+989123456789");
const words = useNumberWords(toNumberWords(12500));

void plugin, formatted, valid, mobile, words;