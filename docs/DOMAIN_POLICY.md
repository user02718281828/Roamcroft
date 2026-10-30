# Roamcroft — tek herkese açık adres / eski origin kurtarma

30 Ekim 2026 son kullanıcı kararı: tek oyun adresi **https://roamcroft.com**.
Kullanıcı Cloudflare Dashboard'da workers.dev Production ve Preview adreslerini
kapattığını bildirdi. www→root301 ve mevcut custom domain korunur. Adres kapatma, eski
oyuncu verisinin silindiği veya yeni origin'e taşındığı anlamına gelmez.

**Canlı kapanış DOĞRULANAMADI:** 30 Ekim15:16 UTC (18:16 İstanbul) salt okunur
iki önbelleksiz istekte eski Production URL'si HTTP200/alpha.3 döndü;
yanıtlar private,no-store ve farklı CSP nonce'ları taşıdı. Bu, kapanmış bir
uç veya yalnız yerel service-worker önbelleği olarak raporlanamaz. Root200,
www301→root korunuyor. Preview için kesin canlı URL/ayar bağımsız olarak
okunamadı. Yerel commit bu fiilî canlı durumu değiştirmez; push/deploy yoktur.
Dashboard çelişkisi ayrıca çözülmelidir. Loglar
`work/domain-policy-{live-readonly,legacy-recheck}.log`.

## Gerçek dağıtım zinciri

- Kaynak `deployment.config.json`: `workers_dev:false`, `preview_urls:false`.
- `vite.config.ts` bu iki değeri Cloudflare eklentisinin inline girdisine verir.
  Depoda ayrı root wrangler.toml/json/jsonc veya tanımlı named environment yok.
  rsc/ssr Vite ortamları aynı Worker build'inin parçalarıdır; ayrı public Worker
  environment'ı değildir. Üretilen redirect'in auxiliaryWorkers listesi boştur.
- `npm run build`: Vinext/Vite → `scripts/finalize-build.mjs` → bütçe kontrolü.
  Finalizer `applyWorkerAddressPolicy` ile açıkça false olmayan kaynak politikayı
  reddeder; hedefte ve varsa env bloklarında iki değeri false yazar.
- Gerçek hedef `dist/server/wrangler.json`, giriş `secure-entry.mjs`.
  `npm run deploy` açıkça bu dosyayı kullanır. Cloudflare Vite'ın
  `.wrangler/deploy/config.json` redirect'i de aynı dosyayı işaret eder;
  normal config keşfi bu çıktıya yönelir. Dist/redirect dosyalarını elle düzeltme.
- `.github/workflows/check.yml` kurulum/typecheck/test/build/runtime yürütür;
  deploy adımı yoktur. Main push dış Cloudflare Workers Builds'i tetikler.
  Canlı alpha.3/f1fb425'in bu entegrasyonu önceki yayın kaydında doğrulanmıştır.
- Bu oturumda Dashboard ayrıntıları yeniden okunamadı: Computer Use, Chrome
  URL'sini güvenle belirleyemediği için durdu; Wrangler CLI da oturum açmış değil.
  Dashboard'ın tam build/deploy komutu ve non-main politikası bağımsız olarak
  teyit edilmedi. Yukarıdaki repo/çıktı zinciri yerelden doğrulanır. Alternatif
  `--config`, farklı Worker/env veya bu build'i atlayan bir komut otomatik olarak
  kapsanmış sayılmaz; sonraki onaylı yayın öncesi bu hedefle eşleştirilmelidir.

Custom domain/route tanımı eklenmez veya devralınmaz; mevcut Dashboard yönetimi
korunur. Worker adı, D1 kimliği/binding, DO binding/migration, varlık yolu,
Sentry/CSP ve www/DNS değişmez. Yeni version numarası, DB migration, veri işlemi,
push veya deploy yoktur. Sonraki onaylı normal dağıtım, bu commit'i ve yeni build
çıktısını kullanmalıdır; eski dist veya eski main bu korumayı içermez.

Bu ayarlar normal Wrangler deploy/versions akışında endpoints'i kapalı tutar;
ayrı Dashboard/CLI müdahalesinin bunları ileride açamayacağı iddia edilmez.
Kasıtlı yeniden açma için ayrıca açık kullanıcı kararı gerekir. Yeni env
eklenirse bayraklar yanında binding, sahiplik ve domain mirası ayrıca incelenir.

