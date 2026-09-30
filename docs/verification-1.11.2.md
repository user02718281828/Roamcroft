# 1.11.2 doğrulaması — 30 Eylül 2026

## Kapsam

PC çizim yükü ve mobil menü kullanımı. Dünya geometrisinin ekran dışındaki örnekleri GPU tamponuna gönderilmiyor; kaynak matris, renk ve sınırlar ayrı tutuluyor. Kamera yarım kare yer değiştirdiğinde veya dönüş/zoom/ekran boyutu değiştiğinde görünür tampon yenileniyor. Sınırlar iki dünya birimi genişletilerek kamera eşiği ve rüzgâr hareketleri için pay bırakılıyor. Ayrıntılı mod seçilmişse otomatik efekt azaltımı uygulanmıyor. Ağ protokolü, ekonomi, kayıt biçimi ve hareket tamponu değiştirilmedi.

## Yerel tarayıcı ölçümü

Üretim derlemesi, Windows Codex uygulama içi Chromium, 1600 × 900 çizim tamponu (1.440.000 piksel), ayrıntılı mod; 3.600 aktif kare / 25 bölge. Yerel test kaydı: karakter 12,14; 14. gün. Bunlar kısa gözlemlerdir, bütün cihazlar için FPS garantisi değildir.

| Örnek | Kare süresi | Dünya örnekleri (görünür/toplam) | Dünya üçgenleri (çizilen/toplam) |
| --- | ---: | ---: | ---: |
| Sabit kamera | 8,09 ms | 3.094 / 7.262 | 168.906 / 395.332 |
| Görüşü döndürdükten sonra | 7,82 ms | 3.042 / 7.262 | 165.446 / 395.332 |
| Bir kademe uzaklaştırıp odakladıktan sonra | 7,91 ms | 3.562 / 7.262 | 193.814 / 395.332 |

İlk örnekte aynı karede dünya üçgenlerinin %57,3'ü ekran dışında kaldığı için çizilmiyor. Bu oran toplam GPU zamanı veya FPS artışı değildir. İlk 1.11.1 ölçümü yaklaşık 24,13 ms idi ancak test sırasında kayıt zamanı/karakter konumu değişti; kontrollü önce/sonra FPS karşılaştırması olarak kullanılmıyor. Kamera dönüşünde görüntü kontrol edildi; tarayıcı konsolunda hata bulunmadı.

## Mobil arayüz

- 844 × 390 ve 390 × 844 ekranlarda 11 yerel menü bölümü kontrol edildi. Bölüm değişince içerik kaydırması sıfırlandı.
- Son yatay atölye kontrolü: içerik 820 × 320, scrollWidth 820; bölüm seçicisi 44 piksel yüksekliğinde. Alt sekmeler kesilmeden yatay kayabiliyor.
- Son dikey ayar kontrolü: içerik 366 × 774, scrollWidth 367 (bir piksel yuvarlama). Alt içerik dikey kaydırmayla erişilebilir.
- Fiziksel Android dokunma, ana ekrana eklenmiş PWA ve gerçek cihaz GPU ölçümü bu turda yapılmadı; tarayıcı ekran boyutu emülasyonu kullanıldı.

## Otomatik doğrulama

- TypeScript kontrolü başarılı.
- 176/176 test başarılı: kayıt yükleme, ortak işlemler ve önceki özellikler; yeni testler görünmeyen nesnelerin düzenleme/silme/tampon büyütme sonrası doğru dönüşünü ve ayrıntılı modun korunmasını kapsıyor.
- Üretim derlemesi başarılı; statik toplam 2,69 MB, tahmini sıkıştırılmış 1,49 MB.
- Yerel gerçek Worker + dört WebSocket testi geçti: 50/100/200/300 ms ek gecikme, mesaj kaybı/jitter/sıra değişimi/yineleme, reconnect, ani host kopması, Worker yeniden başlatma, D1 kayıt çakışması ve ortak uyku. Ağ kodu değişmedi; runtime testi son görsel düzenlemelerden önce çalıştırıldı, CI son commit üzerinde tekrar çalıştırır.
- 300 ms ek gecikmeli gerçek RealtimeClient örneği: ölçülen RTT 312,01–312,28 ms; yerel tepki 76,84 ms; ilk ACK 482,27 ms; adaptif tampon 257,30–259,23 ms; kısa yürüyüşte en büyük düzeltme 0 kare. Gerçek internet gecikmesinin sıfırlandığı iddia edilmiyor.
- En ağır 300 ms + mesaj hatası koşulu: RTT p50 324,15 ms / p95 517,03 ms; jitter p95 220,14 ms. Hatalar uygulama mesaj katmanında enjekte edildi, gerçek TCP paket kaybı testi değil.

## Açık sınırlar

Farklı ekran kartları ve gerçek Android cihazlar; uzun süreli/gelişmiş çiftlik stres testi; gerçek WAN co-op koşulları. Bu ölçümler tüm FPS/ms sorunlarının kapandığını kanıtlamaz. Ortak maden ve uzak bölgelerde bağımsız keşif bu sürümün kapsamı değildir.
