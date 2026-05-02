/**
 * Inline Turkish translations for zxcvbn-ts feedback.
 *
 * Mirrors the shape of `@zxcvbn-ts/language-en` (TranslationKeys), so the
 * library remains self-contained without depending on `language-en` or the
 * (still upstream-pending) `@zxcvbn-ts/language-tr` package.
 */
import type { TranslationKeys } from '@zxcvbn-ts/core';

export const trTranslations: TranslationKeys = {
  warnings: {
    straightRow: 'Klavyedeki ardışık tuşlar kolay tahmin edilir.',
    keyPattern: 'Kısa klavye desenleri kolay tahmin edilir.',
    simpleRepeat: '"aaa" gibi tekrar eden karakterler kolay tahmin edilir.',
    extendedRepeat:
      '"abcabcabc" gibi tekrar eden karakter desenleri kolay tahmin edilir.',
    sequences: '"abc" gibi yaygın karakter dizileri kolay tahmin edilir.',
    recentYears: 'Son yıllar kolay tahmin edilir.',
    dates: 'Tarihler kolay tahmin edilir.',
    topTen: 'Bu, en sık kullanılan parolalardan biridir.',
    topHundred: 'Bu, sık karşılaşılan bir paroladır.',
    common: 'Bu, yaygın bir paroladır.',
    similarToCommon: 'Bu, yaygın bir parolaya benziyor.',
    wordByItself: 'Tek başına kelimeler kolay tahmin edilir.',
    namesByThemselves: 'Tek başına ad veya soyadlar kolay tahmin edilir.',
    commonNames: 'Yaygın ad ve soyadlar kolay tahmin edilir.',
    userInputs:
      'Kişisel veya uygulamaya özgü bilgiler parolada kullanılmamalıdır.',
    pwned: 'Parolanız internetteki bir veri sızıntısında ifşa olmuş.',
  },
  suggestions: {
    l33t: "'a' yerine '@' gibi tahmin edilebilir harf değişimlerinden kaçının.",
    reverseWords: 'Yaygın kelimelerin tersten yazılışından kaçının.',
    allUppercase: 'Sadece bir kısmını büyük yazın, hepsini değil.',
    capitalization: 'Sadece ilk harfi değil, daha fazlasını büyük yazın.',
    dates: 'Sizinle ilişkili tarih ve yıllardan kaçının.',
    recentYears: 'Son yıllardan kaçının.',
    associatedYears: 'Sizinle ilişkili yıllardan kaçının.',
    sequences: 'Yaygın karakter dizilerinden kaçının.',
    repeated: 'Tekrar eden kelime ve karakterlerden kaçının.',
    longerKeyboardPattern:
      'Daha uzun klavye desenleri kullanın ve yazma yönünü birden fazla kez değiştirin.',
    anotherWord: 'Daha az yaygın kelimeler ekleyin.',
    useWords: 'Birden fazla kelime kullanın, ancak yaygın ifadelerden kaçının.',
    noNeed:
      'Sembol, sayı veya büyük harf kullanmadan da güçlü parolalar oluşturabilirsiniz.',
    pwned: 'Bu parolayı başka yerde de kullanıyorsanız değiştirmelisiniz.',
  },
  timeEstimation: {
    ltSecond: 'bir saniyeden az',
    second: '{base} saniye',
    seconds: '{base} saniye',
    minute: '{base} dakika',
    minutes: '{base} dakika',
    hour: '{base} saat',
    hours: '{base} saat',
    day: '{base} gün',
    days: '{base} gün',
    month: '{base} ay',
    months: '{base} ay',
    year: '{base} yıl',
    years: '{base} yıl',
    centuries: 'yüzyıllar',
  },
};
