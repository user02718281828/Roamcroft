# 1.14.0-alpha.3 — kontrollü kalite kurtarma yayını

30 Ekim 2026: kullanıcı `codex/quality-recovery` / `413d0a4` paketinin
güncel main'e birleşimi, normal push ve Cloudflare yayınına açık onay verdi.
Önceki çalışan sürüm alpha.2/main
`914bde9360078576eee0a51bf70295e4de3f45b7`; geri alma gerekirse yalnız
uygulama/source için normal ileri revert değerlendirilir. Veri/şema rollback,
force push, reset, D1/DO sıfırlama veya eski domain yönlendirmesi yapılmaz.

## Git ve koruma sınırı

Fetch sonrası origin/main hâlâ914bde9. Alpha.3 checkpoint'inde eski mobil
HUD f3da7f6, How to Play scroll07760aa, belge804780b, CPU/orman3130162,
GPU/rüzgâr0eeb521 ve son HUD81b79f4 ataları doğrulandı. Main fast-forward;
eksik kaynak/cherry-pick veya çatışma yok. Kullanıcıya ait `tatus -sb` korunur.

Alpha.2'ye göre model/save/world/server/coop/worker/DB/dağıtım ayarlarında
değişiklik yok. Package/lock yalnız alpha.2→alpha.3 uygulama sürümüdür;
bağımlılıklar güncellenmedi. D1/DO sahipliği/verileri, eski origin,
Sentry/CSP, SAVE_VERSION=1 ve kayıt anahtarları korunur.

Oyun kodu ve tarayıcı kabulü:
[kalite doğrulaması](verification-quality-recovery-alpha.3.md),
[ham performans ölçümleri](quality-recovery-measurements.json).
Fiziksel Android FPS/ısı/uzun oturum, yeni HUD gerçek cihaz kabulü, iOS/PWA
ve gerçek WAN hâlâ eksik; yayın onayı bunları başarılı saymaz.

## Son yayın turu

Main üzerinde Node22.13.0/npm10.9.2 ile temiz `npm ci`, typecheck,
239/239 test (0 hata/atlanan,19.17s), build, i18n1436 anahtar/parametre ve
`check:runtime` çıkış0. Statik2.959.920 bayt, bütçe3.000.000 korunur.
HTTP/CSP/nonce/CORS/SW, dört WS50–300ms/kayıp/replay/reconnect,
Worker restart/kimlik/çanta, atomik stok/sahiplik, dış D1 revision koruması,
soğuk D1 yazma ve ortak uyku/tek şafak geçti. Testler yerel geçici DB'dedir.
Kurulumdaki20 audit bulgusu (0 kritik/8 yüksek/11 orta/1 düşük) önceki
bilinen durumdur; güvenlik kapsamı veya bağımlılıklar değiştirilmedi.
Loglar `work/alpha3-release-{ci,typecheck,tests,build,runtime}.log`.

Son turdan sonra yalnız yayın belgeleri değişti; oyun kodu413d0a4 ile aynıdır.
Push sonrası esas kanıt ilgili main SHA'nın GitHub verify/Workers Builds
check'leri ve canlı HTTP/tarayıcı kabulüdür. CI veya canlı başarı bu push
öncesi belgeyle varsayılmaz. Yeni özellik/üretim test çiftliği yoktur.

## Canlı sonuç — başarılı

Normal main push: `f1fb42520b0d955e3fd12341b675bc9e43d49b03`.
[GitHub verify 41076380875](https://github.com/user02718281828/Roamcroft/actions/runs/41076380875)
ve Workers Builds `288f597f-0bac-4e00-ae63-333fc9179b9a` success;
ikisi de aynı main SHA'ya bağlıdır. CI temiz kurulum/typecheck/test/build ve
yerel dört WS/runtime adımlarının tümünü geçti.

`https://roamcroft.com` ve eski Worker origin HTTP200/1.14.0-alpha.3;
WWW301/root, canonical/robots/sitemap/rehber/manifest/SW, marka hash'leri,
güvenlik başlıkları ve istek başına yeni script nonce doğrulandı.
İki originde çerezsiz WS401; üretim oturumu/oda/veritabanı testi oluşturulmadı.
Canlı scene-_SX1lMoM.js HTTP200, forestActors/rabbit/bird/canopy içeriyor.
Salt okunur log `work/alpha3-live-acceptance.log`; sistem DNS/TLS değiştirilmedi.

Gerçek tarayıcıda launcher alpha.3 gösterdi; var olan cihaz kaydıyla 3D
sahne844×390 açıldı, yeni sade HUD/dokuz yuva görüldü. Çanta açılışı/X
kapanışı ve gerçek kayıt ACK'siyle başlangıca dönüş başarılı. Görseller
`screenshots/release-alpha3-live-{game,start}.jpg`. Bu kontrol fiziksel
Android veya yetkili WAN dört oyuncu testi değildir; bunların açık durumu sürer.

Bu sonuç belgesi, yayımlanmış main'den ilerleyen `codex/quality-recovery`
dalında yalnız yerel belge checkpoint'idir. Yeni push/deploy yapılmaz;
main/origin/main ve canlı uygulama yukarıdaki f1fb425'te korunur.
