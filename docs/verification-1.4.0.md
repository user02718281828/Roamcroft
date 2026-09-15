# 1.4.0 doğrulama — 16 Eylül 2026

## Yerelde doğrulananlar

- TypeScript kontrolü başarılı. 109 otomatik test başarılı; sunucu nonce/sıra/tekrar deneme ve viewport/yön değişimi testleri dahil.
- Üretim derlemesi başarılı. Toplam statik dosya yaklaşık 2.62 MB; tahmini sıkıştırılmış toplam 1.47 MB. Bu değer ilk açılış aktarımı değildir; tüm oyun dosyalarının toplamıdır.
- HTTP kontrolü: hafif açılış, script nonce eşleşmesi, güvenlik başlıkları, statik dosyalar, 404, service worker, oturumsuz ve yabancı Origin isteklerinin reddi başarılı.
- Açılışın tarayıcı dosya envanterinde Game, scene ve Three.js dosyaları yok; Oyna sonrasında yükleniyorlar. Yeni Lighthouse puanı ölçülmedi, eski rapor yeni sürüm sonucu sayılmadı.
- 844×390: oyun tuvali x=0, y=0, genişlik=844, yükseklik=390. Joystick 104×104, araç düğmeleri 44×44, etkileşim düğmesi 48×48. Joystick/araç/sağ eylemler ayrı bölgelerde.
- Yatay menü 832×378, kategori sütunu 86 px; içerik yüksekliği 305 px. Çanta, üretim, inşa, günlük, çiftlik, dostlar, emanet, maden ve ayarlar açılıp kontrol edildi. Sonraki düzenlemede ayarlar ve çiftlik sütunlara ayrıldı.
- 390×844: menü 378×832, içerik 696 px yüksekliğinde, yatay içerik taşması yok. Eşya kartları iki sütun ve küçük görseller kullanıyor.
- 740×360 oyun görünümü ekrana oturuyor. 640×360 ayar paneli 628×348; kapatma düğmesi 44×44 ve ekran içinde. Ayarlardaki alt piksel taşmasının kaydırma çubuğu oluşturması engellendi.
- Çevrimdışı önceki kayıt açıldı. Ayrı sunucu oturumunda gerçek meyve tüketimi 8→7 ve hasat sonucu +3 buğday/+1 tohum gözlendi. İki kayıt birbirinin üzerine yazılmıyor.
- Konsolda gözlenen uygulama hatası yok. Yerel masaüstü oyun göstergesinde 88–115 FPS gözlendi; bu fiziksel Android ölçümü değildir, her cihaz için alt sınır garantisi vermez.
- npm audit: son çalıştırmada 0 açık.

## Fiziksel cihaz sınırı

Kullanıcı Android Chrome kullanıyor. Fullscreen API, navigationUI=hide ve yatay yön kilidi gerçek kullanıcı dokunuşundan çağrılır. Masaüstündeki in-app test tarayıcısı fullscreenElement durumuna geçmedi; bu ortamda Android sistem çubuklarının gizlendiği doğrulanamaz. Ana ekrandan gerçek Android başlatma, çentik, sistem gezinme çubuğu, geri tuşu, iki parmak ve klavye testi açık kalır. Tarayıcı boyutu testleri fiziksel cihaz testi olarak sunulmaz.

## Yayın

- 16 Eylül 2026: `d8c26cd` main dalına gönderildi. GitHub doğrulama ve Workers Builds başarılı.
- Canlı adres: https://roamcroft.roamcroft.workers.dev/ — üretim HTTP kontrolünün tamamı başarılı.
- Canlı sunucu dünyasında oturum açıldı; envanterde orman meyvesi 8→7 oldu. Sayfa yeniden yüklenip aynı sunucu dünyası açıldığında 7 olarak korundu. Konsolda uygulama hatası gözlenmedi.
- 844×390 canlı tarayıcı görünümünde kompakt mobil menü çalışıyor. 640×360 yerel son kontrolünde kaynak satırı ve takvim çakışmıyor. Fiziksel Android ve yeni PageSpeed ölçümleri yukarıda belirtildiği gibi açık kalıyor.
