# 1.8.0 doğrulama — 24 Eylül 2026

- TypeScript ve 134 test başarılı. Altı yeni test grubu: dünya hücreleri arasında efekt konumu sürekliliği; eski yükseltilmiş kaydın mahsul/streaming korunarak düzleştirilmesi; on hareketli yapı grubunun batching ve ayrıntı bütçesi; gerçek oturum şartı ve kaynak/alan doğrulaması; dört kişilik kapasite ve ev sahibi yetkisi; süre aşımı ve istek kotası.
- Üretim derlemesi başarılı: toplam statik dosya 2.66 MB, tahmini sıkıştırılmış aktarım 1.48 MB. İlk sayfa yükleme veya Lighthouse ölçümü değildir.
- Yerel Worker HTTP testi: nonce CSP, güvenlik başlıkları, hafif açılış, dünya oturumu, eski co-op yolunun kapalı kalması ve yeni lobi yolunda yabancı kaynak/oturumsuz isteklerin reddi başarılı.
- Gerçek yerel Worker/D1 üzerinde ayrı çerezli iki oturumla lobi açma, davetle katılma, iki üyenin görünmesi, ev sahibi ayrılınca kapanma doğrulandı. Dört kişi sınırı SQLite tabanlı API testinde kontrol edildi.
- Yerel tarayıcıda kontrollü çiftlik kaydıyla on yapı detayı, hayvanlar ve sonbahar görünümü incelendi. Tarayıcı hata günlüğü boş. Canlı oyuncu kaydına test verisi yüklenmedi.
- Lobi UI üzerinden açıldı ve kapatıldı. 844 × 390 yatay ve 390 × 844 dikey görünümde sayfa boyutları viewport ile aynı; yatay taşma yok. Kaydırılabilir içerik ve kapatma kontrolü kullanılabilir.
- CPU örnek ölçümü: 3.600 aktif kare / 72 hayvan; simülasyon ortancası 0.015 ms, p95 0.191 ms, en yüksek 1.114 ms; A* p95 0.232 ms. Bu Node ölçümü WebGL, tarayıcı GPU FPS veya Android performansı değildir.
- Yeni FriendLobby, workshop-art, lobby API ve iki yeni test dosyasında hedefli lint başarılı. Repo genel lint mevcut başka dosyalarda (ör. chart, eski test dosyaları) hata veriyor; tüm repo lint temiz ilan edilmiyor.
- Fiziksel Android/PWA, yeni PageSpeed ve uzun süreli GPU profili bu sürümde yapılmadı. Her koşulda 30 FPS garantisi verilmiyor.

## Online sınırı

Bu sürüm gerçek oturumla korunan davet lobisidir; ortak harita ve eşzamanlı çiftlik oynanışı henüz yoktur. UI bunu açıkça belirtir. Lobi kişisel dünyaları değiştirmez. Üyelik/kapasite/oda ömrü sunucuda doğrulanır; 96 bit rastgele kod, Secure/HttpOnly/SameSite oturumu, aynı kaynak şartı, sınırlı gövde/alanlar, parametrik SQL ve oturum başına istek kotası kullanılır. Kimlik hash'leri yanıtlanmaz. Eski `/api/coop` açılmadı.

Sonraki online teslim: ortak dünya yetkileri, tek sunucu otoritesi, komut sırası/yeniden bağlanma, oyuncu varlığı ve eşzamanlı çakışan eylem testleri. Davet lobisi bu tamamlanmadan tam co-op diye sunulmayacak.
