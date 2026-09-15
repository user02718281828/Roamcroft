# Sunucu dünyası güvenlik sınırları — 1.4.0

Bu sürüm çalışan, tek oyunculu bir **sunucu dünyası önizlemesi** getirir. Tam güvenlik veya tüm kodun gizlendiği iddiası değildir.

## Yetki ve kayıt

`/api/world` yalnızca aynı Origin'den JSON POST kabul eder. İstemci bir State, para, XP, envanter, rastgelelik tohumu veya geçen süre gönderemez. İzin verilen oyun komutları, mevcut dünyadan oluşturulan Engine üzerinde çalışır. Kaynak, yakınlık, kapasite, seviye ve bekleme kontrolleri sunucuda yeniden uygulanır. Hareket sunucu saatinden türetilen, en fazla bir saniyelik çarpışma denetimli adımlarla ilerler. Durdurulmuş/arka plandaki oyunda simülasyon bekler; kopuk bağlantı birikmiş zaman kazandırmaz.

Oturum 256 bit kriptografik rastgele sırdır. `__Host-` önekli çerez Secure, HttpOnly, Path=/ ve SameSite=Strict taşır. D1 yalnızca sırrın SHA-256 özetini tutar. Başka dünya kimliğini parametreyle seçme veya dosyadan kayıt yükleme uç noktası yoktur. Çerez her başarılı bağlantıda 30 gün uzar. **Çerezi silmek erişimi kaybettirir; 30 gün kullanılmayan oturumlar sona erer.** E-posta hesabı, cihazlar arası giriş ve kurtarma bu sürümde yoktur. Ayarlar'dan alınan dosya yalnızca çevrimdışı oyunda kullanılabilir.

Her yazma isteği artan sıra numarası ve değişen nonce taşır. Son isteğin aynı nonce ve aynı gövde özetiyle tekrarı kayıtlı sonucu döndürür. Aynı sıranın farklı gövdeyle kullanımı reddedilir. D1 güncellemesi eski sıra ve nonce ile koşulludur; eşzamanlı iki istek aynı ödülü iki kez veremez. HTTP gövdesi TLS üzerinden taşınır; tarayıcıya HMAC anahtarı gömülmez.

## Sınırlar

- Gövde: akış okunurken en fazla 8 KiB, istek başına 8 komut; istemci kuyruğu 16 komut.
- IP: 300 istek/dakika; oturum: 180 yazma/dakika. Yeni dünya IP başına 5/saat, toplam 1000/gün.
- Önizleme toplam 200 aktif dünyayla sınırlandırılır; oluşturma kontrolü SQL eklemesinin içindedir. Dünya kaydı 1.8 MB ile sınırlıdır. Kapasite dolunca yeni dünya reddedilir.
- SQL değerleri bind ile verilir; oturum ve dünya yanıtları no-store'dur. Service worker API'leri önbelleklemez. Tarayıcı değişiklik paketlerini uygularken sunucu kopyası ile hareket tahminini ayırır.
- Nonce CSP, frame-ancestors/X-Frame-Options, nosniff, HSTS, COOP, Referrer-Policy ve Permissions-Policy uygulanır. Dış kaynaklara CORS açılmaz.

Cloudflare D1 satır sınırı [2 MB](https://developers.cloudflare.com/d1/platform/limits/). [Workers CPU ve istek kotaları](https://developers.cloudflare.com/workers/platform/limits/) ayrıca geçerlidir. D1'e sık yazan bu önizleme, büyük oyuncu sayısı için kapasite planı değildir; odalara ayrılmış Durable Objects, WebSocket ve aralıklı kalıcı kayıt sonraki adımdır. Kota/CPU sınırı aşımı bağlantıyı durdurabilir, istemcinin para üretmesine izin vermez.

## Henüz sağlanmayanlar

- Çevrimdışı oyun çalışmaya devam ettiği için paylaşılan Engine kodu tarayıcı paketinde bulunur. **Sunucu doğrulaması hileli durumu engeller; mevcut çevrimdışı algoritmaları gizlemez.** Tam ticari çekirdek ayrıştırması ayrı çalışma gerektirir.
- Kimliği doğrulanmış kullanıcı hesapları, kurtarma, co-op odaları ve sıralamalar yoktur.
- Dağıtık bot saldırılarına karşı WAF/Turnstile, plan bazlı kota alarmı, bağımsız sızma testi ve üretim yük testi tamamlanmamıştır. Tarayıcıdan anti-debug döngüsü çalıştırılmaz.
- Telif tescili, hukuki bildirim veya EULA hazırlanıp kabul ettirilmedi.

Otomatik testler; yabancı Origin, sahte oturum, başka oturumun nonce'u, yasak komut, sahte para/zaman, hatalı sıra, değişmiş replay, eşzamanlı yazma, kayıp yanıt sonrası yeniden deneme, süre/hareket sınırı, gövde/kota, güncelleme farkları ve oturum uzatmasını kapsar.
