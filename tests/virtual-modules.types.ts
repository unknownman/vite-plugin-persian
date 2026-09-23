/**
 * Compile-time (type-only) verification that the ambient declarations in
 * `virtual.d.ts` match the runtime virtual-module surface and the package's
 * public types. This file is not executed as a test — it is type-checked by
 * `npm run typecheck`.
 */
import type {
  CreateTextTransform,
  FormatCurrency,
  FormatJalali,
  GetMonthName,
  IsLeapJalaliYear,
  IsMobileNumber,
  IsNationalCode,
  NormalizeHalfSpaces,
  NormalizeMobileNumber,
  NormalizePersianInput,
  NormalizePersianText,
  SanitizePersianText,
  ToEnglishDigits,
  ToGregorian,
  ToJalali,
  ToNumberWords,
  ToPersianDigits,
  ToRial,
  ToToman,
} from "../src/index.js";
import {
  createJalaliModule,
  intlEngine,
  jalaaliJsEngine,
  type CalendarEngine,
  type JalaliEngine,
} from "../src/methods.js";

const jalali = {} as typeof import("virtual:persian/jalali");
const text = {} as typeof import("virtual:persian/text");
const main = {} as typeof import("virtual:persian");

// Every named Jalali export must match its public function type exactly.
const _assertFormatJalali: FormatJalali = jalali.formatJalali;
const _assertToJalali: ToJalali = jalali.toJalali;
const _assertToGregorian: ToGregorian = jalali.toGregorian;
const _assertIsLeapJalaliYear: IsLeapJalaliYear = jalali.isLeapJalaliYear;
const _assertGetMonthName: GetMonthName = jalali.getMonthName;

// Every named text export must match its public function type exactly.
const _assertToPersianDigits: ToPersianDigits = text.toPersianDigits;
const _assertToEnglishDigits: ToEnglishDigits = text.toEnglishDigits;
const _assertNormalizePersianText: NormalizePersianText = text.normalizePersianText;
const _assertToToman: ToToman = text.toToman;
const _assertToRial: ToRial = text.toRial;
const _assertFormatCurrency: FormatCurrency = text.formatCurrency;
const _assertIsNationalCode: IsNationalCode = text.isNationalCode;
const _assertIsMobileNumber: IsMobileNumber = text.isMobileNumber;
const _assertNormalizeMobileNumber: NormalizeMobileNumber = text.normalizeMobileNumber;
const _assertToNumberWords: ToNumberWords = text.toNumberWords;
const _assertSanitizePersianText: SanitizePersianText = text.sanitizePersianText;
const _assertNormalizeHalfSpaces: NormalizeHalfSpaces = text.normalizeHalfSpaces;
const _assertNormalizePersianInput: NormalizePersianInput = text.normalizePersianInput;
const _assertCreateTextTransform: CreateTextTransform = text.createTextTransform;

// The main module re-exports everything from both sub-modules.
const _mainJalali: FormatJalali = main.formatJalali;
const _mainText: ToPersianDigits = main.toPersianDigits;
const _mainNationalCode: IsNationalCode = main.isNationalCode;
const _mainWords: ToNumberWords = main.toNumberWords;
const _mainHalfSpaces: NormalizeHalfSpaces = main.normalizeHalfSpaces;
const _mainCreateTextTransform: CreateTextTransform = main.createTextTransform;

// The methods subpath exposes its engine types alongside the engines themselves.
const _calendar: CalendarEngine = intlEngine;
const _engineName: JalaliEngine = jalaaliJsEngine.id;
const _bound = createJalaliModule(intlEngine);
const _boundFormat: FormatJalali = _bound.formatJalali;

// Unused locals are guarded by `noUnusedLocals`, so keep the file a module
// and mark the assertions as used to silence the linter.
void _assertFormatJalali, _assertToJalali, _assertToGregorian, _assertIsLeapJalaliYear,
  _assertGetMonthName, _assertToPersianDigits, _assertToEnglishDigits,
  _assertNormalizePersianText, _assertToToman, _assertToRial, _assertFormatCurrency,
  _assertIsNationalCode, _assertIsMobileNumber, _assertNormalizeMobileNumber,
  _assertToNumberWords, _assertSanitizePersianText, _assertNormalizeHalfSpaces,
  _assertNormalizePersianInput, _assertCreateTextTransform, _mainJalali, _mainText,
  _mainNationalCode, _mainWords, _mainHalfSpaces, _mainCreateTextTransform,
  _calendar, _engineName, _bound, _boundFormat;

export {};