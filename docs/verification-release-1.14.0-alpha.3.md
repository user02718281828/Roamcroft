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