## Eski origin'deki kayıtları güvenle koruma

Tarihsel origin `https://roamcroft.roamcroft.workers.dev`; bu bir oyun linki
veya tekrar açma talimatı değildir. Kayıt anahtarları/SAVE_VERSION değiştirilmez.

1. Eski tarayıcı profilini, IndexedDB/localStorage/site verilerini ve PWA'yı
   silme. Eski adrese ağ erişiminin kapanması, tarayıcıdaki veriyi silmez.
   Yeni adreste boş çiftlik görmek eski çiftliğin kaybolduğunu kanıtlamaz.
2. Var olan Roamcroft JSON yedeğini güvenli kopyada sakla. Yeni adresteki cihaz
   çiftliğini de önce dışa aktar; ardından normal Kaydı yükle ile dosyayı seç.
   İçe aktarma mevcut cihaz çiftliğini değiştirir; sunucu dünyasını taşımaz.
3. Hâlâ açık ve çalışan eski sekme/PWA varsa yenilemeden normal Ayarlar →
   Kaydı dışa aktar yolunu dene. Önbellekten çalışma garanti değildir. Ağın
   kapalı olduğunu aşmak için domaini/DNS'i otomatik yeniden açma.
4. JSON yok ve eski uygulama açılamıyorsa profil/site verisini koru. Ayrı
   kurtarma çalışmasında önce güvenli profil yedeği alınır; yalnız eski origin'in
   verisi salt okunur incelenir. Ham IndexedDB dökümü geçerli oyun JSON'u
   sayılmaz; kayıt zarfı/doğrulama ve iki yedek kontrol edilmeden içe aktarılmaz.
   Tarayıcı profili, çerez veya token destek raporuna/günlüğe yüklenmez.
5. Sunucu kimliği eski origin'e bağlı HttpOnly güvenli çerezdir. JSON bunu
   taşımaz; otomatik hesap kurtarma/göç yoktur. D1/DO verileri korunur.
   Eski sahiplik ile yeni erişimin eşlenmesi ayrı yetkili ve doğrulanmış yönetim
   çalışmasıdır; çerez kopyalama, yeni sahiplik varsayma veya DB sıfırlama yoktur.

Tarihsel iki-origin test belgeleri o günün erişimini anlatır; güncel karar bu
belgedir. Sonraki öncelik fiziksel Android alpha.3 HUD/performans/kayıt kabulü;
bu yapılandırma işi onun yerine geçmez.

## Yerel doğrulama / teslim

Node22.13.0/npm10.9.2; typecheck, **241/241 test**, i18n1436 anahtar/parametre,
build ve **Wrangler4.130.0 deploy --dry-run** çıkış0. Gerçek üretilen JSON'da
iki bayrak false; env yok, auxiliaryWorkers boş, redirect aynı hedefte.
Build öncesi/sonrası Worker adı/giriş, D1, DO, migration, assets, routes ve
compatibility alanları aynı kaldı. Testler olası named env'in açık bayraklarını
da kapatıyor ve custom domain/binding alanlarının değişmediğini denetliyor;
eksik/açık canonical politika build'de reddediliyor.

Mevcut kalite/stabilite önceliği için dört WS/runtime da çıkış0: yerel
HTTP/rehber/nonce/CSP/CORS/SW, stok atomikliği/özel çantalar,50–300ms
kayıp/replay/reconnect, Worker restart, dış D1 revision koruması ve ortak
uyku/tek şafak geçti. Rehberin eski origin'i link olarak önermemesi ve
otomatik taşınmama uyarısı HTTP regresyonunda doğrulanır. Statik2.959.973
bayt <3.000.000. Loglar `work/domain-policy-{typecheck,tests,build,dry-run,runtime}.log`.

Yeni paket/bağımlılık/sürüm yok. Main/origin/main canlı alpha.3/f1fb425'te
kalır; değişiklik yalnız yerel commit'te. Yeni GitHub CI/Cloudflare build'i
başlatılmadı. Fiziksel Android kabulü için bu oturumda doğrulanmış cihaz
erişimi/ADB yok; FPS veya fiziksel dokunma başarısı iddia edilmez. Sonraki
onaylı dağıtım bu commit'i içermeli ve normal build/deploy hedefini kullanmalı;
Dashboard Production/Preview durum çelişkisi ayrıca kontrol edilmelidir.
