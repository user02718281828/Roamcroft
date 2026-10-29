# World3 — izole biyom örnekleyicisi / PROTOTİP

Taban envanter dilimi `19f9ba3`; üretim dünyasına uygulanmadı. Gerçek oyun
`world.ts` generation2, eski seed/edits/kayıtlar ve sunucu aynen durur.

`lib/experiments/world3.ts`: dünya koordinatından deterministik çok ölçekli
yükseklik/nem, göl/nehir/çayır/orman/bataklık/yüksek alan, değişken ağaç
yoğunluğu ve nadir harabe işareti. Orman/harabe ekonomik nesne veya ödül
değildir. Bu hidrografi, geçilebilir spawn, maden, biyom ödülü veya gerçek
Three.js dünyası değildir; algoritma/keşif prototipidir.

Yerel araç: `node --experimental-strip-types scripts/preview-world3.mjs` →
localhost8948. Seed ve yön düğmeleriyle96×96 pencere gezilir; kareye tıklama
dünya koordinatı/yükseklik/nem verir. Hiçbir oyun kaydı, API/WS/DB istemcisi,
oturum veya service worker yoktur. Çıktı `work/world3` altındadır; sunucu yalnız
127.0.0.1 dinler. Ekran: `screenshots/world3-isolated-prototype.jpg`.

## Ölçülen doğrulama

Kilitli `npm ci` başarılı:584 paket/585 tarama, bağımlılık veya lock değişmedi.
Audit hâlâ25:3 kritik/11 yüksek/10 orta/1 düşük; düzeltme yapılmadı.
Node22.13.0/npm10.9.2 ile typecheck, **225/225 test**, build geçti. Üç yeni
test seed/sıra bağımsızlığı, negatif koordinat/chunk sınırlarında süreklilik,
en az5 biyom ve sınır doğrulamasını kapsar. Prototip üretim bundle'ında yok;
üretim boyutu yaklaşık2.95MB,3MB bütçe değişmedi. Son üretim runtime'ı
`19f9ba3` koduyla geçti; bu paket sunucu/oyun kodu değiştirmedi.

Tek yerel Node mikro ölçümü:100,000 örnek14.87ms; checksum51619.01476958675.
Tekrar: `node --experimental-strip-types scripts/preview-world3.mjs --benchmark`.
Tarayıcıda seed7821→12345 ve batıya negatif koordinat gezintisi çalıştı;
ilk96×96 örnek/çizim14.2ms, ısınmış örneklerde3.8–6.6ms gözlendi.
Bu FPS/GPU/mobil/WAN/oyun motoru performansı veya garanti değildir.

## Entegrasyondan önce

**PLANLANDI:** gerçek kamera/3D arazi/çarpışma, spawn geçilebilirliği, kaynak
ekonomisi, dünya generation sürümü/opt-in yeni çiftlik yolu ve kayıt geçiş
değerlendirmesi. Eski dünyalara sessizce uygulanmaz. Çok günlük simülasyon,
hayvan/ödül ve bölgesel online otorite bu prototipe eklenmedi. Üretim
şeması/protokol göçü ayrı kullanıcı onayı ister.
