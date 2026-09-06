<div align="center">

# Password Intelligence

**React Native için Türkçe odaklı, kültürel farkındalığa sahip parola gücü kiti.**
*zxcvbn-ts motorunu Türkçeye özgü bir tehdit katmanıyla sarmalar.*

[![npm version](https://img.shields.io/npm/v/react-native-password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/react-native-password-intelligence)
[![npm downloads](https://img.shields.io/npm/dm/react-native-password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/react-native-password-intelligence)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-native-password-intelligence?style=flat-square&label=min%2Bgzip)](https://bundlephobia.com/package/react-native-password-intelligence)
[![CI](https://img.shields.io/github/actions/workflow/status/mobilteknolojileri/react-native-password-intelligence/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/mobilteknolojileri/react-native-password-intelligence/actions)
[![Coverage](https://img.shields.io/codecov/c/github/mobilteknolojileri/react-native-password-intelligence?style=flat-square)](https://codecov.io/gh/mobilteknolojileri/react-native-password-intelligence)
[![OpenSSF Scorecard](https://img.shields.io/ossf-scorecard/github.com/mobilteknolojileri/react-native-password-intelligence?style=flat-square&label=OpenSSF)](https://scorecard.dev/viewer/?uri=github.com/mobilteknolojileri/react-native-password-intelligence)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square)](https://reactnative.dev/)
[![React Native Directory](https://img.shields.io/badge/React%20Native%20Directory-listed-0366d6?style=flat-square)](https://reactnative.directory/package/react-native-password-intelligence)

<img src="./.github/assets/demo.png" alt="Password Intelligence demo" width="380" />

### [▶ Canlı dene](https://mobilteknolojileri.github.io/react-native-password-intelligence/)

[English](./README.md) · **Türkçe**

</div>

---

## İçindekiler

- [Neden bu paket](#neden-bu-paket)
- [Kurulum](#kurulum)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Bağlamsal zekâ](#bağlamsal-zekâ)
- [API referansı](#api-referansı)
- [Puan ölçeği](#puan-ölçeği)
- [Standartlar](#standartlar)
- [Bu paket ne değildir](#bu-paket-ne-değildir)
- [Karşılaştırma](#karşılaştırma)
- [Mühendislik detayları](#mühendislik-detayları)
- [Geçiş ve değişiklik günlüğü](#geçiş-ve-değişiklik-günlüğü)
- [Güvenlik](#güvenlik)
- [Katkıda bulunma](#katkıda-bulunma)
- [Lisans](#lisans)

---

## Neden bu paket

Standart parola ölçerler `password123`'ü zayıf sayar ama `mehmet1907`, `karakartal` veya
`askim34` gibi bölgesel kalıpları çoğunlukla kaçırır. Bu "kültürel" parolalar Türkiye kaynaklı
veri sızıntılarında en sık rastlananlar arasında — ve İngilizce bir kelime listesi onları güçlü
olarak puanlar.

Password Intelligence, sektör standardı **zxcvbn-ts** motorunu sarmalar ve üzerine Türkçeye özgü
bir zekâ katmanı ekler. Bugün yüzeysel şekilde çok dil değil, **derinlemesine tek dil (Türkçe)**
sunar; mimari gerekçesi için [Mühendislik detayları](#mühendislik-detayları) bölümüne bakın.

### Türkçe zekâ katmanı

| Kategori | Tespitler ve örnekler |
|---|---|
| Yaygın adlar | `mehmet`, `ayşe`, `fatma`, `burak`, `memo` |
| Yaygın soyadlar | `yılmaz`, `kaya`, `demir`, `çelik`, `öztürk` (TÜİK / NVİ kaynaklı 382 kayıt) |
| Futbol kültürü | Büyük kulüpler (`cimbom`, `fenerbahçe`, `beşiktaş`) ve taraftar terimleri |
| Şehir ve plaka | Plaka kodları (`34`, `06`, `27`) ve şehir adları (`istanbul34`, `ankara06`) |
| Kültürel / tarihî | `atatürk`, `1453`, `1923`, `cumhuriyet`, `türkiye` |
| Romantik / sosyal | `aşkım`, `canım`, `hayatım`, `birtanem` |
| Dinî / ideolojik | Tehdit istihbaratı kategorisi — Türkçe sızıntı derlemlerinde gözlenen terimler |
| Burçlar | `koç`, `aslan`, `başak`, `akrep`, `oğlak` |
| Markalar | `turkcell`, `akbank`, `trendyol`, `migros`, `getir` |
| Klavye yürüyüşleri | `qweasd`, `asdfgh`, `qazwsx`, `1qaz2wsx` — artı 6 klavye düzeni için spatial eşleştirme |
| Yaygın parolalar | `şifre`, `parola`, `admin`, `qwerty`, `123456` |

877 kaynak terim; her biri normalize, birleştirilmiş ve ASCII'ye indirgenmiş varyantlara
genişletilerek **~1.260 kayıt** üretir. Yani `yılmaz` kadar `yilmaz` da yakalanır.

Türkçe klavyede yazılan `İSTANBUL34` da, tamamı büyük `ŞANLIURFA` da yakalanır: zxcvbn içeride
Unicode varsayılan küçültmesi uyguladığı için `İ` (U+0130) `i` + birleşik nokta hâline gelir,
ASCII `I` ise `ı` yerine `i` olur (`şanliurfa` ne `şanlıurfa` ne de `sanliurfa` girdisiyle
eşleşir). Yalnızca bu girdiler için ASCII'ye indirgenmiş ikinci bir geçiş yapılır — parolanın
büyük/küçük harf profili bozulmadan. Özel sözlük kelimeleri ve `userInputs` da aynı
indirgemeden geçer.

---

## Kurulum

| Ne geliştiriyorsunuz | Kurulacak paket |
|---|---|
| React Native / Expo uygulaması | `react-native-password-intelligence` |
| Node backend, Next.js, düz React, CLI | [`password-intelligence`](https://www.npmjs.com/package/password-intelligence) (react/react-native bağımlılığı yok) |

```sh
yarn add react-native-password-intelligence
# veya
npm install react-native-password-intelligence
```

İkisi de aynı motoru içerir; React Native paketi, `usePasswordRisk` ve `<PasswordMeter />`
ekleyen ve çekirdeğin tüm API yüzeyini yeniden dışa aktaran ince bir sarmalayıcıdır.

**Peer gereksinimleri**

- React `>=18.0.0`
- React Native `>=0.74.0`
- Node (geliştirme için) `>=18`

`@zxcvbn-ts/core` otomatik gelir. **Yerel (native) kod veya Expo eklentisi gerekmez.**

---

## Hızlı Başlangıç

### 1. Animasyonlu arayüz bileşeni

```tsx
import { PasswordMeter } from 'react-native-password-intelligence';

<PasswordMeter password={password} />;
```

### 2. Başsız (headless) hook

```ts
import { usePasswordRisk } from 'react-native-password-intelligence';

const { score, crackTimeDisplay, feedback } = usePasswordRisk(password);
```

### 3. Saf analiz (React'sız)

```ts
import { analyzePassword } from 'react-native-password-intelligence';

const sonuc = analyzePassword('galatasaray1905');
console.log(sonuc.score); // 0 | 1 | 2 | 3 | 4
console.log(sonuc.feedback.warning);
// "Futbol takımı adları ve taraftar terimleri kolay tahmin edilir."
```

---

## Bağlamsal Zekâ

### Çağrı başına kullanıcı girdileri

Kullanıcıya özgü değerleri (ad, e-posta, kullanıcı adı) geçin ki parolada geçtiklerinde
cezalandırılsınlar.

```ts
// Hook
const { score } = usePasswordRisk(password, [
  user.firstName,
  user.lastName,
  user.email,
]);

// Saf fonksiyon
analyzePassword('mehmetyilmaz1907', ['Mehmet', 'Yılmaz']);

// Bileşen
<PasswordMeter password={password} userInputs={[user.firstName, user.email]} />;
```

### Global özel sözlük

Marka adlarını veya kurum genelinde yasaklı kelimeleri uygulama açılışında bir kez enjekte edin.
Liste tekilleştirilir ve 10.000 kayıtla sınırlıdır.

```ts
import {
  addCustomDictionary,
  clearCustomDictionary,
} from 'react-native-password-intelligence';

// Uygulama giriş noktası
addCustomDictionary(['Acme', 'AcmeCorp', 'AcmePay']);

// Testler / çok kiracılı SSR
clearCustomDictionary();
```

Kayıtlar her tuş vuruşunda yeniden işlenmez; gerçek bir zxcvbn sözlüğü olarak bir kez kaydedilir.

---

## API Referansı

### `analyzePassword(password, userInputs?)`

Saf fonksiyon. zxcvbn'i ilk çağrıda kurar (~38 ms), sonraki çağrılarda senkrondur.

```ts
analyzePassword(
  password: string,
  userInputs?: readonly (string | number)[]
): ZxcvbnResult
```

| Alan | Tip | Notlar |
|---|---|---|
| `password` | `string` | String olmayan değerler `''`e dönüştürülür. Girdi NFC'ye normalize edilir ve 256 karakterden sonrası kırpılır. |
| `userInputs` | `readonly (string \| number)[]` | İsteğe bağlı. Kullanıcıya özgü değerler; Türkçe, birleşik ve ASCII biçimleriyle eşleştirilir. |

`score`, `feedback`, `crackTimesDisplay`, `crackTimesSeconds`, `guesses`, `sequence` alanlarını
içeren tam `ZxcvbnResult` döner.

### `usePasswordRisk(password, userInputs?)`

React hook'u. **Referansa göre değil, değere göre** memoize edilir; satır içi dizi geçmek sonsuz
yeniden render'a yol açmaz. Motor yapılandırmasına da abonedir: ilk render'dan sonra gelen bir
`configure()` veya `addCustomDictionary()` çağrısı ekrandaki parolayı yeniden analiz eder, bayat
bir puan bırakmaz.

```ts
usePasswordRisk(password, userInputs?): {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: { warning: string | null; suggestions: string[] };
  crackTimeDisplay: string;
  raw: ZxcvbnResult;
}
```

### `<PasswordMeter />`

Animasyonlu 4 kademeli ilerleme çubuğu. İki prop varyantı: ya `password` (otomatik analiz) ya da
`score` (önceden hesaplanmış). İkisini de vermemek TypeScript hatasıdır. `score` varyantı
analizörü tamamen atlar; skoru zaten elinde olan (örneğin sunucudan gelen) tüketiciler hiçbir
kurulum maliyeti ödemez.

```ts
type PasswordMeterProps =
  | { password: string; userInputs?: readonly (string | number)[]; score?: never }
  | { score: 0 | 1 | 2 | 3 | 4; password?: never; userInputs?: never };
// ayrıca isteğe bağlı `style?: StyleProp<ViewStyle>` ve `barHeight?: number` (varsayılan 6)
```

### `configure(config)`

Sözlükleri, klavye grafiklerini, çevirileri veya sınırları değiştirir. **Her an çağrılabilir** —
ilk analizden sonra bile. Seçenekler bir sonraki çağrıda tembel şekilde uygulanır, dolayısıyla
"önce şunu çağır" tuzağı yoktur ve `analyzePassword` senkron kalır.

```ts
import { configure } from 'react-native-password-intelligence';

// Tam 49.233 kayıtlık İngilizce listeyi geri yükle (bundle'a ~229 kB gzip ekler)
const { dictionary, adjacencyGraphs } = await import('@zxcvbn-ts/language-common');
configure({ dictionaries: dictionary, graphs: adjacencyGraphs });
```

| Seçenek | Amaç |
|---|---|
| `dictionaries` | Ek zxcvbn sözlükleri; gömülü olanların üzerine anahtar bazında birleşir |
| `graphs` | Ek klavye komşuluk grafikleri; gömülü olanların üzerine düzen düzen birleştirilir |
| `translations` | Gömülü Türkçe geri bildirim metinlerini değiştirir; Türkçe kategori uyarılarını da çevirmek için `dictionaryWarnings` haritası ekleyin (eklenmezse bu eşleşmeler dil karıştırmak yerine `warning: null` döner) |
| `disableTurkishDictionaries` | Yalnızca İngilizce listeyi kullan |
| `disableBundledPasswords` | Yalnızca Türkçe kategorileri kullan |
| `maxLength` | Kırpmadan önce analiz edilen karakter sayısı (varsayılan 256, `@zxcvbn-ts/core` ile aynı) |
| `useLevenshteinDistance`, `levenshteinThreshold` | zxcvbn'e aktarılır |

`configure()` seçenekleri senkron doğrular; geçersiz bir seçenekte (`maxLength` pozitif tam sayı
olmalı, `translations` tüm zxcvbn anahtarlarını içermeli, sözlükler dizi olmalı…) mevcut
yapılandırmaya dokunmadan `TypeError` / `RangeError` fırlatır.

### `resetConfiguration()`

`configure()` ile ayarlanan her şeyi geri alır. Özel sözlüğü **bilinçli olarak temizlemez** — o
`clearCustomDictionary()`'nin işidir.

### `subscribeToConfiguration(listener)` / `getConfigurationVersion()`

Modül-global motor durumu (`configure`, `resetConfiguration`, `addCustomDictionary`,
`clearCustomDictionary`) için değişiklik bildirimi. `usePasswordRisk` bunları içeride kullanır;
yalnızca `analyzePassword` sonuçlarını kendiniz önbelleğe alıyorsanız gerekir.

```ts
subscribeToConfiguration(listener: () => void): () => void; // aboneliği kaldıran fonksiyonu döner
getConfigurationVersion(): number; // tekdüze artan sayaç
```

### `addCustomDictionary(words)` / `clearCustomDictionary()`

```ts
addCustomDictionary(words: readonly string[]): void
clearCustomDictionary(): void
```

`addCustomDictionary` idempotenttir; kayıtlar bir `Set` ile tekilleştirilir. 10.000 sınırını aşan
ekleme reddedilir ve bir `console.warn` yayınlanır.

---

## Puan ölçeği

Ölçek zxcvbn-ts'in 0–4 bandıdır; karakter kompozisyon kurallarına değil, **tahmini deneme
sayısına** dayanır.

| Puan | Etiket | Renk | UX anlamı |
|:---:|:---|:---|:---|
| 0 | Çok Zayıf | Kırmızı `#ef4444` | Kolayca tahmin edilir |
| 1 | Zayıf | Turuncu `#f97316` | Yaygın kalıp tespit edildi |
| 2 | Orta | Sarı `#eab308` | Temel koruma |
| 3 | İyi | Yeşilimsi `#84cc16` | Çevrimdışı tahmine direnç gösterir |
| 4 | Güçlü | Yeşil `#22c55e` | Sağlam ve kalıpsız |

---

## Standartlar

NIST SP 800-63B-4 §3.1.1.2 *Password Verifiers*
([HTML](https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver) ·
[DOI](https://doi.org/10.6028/NIST.SP.800-63b-4)), doğrulayıcıların parolayı *"bilinen yaygın,
beklenen veya ele geçirilmiş parolaları içeren bir engelleme listesiyle"* karşılaştırmasını zorunlu
kılar. **Sözlük kelimeleri** ile **hizmet adı, kullanıcı adı ve bunların türevleri gibi bağlama
özgü kelimeler** o listede *örnek* olarak geçer — standardın ifadesi *"For example, the list may
include…"*, yani zorunlu bir küme değil. Doğrulayıcılar ayrıca *"aboneye güçlü bir parola seçmesinde
rehberlik sunmakla"* yükümlüdür.

O maddedeki bir cümle, bu tür bir kütüphane için geri kalanının hepsinden önemli:

> *"Karşılaştırmaya parolanın tamamı tabi tutulmalıdır; içinde geçebilecek alt diziler veya
> kelimeler değil."*

zxcvbn, tasarımı gereği bir alt dizi ve örüntü eşleştiricisidir — §3.1.1.2'nin tarif ettiği
"parolanın tamamının listede olup olmadığı" testinin tam tersi. Bu yüzden ne aldığınız konusunda
net olalım:

| §3.1.1.2 ne istiyor | Bu kütüphane |
|---|---|
| Parolanın tamamının engelleme listesiyle karşılaştırılması | **Bunu yapmaz.** Hiçbir istemci tarafı puanlayıcı yapamaz. Sunucuda yapın; buradaki derlemler ona makul bir girdidir. |
| Bağlama özgü kelimeler (kullanıcı adı, hizmet adı, türevleri) | Çağrı başına `userInputs`, global `addCustomDictionary` — engelleme listesi olarak değil, puanlama sinyali olarak |
| Aboneye rehberlik | Türkçe `feedback.warning` ve `feedback.suggestions` |

**Bu, sizi uyumlu hâle getirmez.** 800-63B bu kontrolü *doğrulayıcıya* (sunucuya) yükler; bu
kütüphane istemci tarafında çalışır ve yalnızca puan döner, hiçbir şeyi reddetmez. Zorlama sunucu
tarafında yapılmalıdır.

§3.1.1.2'nin 5. maddesi şunu da söyler: *"Doğrulayıcılar ve CSP'ler parolalar için başka
kompozisyon kuralları (örneğin farklı karakter türlerinin karışımını zorunlu kılmak)
dayatmamalıdır"* (§3.1.1.1 aynı şeyi *"parolalar için başka kompozisyon gereksinimleri
dayatılmamalıdır"* diye ifade eder) — yani bu puanın üzerine karakter sınıfı kuralları eklemeyin.

---

## Bu paket ne değildir

- **Parola yöneticisi değildir** — parola saklamaz, iletmez, senkronize etmez.
- **Hash fonksiyonu değildir** — hash üretmez ve doğrulamaz. Saklama için
  [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
  sıralamasına uyun: **Argon2id** ([RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html) — bu
  belge standards-track değil, IRTF/CFRG Informational'dır) veya scrypt; FIPS-140 doğrulaması
  gerekiyorsa PBKDF2; bcrypt yalnızca eski sistemler için.
- **Parola üreticisi değildir** — CSPRNG tabanlı bir üretici kullanın.
- **Sunucu tarafı doğrulayıcı değildir** — puan bir UX ipucudur, yetkilendirme kapısı değil.

---

## Karşılaştırma

| | bu kütüphane | `@zxcvbn-ts/core` + [`language-tr`](https://www.npmjs.com/package/@zxcvbn-ts/language-tr) | `zxcvbn` (Dropbox) | `react-native-password-strength-meter` |
|---|:---:|:---:|:---:|:---:|
| Tahmin sayısına dayalı puanlama | ✅ | ✅ | ✅ | ❌ karakter sınıfı sezgiseli |
| Türkçe isimler, şehirler, büyük kulüpler | ✅ | ✅ | ❌ | ❌ |
| ASCII'ye indirgenmiş varyantlar (`fenerbahce`, `ataturk`, `yilmaz`) | ✅ | ❌ | ❌ | ❌ |
| Plaka kodları, kulüp lakapları (`cimbom`), marka derlemi | ✅ | ❌ | ❌ | ❌ |
| Türkçe yerel ayarlı durum onarımı (`İ` / `I`) | ✅ | ❌ | ❌ | ❌ |
| Türkçe geri bildirim metinleri | ✅ | ✅ | ❌ | ❌ |
| React Native arayüz bileşeni | ✅ | ❌ | ❌ | ✅ |
| Başsız React hook'u | ✅ | ❌ | ❌ | ❌ |
| Çağrı başına kullanıcı girdileri | ✅ | ✅ | ✅ | ❌ |
| Global özel sözlük API'si | ✅ | ⚠️ constructor seçenekleriyle | ❌ | ❌ |
| Framework'süz çekirdek paket | ✅ | ✅ | ✅ | ❌ |
| npm provenance ile yayın | ✅ | ❌ | ❌ | ❌ |
| Türkçe + yaygın parola paketi | **~37 kB gzip** | ~400 kB gzip | ~400 kB gzip | yok |
| Son sürüm | — | 2026-08 | **2017-02** | **2020-11** |

İki satır, onay işareti yerine dipnot hak ediyor.

**`@zxcvbn-ts/language-tr`'yi biz yazdık** ([PR #315](https://github.com/zxcvbn-ts/zxcvbn/pull/315)),
yani yukarıdaki Türkçe satırlar bir rakibin arayı kapatması değil, aynı yazarın upstream işi. O
paket zxcvbn'e 30.000 Türkçe frekans kelimesi, 10.000 Wikipedia başlığı, 1.794 ad, 198 soyad ve
Türkçe geri bildirim metinleri kazandırıyor. Bilinçli olarak yapmadığı şey ise `fenerbahçe`'yi
`fenerbahce`'ye katlamak, `cimbom`'un Galatasaray, `34`'ün İstanbul demek olduğunu bilmek veya bir
marka derlemi taşımak. Bu kütüphane onun üzerindeki katman — ve tam yaygın parola listesi yerine
4.000 kayıtlık bir dilim gömdüğü için ~400 kB değil ~37 kB tutuyor.

**"Uzun girdi DoS koruması" diye bir satır yok**, çünkü o iddianın dürüst hâli bir özellik
karşılaştırması olamayacak kadar dar: `@zxcvbn-ts/core`'da v2.2.1'den beri `maxLength` seçeneği var
(varsayılanı **256**, yani bizimkinden sıkı). Bu kütüphanenin ne yaptığı ve nedeni için
[Mühendislik detayları](#mühendislik-detayları) altındaki *Uzun girdi güvenliği* maddesine bakın.

---

## Mühendislik detayları

- **~37 kB gzip, 236 kB değil** — tam 49.233 kayıtlık `@zxcvbn-ts/language-common` (229 kB gzip)
  yerine frekans sıralı ilk 4.000 parola gömülür. (`scripts/check-size.mjs` ile ESM çıktısı
  üzerinden ölçülür; `@zxcvbn-ts/core` her hâlükârda ~20 kB ekler.) `configure()` istediğinizde tam kapsamı geri
  yükler. Not: bu bağımlılık eskiden kök giriş zincirinde statik bir import'tu, dolayısıyla
  `sideEffects: false` onu kaldıramıyordu — *çağrıyı* ertelemek *import*'u ertelemez, ve Metro
  zaten tree-shaking yapmaz.
- **Hedefli Türkçe durum onarımı** — parola *yazıldığı gibi* puanlanır, böylece büyük harf
  entropisi ve zxcvbn'in `capitalization` önerisi korunur. Unicode varsayılan küçültmesi iki yerde
  eşleşmeyi bozar: noktalı `İ` (`i` + U+0307 olur) ve başka bir Türkçe harfin yanındaki ASCII `I`
  (`ŞANLIURFA` → `şanliurfa`). Yalnızca böyle girdiler ASCII'ye indirgenmiş ikinci bir geçişten
  geçer; düşük puan kazanır ve `result.password` girdinin NFC'ye normalize edilmiş hâlini yansıtır.
- **Uzun girdi güvenliği** — 256 karakterden uzun parolalar zxcvbn'e ulaşmadan kırpılır. Bu
  gereksiz bir tekrar değil, yük taşıyan bir koruma: `@zxcvbn-ts/core` v3'ün kendi `maxLength`'i
  var ama onu yalnızca `zxcvbnAsync` içinde uyguluyor, dolayısıyla bu kütüphanenin çağırdığı
  senkron `zxcvbn()` ham diziyi alıyor. Sınır en kötü durumu bağlar, uzun girdiyi ucuzlatmaz —
  uzunluğun gerçek maliyeti için [Performans notları](#performans-notları)na bakın.
- **Varsayılan Türkçe geri bildirim** — uyarı ve öneri metinleri Türkçe döner. Türkçe sözlük
  eşleşmeleri kategori bazlı açıklama üretir: futbol takımı, şehir, marka, burç, sevgi sözcüğü…
  zxcvbn'in kendi kuralıyla: puanı 3 veya 4 olan bir parola için asla uyarı üretilmez.
- **Endüstriyel test seti** — 230+ test, %85 satır / %80 fonksiyon / %75 dal eşiğiyle korunuyor.
  30 girdilik puan regresyon anlık görüntüsü, sözlük veya puanlama güncellemelerinde kazara
  kaymaya karşı bekçilik eder. CI ayrıca gzip bütçesini ve yayınlanan tarball içeriğini denetler.
- **Katı TypeScript** — `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `isolatedModules`,
  `useDefineForClassFields`.
- **Sıfır yerel kod** — saf JavaScript; Expo, iOS, Android ve Web'de çalışır.
- **Bugün tek dil** — mimari, eklenti sistemi değil, derinlemesine tek bir Türkçe sözlük üzerine
  kurulu. `configure({ dictionaries })` zaten çalışma zamanında herhangi bir dilin derlemini
  eklemenize izin veriyor; birinci sınıf bir locale eklenti soyutlaması 1.0.0 yol haritasında.

### Performans notları

zxcvbn'in eşleştirme maliyeti girdi uzunluğuyla dik biçimde artar ve diğer her şeyi gölgede bırakır.
Her uzunluk için 10 farklı rastgele girdinin medyanı, ısınmış, masaüstünde Node 22, varsayılan
`maxLength` 256 ile:

| Uzunluk | 8 | 16 | 32 | 64 | 128 | 256 ve üzeri |
|---|---|---|---|---|---|---|
| Medyan | 0,4 ms | 2,7 ms | 82 ms | 190 ms | 409 ms | ~890 ms |

Son sütun düz, çünkü `maxLength` sonrası kırpılıyor — 4.096 karakterlik bir yapıştırma 256
karakterlik biriyle aynı maliyette. Sınırı yükseltmek bu tavanı kaldırır: aynı ölçüm
`maxLength: 1024` ile çağrı başına **6,6 sn** çıkmıştı, varsayılanın orada durmamasının sebebi bu.

- **Bunu hesaba katın.** Parola yöneticisinden gelen 64 karakterlik bir parola masaüstünde çağrı
  başına ~190 ms, orta seviye bir Android'de birkaç katı tutar. `usePasswordRisk` senkrondur ve
  debounce **yapmaz**, dolayısıyla bu maliyet her tuş vuruşunda ödenir. Formunuz uzun parola kabul
  ediyorsa değeri iletmeden önce debounce edin; opsiyonel bir `debounceMs` 1.0.0 yol haritasında.
- Temiz bir süreçte ilk `analyzePassword` çağrısı: ~38 ms (zxcvbn seçenek kaydı + sözlük oluşturma).
- `configure()` sonrası seçeneklerin yeniden uygulanması: gömülü sözlükler için ~1 ms, tam
  `language-common` seti için ~15 ms.
- Türkçe durum onarımının ikinci geçişi, onu tetikleyen girdilerin maliyetini kabaca ikiye katlar;
  bu girdiler nadirdir — saf ASCII girdi hiçbir zaman tetiklemez.
- Sözlük ayak izi: 12 Türkçe kategori (~5 kB gzip) + 4.000 yaygın parola (~17 kB gzip) +
  6 klavye düzeni (~3 kB gzip).
- Hook, `(password, userInputs)` ikilisinin JSON'a çevrilmiş değerine göre memoize eder.

---

## Geçiş ve değişiklik günlüğü

Yükseltme notları — 0.3.x → 0.4.0 puan kayması denetimi ve tam sözlüğün nasıl geri yükleneceği
dâhil — [CHANGELOG.md](./CHANGELOG.md) dosyasında. Mimari gerekçe
[ARCHITECTURE.md](./ARCHITECTURE.md) dosyasında.

## Güvenlik

Bildirim süreci ve desteklenen sürümler: [SECURITY.md](./SECURITY.md). Güvenlik açıklarını lütfen
herkese açık issue olarak değil,
[özel güvenlik danışmanlığı](https://github.com/mobilteknolojileri/react-native-password-intelligence/security/advisories/new)
üzerinden bildirin.

## Katkıda bulunma

Yeni sözlük kayıtları, soyadı listesi güncellemeleri veya hata düzeltmeleri için katkılar
memnuniyetle karşılanır — bkz. [CONTRIBUTING.md](./CONTRIBUTING.md). Depo genelindeki commit
disiplini için bkz. [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md).

Sorularınız için [Discussions](https://github.com/mobilteknolojileri/react-native-password-intelligence/discussions)
bölümünü kullanabilirsiniz.

## Yol haritası

1.0.0 hedefleri ve kapsam dışı bırakılanlar: [ROADMAP.md](./ROADMAP.md).

## Lisans

MIT © mobilteknolojileri
