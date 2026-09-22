# 1.5.0 — Meyve Bahçesi doğrulaması

22 Eylül 2026. Bu sürüm bütün gelişim listesinin tamamlandığı anlamına gelmez.

- TypeScript ve 112 otomatik test başarılı. Fidan malzemesi, büyüme, mevsim, günlük tek hasat, mesafe, dolu envanter, eski kayıtlar, yeni tarih alanlarının doğrulanması ve bölge değişimi test edildi.
- Üretim dosyaları yaklaşık 2.63 MB; tahmini sıkıştırılmış toplam 1.47 MB. Bunlar ilk sayfa aktarım ölçümü değildir.
- Yerel üretim HTTP/CSP/oturum/CORS kontrolü başarılı.
- Tarayıcıda yeni oyunda fidan satın alma → dikme → görev ödülü → seviye atlama akışı tamamlandı. Kontrollü test kaydında olgun elma ağacından 3 meyve toplandı; Çiftlik ekranı o ağacı “Bugünün hasadı toplandı”, diğer elmayı “3 meyve toplanabilir”, armutları mevsimini bekler durumda gösterdi. Test kaydı yeni oyunculara verilmez.
- 844 × 390 yatay bahçe menüsü ve 390 × 844 dikey NPC menüsü görsel olarak kontrol edildi; belge genişliği viewport ile aynı, yatay taşma yok. Bu, fiziksel Android veya kurulu PWA testi değildir.
- Kontrollü 00:43 gece kaydında karanlık çevre ve karakterin yakındaki yol/ağaçları aydınlatan feneri görüldü. Kontrol sırasında tarayıcı hata günlüğü boştu.
- Statik dünya 25 bölgede 5 çizim çağrısını korudu. Yapı modelleri birleştirildikten sonra model başına en fazla 4 çizim çağrısı testi başarılı.
- Yerel CPU simülasyonu, 3.600 kare / 72 hayvan: medyan 0.032 ms, p95 0.390 ms; A* p95 0.530 ms. Bu değerler GPU veya fiziksel Android FPS ölçümü değildir.
- Yeni Lighthouse puanı, fiziksel Android testi ve uzun oturum yük testi henüz yapılmadı. Sabit FPS veya bitmiş oyun kalitesi iddiası yoktur.

Canlı yayın: `b24e3c8` uygulama sürümü 22 Eylül 2026 tarihinde Cloudflare Workers Builds ile başarıyla yayınlandı. GitHub CI başarılı: https://github.com/user02718281828/Roamcroft/actions/runs/35725155336 . Canlı adreste HTTP/CSP/oturum/CORS kontrolü geçti; başlangıç ekranındaki “1.5 · Meyve Bahçesi” ve mevcut cihaz kaydıyla açılan yeni ev, portreler ve mevsim renkleri tarayıcıda görüldü. Canlı sahne hata günlüğü boştu.
