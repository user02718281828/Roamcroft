# 1.3.0 doğrulama — 14 Eylül 2026

- TypeScript kontrolü ve 94 otomatik test başarılı. Node 22.13.0 üzerinde de uyumluluk kontrol edildi.
- Üretim derlemesi başarılı; JSON import attributes ve 500 KB paket uyarısı giderildi. En büyük istemci JS paketi yaklaşık 319 KB hamdır.
- Görseller: önce 14.02 MB PNG, sonra 0.92 MB WebP. Statik dosya toplamına 3 MB derleme sınırı kondu; son rakam dist/client/asset-budget.json içinde üretilir.
- 3600 etkin kare ve 72 hayvanla CPU deneyi: simülasyon medyanı 0.016 ms, p95 0.185 ms; A* medyanı 0.079 ms, p95 0.226 ms. Bunlar GPU kare hızı ölçümü değildir.
- Yerel üretim derlemesinde masaüstü görüntüsü, mavi nehir, 1–8 kısayolları, menü açılması, üç bağımsız ses ayarı ve varsayılan ayrıntılı görüntü kontrol edildi. İncelenen tarayıcı konsolunda WebGL veya JavaScript hatası görülmedi.
- 390 × 844 dar ekran kontrolünde kaynak ve işlem düğmeleri ayrı satırlarda; joystick tabanı 116 × 116, saldırı düğmesi 52 × 52 px. Araç çubuğu bu tuşların üstünde, çakışmadan durur. Sol panel kapalı başlar. Fiziksel mobil cihaz testi ayrıca gereklidir.
- Tarayıcıda joystick sürüklendiğinde oyuncu konumu değişti; bırakıldığında topuz merkezine döndü ve sonraki okumada oyuncu konumu sabit kaldı. Ekran görüntüleri, gerçek kayıt doğrulayıcısından geçirilip yüklenen ayrı bir test çiftliğine aittir.
- Gece sahnesi karanlık; gece/gündüz hesabının 00:43 regresyon testi başarılı. Sulama, günlük hayvan bakımı, sprinkler, üretim ve kayıt migration testleri başarılı.
- Yerel HTTP kontrolünde manifest ve service worker 200, SW Cache-Control no-cache; kapalı co-op POST'u sahte kimlik başlığına rağmen 404 döner. Çevrimdışı HTML kabuğuna dönüş testi başarılı. Fiziksel cihazda uçak modu ve PWA kurulum testi yapılmadı.

Cloudflare CLI oturumu bulunmadığı için 1.3.0 canlı yayına bu çalışma sırasında çıkarılamadı. Cloudflare Connect Git hesap bağlantısı da bekliyor. Bu nedenle canlı PageSpeed/LCP yeniden ölçümü, fiziksel iOS/Android iki parmak testi ve uzun süreli farklı GPU testi tamamlanmış sayılmaz. Her cihaz için kesintisiz 30 FPS veya PageSpeed 90 garantisi verilmez.
