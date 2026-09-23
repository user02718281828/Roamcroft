# 1.7.0 doğrulama — 23 Eylül 2026

- TypeScript kontrolü ve 128 test başarılı. Sekiz yeni test: deterministik sipariş/yarın önizlemesi, mevsime uygun başlangıç ürünleri, 28 günlük ödül dengesi, iki seçeneğin ortak günlük sınırı, kayıt sonrası tekrar teslim, eski/yanlış/eksik/seviye kilitli istekler, dolu çantada malzeme ödülü, eski kayıtlar, sunucu komutları ve pazar kısıtlaması.
- Üretim derlemesi başarılı: statik toplam 2.65 MB; tahmini sıkıştırılmış toplam 1.48 MB. Bunlar ilk sayfa yükleme veya yeni Lighthouse sonucu değildir.
- Yerel üretim HTTP kontrolü başarılı: hafif başlangıç, nonce CSP, güvenlik başlıkları, dosyalar, service worker, API oturumu ve CORS.
- Yerel tarayıcıda kontrollü kayıt: Narin'e 2 çorba tesliminde çorba 4 → 2, altın 180 → 307, gübre 0 → 2 ve dostluk 0 → 8 oldu. Her iki teslim seçeneği kapandı. Yarının buğday/marmelat ihtiyaçları açılır bölümde görüldü.
- 844 × 390 yatay ve 390 × 844 dikey ekranlarda sipariş kartları ve yarın önizlemesi kontrol edildi; belge boyutları ekran boyutlarıyla aynıydı, yatay taşma yoktu. Dikey makine kartında ekmek için ham satış 67, çıktı 90, pazardan girdi alım maliyeti 105 altın olarak doğrulandı.
- Tarayıcı hata günlüğü boş. Canlı kullanıcı kaydına test verisi yüklenmedi. Görsel dünya, kamera ve render döngüsü değiştirilmedi.
- Fiziksel Android/PWA, yeni Lighthouse ve uzun süreli GPU FPS ölçümü yapılmadı. [Ekonomi tabanı](economy-baseline-1.7.0.md) sabit girdilerle değer hesabıdır; oyuncu yaşam döngüsünün tam simülasyonu değildir.

Canlı yayın ve uzak CI sonucu son kontrolde eklenecek.
