# 1.3.1 doğrulaması — 15 Eylül 2026

**Yayın:** b95540d kodu GitHub üzerinden Workers Builds ile canlıya çıktı. `npm run check:http -- https://roamcroft.roamcroft.workers.dev` başarılı. Hem main hem özellik dalının GitHub CI kontrolleri başarılı. Yerel Cloudflare CLI oturumu gerekmedi.

- 99 otomatik test: bulutların kamera kayması ve hücre değişiminde aynı dünya konumunu koruması; sınırlı geometri; CSP nonce rastgeleliği ve sahte istek başlığının değiştirilmesi; API durum/gövde korunması dahil.
- Yerel üretim HTTP kontrolü: ana sayfa, statik WebP, manifest, SW, olmayan sayfa ve kapalı API'de altı başlık. HTML script nonce değerleri yanıt CSP'siyle eşleşir; iki isteğin nonce değeri farklıdır. HTML private/no-store, hashli dosyaların immutable önbelleği korunur.
- CSP script-src yalnızca self ve nonce kullanır; unsafe-eval yoktur. React ve joystick'in dinamik stilleri için style-src unsafe-inline gereklidir. Tam ekran self izniyle çalışabilir; kamera/mikrofon/konum/ödeme/USB kapalıdır.
- @esbuild-kit/core-utils için esbuild 0.25.12 override kullanıldı; Drizzle 0.31.10 korunur. npm audit ve npm audit --omit=dev: 0 bulgu. Gerçek şema geçici work/drizzle-smoke klasöründe SQL'e çevrildi; canlı veritabanına uygulanmadı.
- Yerel tarayıcıda CSP altında oyun yükleme ve kamera sürükleme çalıştı; WebGL/JavaScript/CSP hatası görülmedi. Bozuk dosya yükleme öncesi/sonrası oyun durumu birebir aynıydı; ana menüde kırmızı bütünlük hatası doğrulandı.
- Geçerli test çiftliği dosyası da ana menüden başarıyla yüklendi: gün 1, 1940 altın, ahır/kümes ve hayvanlar geri geldi. [Yerel sahne görüntüsü](screenshots/clouds-1.3.1.jpg).
- Canlı 1.3.0 asset-budget.json 2,587,222 ham bayt / yaklaşık 1,457,901 sıkıştırılmış bayt bildiriyordu. Yeni derleme de 3 MB kontrolünden geçti. Bu sayı ağdaki gerçek ölçüm veya LCP puanı değildir.
- Google PageSpeed API yeni ölçüm isteğine 429 döndürdü; yeni skor/LCP sonucu yok. Sistem fontları kullanılıyor; indirilecek font dosyası olmadığından yapay font preload eklenmedi.
- Kullanıcının Nikto, gömülü sır ve XSS sonuçları tarihli dış rapordur. Bu oturumda bunların tümü yeniden çalıştırılmadı; hiçbir temiz rapor bütün olası açıkların yokluğunu kanıtlamaz.

Teknik kaynaklar: [Cloudflare statik başlık kapsamı](https://developers.cloudflare.com/workers/static-assets/headers/) yalnızca statik yanıtları kapsadığı için Worker fetch yanıtı da sarılır. [esbuild geliştirici duyurusu](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99) düzeltilmiş sürümü 0.25.0 ve üzeri olarak belirtir.

Özel domain CORS ve online egress denetimi ilgili altyapı açıldığında tekrarlanacak. Mevcut kapalı API, yabancı Origin'e Access-Control-Allow-Origin vermiyor; bu gelecekteki yetkilendirme testlerinin yerine geçmez.
