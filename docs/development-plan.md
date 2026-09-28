# Roamcroft gelişim planı

## 28 Eylül 2026 — Birlikte oynama ve günlük akış

- [x] İhtiyaç kadar depodan malzeme hazırlama; tarif/sipariş bağlantıları (1.10.1).
- [x] Ortak uyku: ev yakınında tüm bağlı oyuncuların onayı; bağlantı kopunca iptal; gece üretimi ve tek sabah geçişi. Dört WS istemcili yerel Worker testi geçti (1.11.0).
- [x] Mobil çıkış: kayıt onayından sonra başlangıç ekranı; hata halinde oturumun korunması. 844×390 tarayıcı ve istemci hata testleri geçti (1.11.0); fiziksel Android aşağıda açık.
- [x] Köy dönüm noktalarına bağlı altı özgün hikâye bölümü ve NPC tepkileri; eski kayıtlardan türetilir (1.11.0).
- [ ] Ortak maden: kat, düşman, ganimet ve asansör oturumlarının sunucu otoritesiyle paylaşılması.
- [ ] Uzak bölgelerde bağımsız co-op keşif: oyuncu başına görünür bölge ve bölgesel simülasyon; 20 kare sınırını kaldırmadan önce test.
- [ ] Çok günlük ekonomi testi: yem, tohum, işleme, sipariş ve ekipman maliyetlerinin birlikte ölçülmesi.
- [ ] Fiziksel Android Chrome/PWA: ana ekran, sistem çubukları, geri tuşu, dokunmatik kontroller ve uzun oturum performansı.

Bu liste eski sürüm hedeflerinden daha günceldir; açık maddeler tamamlanmış değildir.

22 Eylül öncelik güncellemesi: [Sistem eksikleri ve karar derinliği incelemesi](system-gap-review.md). Kullanıcının son isteği doğrultusunda aşağıdaki eski sayısal içerik kotaları zorunlu hedef değildir; önce mevcut sistemler arasındaki anlamlı kararlar ve mobil oynanabilirlik gelir. 1.6.0: ekim planı, tekrar hasat, seçilebilir makine tarifleri ve güvenli parti üretimi.

14 Eylül 2026'da iletilen genişletilmiş metnin takip listesi. Önceki 6–8 oturum tahmini, büyüyen kapsam için güvenilir bir tamamlanma tarihi değildir. Her bölüm kayıt uyumluluğu ve performans kontrolüyle ilerler. Açık maddeler henüz uygulanmamıştır. Yeni adlar, diyaloglar, sanat ve müzik Roamcroft'a özgü olacaktır.

## Güncel öncelik — Android Chrome, 1.4.0

- [x] Oyna dokunuşunda gerçek tam ekran ve yatay yön isteği; kurulu uygulamada da denenir.
- [x] Görünür ekran yüksekliği, yön değişimi ve klavyeye göre boyut; tuvalde asgari 540 px kısıtının kaldırılması.
- [x] Yatay telefon için dar kategori sütunu; küçük eşya kartları, ayrı kayan menü içeriği, 44 px dokunma hedefleri.
- [x] Küçük HUD, ayrı joystick/araç/etkileşim/saldırı bölgeleri; dokunarak yakındakiyle etkileşim ve öndeki kareye ekim/inşa.
- [x] Ana menüde kayıt sonrası PWA güncellemesini etkinleştirme, menüden oynanış kılavuzu.
- [x] Oyna öncesinde 3D motor yüklenmeyen açılış; duraklatılmış sahnede tekrar çizimin kaldırılması.
- [x] Sunucu dünyası önizlemesinde sunucu doğrulaması, çerez oturumu, nonce/sıra, atomik yazma, hız ve boyut sınırları. [Kapsam ve sınırlar](server-security.md).
- [ ] Kullanıcının fiziksel Android cihazında ana ekrandan başlatma, sistem çubukları, geri tuşu ve gerçek iki parmak testi. Masaüstü boyut emülasyonu fiziksel cihaz testi değildir.
- [ ] Yeni sürüm için PageSpeed ve düşük donanımda uzun oyun oturumu ölçümü.
- [ ] Hesap/kurtarma, odalı co-op, sunucu yük testi ve tüm ticari çekirdeğin istemci paketinden ayrılması.

## 1. Joystick, canlı dünya ve mobil yayın — bu sürüm

- [x] Sabit tabanlı 360° analog dijital joystick; ölü bölge, hız şiddeti, parmak bırakma/iptal/odak kaybında durma.
- [x] Pinch zoom, mobil hit alanları, PWA kabuğu ve açılış ilerlemesi.
- [x] Hayvan bacakları, ayrı hareketli kafa ve nefes; karakter pozları arasında yumuşak geçiş.
- [x] Hareketli/parlayan alev, hasatta yenilenen gölge, sınırlı parçacık bütçesi.
- [x] Görünür turkuaz nehir, dalga, yansıma, kıyı köpüğü; küçük bitkilerde geçiş ve gövde çarpışması.
- [x] Hareketli kış yağışı ve kamerayla ilerleyen hava efektleri.
- [x] Mevsim, gece/gündüz ve maden konumuna göre özgün ses dizileri; ayrı ses seviyeleri, gece böcekleri.
- [x] WebP, menü kodunu gerektiğinde yükleme, bölünmüş çizim motoru, 3 MB derleme bütçesi, kalıcı D1 yapılandırması.
- [ ] Fiziksel Android/iOS pinch, joystick ve PWA kurulum testi.
- [x] Git bağlantısıyla Cloudflare canlı yayın doğrulandı (1.3.1). Yerel CLI oturumu olmadan mevcut Workers Builds akışı kullanıldı.
- [ ] Canlı PageSpeed/LCP yeniden ölçümü (API kota yanıtı nedeniyle bekliyor).

## 1.1 Bulutlar, güvenlik ve performans raporu — 15 Eylül 2026

- [x] **2.8 Bulutlar:** dünya koordinatlarına bağlı, seyrek, yumuşak kenarlı ve düşük opaklıklı bulut katmanı; kamerayla kayma kaldırıldı. Tek çizim çağrısı, en fazla 25 örnek.
- [x] CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy; HTML/API ve statik yanıtlar ayrı korunur.
- [x] HTML isteklerinde rastgele nonce; script için unsafe-inline/unsafe-eval yok. Tam ekran izni oyunun kendi kaynağına açık.
- [x] WebP, kod bölme ve önbellek optimizasyonlarının canlı 1.3.0 çıktısında bulunduğu doğrulandı: 2.59 MB statik dosya.
- [x] Drizzle sürümü düşürülmeden alt bağımlılıktaki esbuild güncellendi; audit sıfır, şema üretimi çalışıyor.
- [x] Bozuk kayıt mevcut dünyayı değiştirmiyor; yükleme hatası ana menüde görünür. Otomatik kayıt ve çok günlük simülasyon testleri mevcut.
- [x] Kapalı API için yabancı Origin ve OPTIONS kontrolü; CORS erişimi açılmıyor.
- [x] 1.3.1 canlı yayın ve HTTP doğrulaması; GitHub CI başarılı.
- [ ] Yeni mobil/masaüstü PageSpeed ve LCP ölçümü. Google API 429 döndürdü; eski puanlar yeni sürüm sonucu kabul edilmez.
- [ ] Fiziksel mobil cihaz ve uzun süreli GPU kontrolü.
- [ ] Özel domain eklenince CORS, online açılınca egress kontrolü; kimlik doğrulama ve yetkilendirme ayrıca test edilecek.

Güvenlik başlıkları ve temiz tarama, uygulamanın tüm olası açıklardan arınmış olduğunun kanıtı değildir. Kullanıcı raporundaki geçmiş taramalar, bu oturumda tekrar çalıştırılmış gibi sunulmaz.

## 2. Tarım ve ürün kalitesi

- [ ] Eski kayıt günlerini dönüştürerek 28 günlük dört mevsime geçiş.
- [ ] Toprak yorgunluğu, dinlendirme ve gübre çeşitleri; arayüzde okunabilir verim göstergesi.
- [ ] Dört ürün kalite seviyesi, ayrı envanter yığınları ve satış çarpanı; eski ürünler normal kaliteye taşınır.
- [x] Meyve fidanı, büyüme, mevsimsel hasat ve kalıcı ağaç durumu (1.5.0: elma/armut, günlük hasat, Bahçe yönetimi, iki tarif ve iki görev).
- [ ] Damla sulama ve otomatik sulama iyileştirmeleri.

## 3. Hayvancılık ve üretim

- [ ] Keçi, ördek ve domuz; özgün modeller, yem/su/temizlik ve sevgi durumu.
- [ ] Mutluluğun ürün kalitesine etkisi, otomatik yemlik/suluk.
- [ ] Mayonez, tereyağı, kumaş, bal ve fıçı zincirleri; makineye özgü animasyonlar.
- [ ] 100'den fazla oynanabilir tarif; girdiler, çıktı kalitesi, iş süresi, açılma koşulu ve ekonomi dengesi.

## 4. Balıkçılık ve maden — gerekirse iki oturum

- [ ] 50'den fazla özgün balık, mevsim/hava/saat tablosu ve koleksiyon albümü.
- [ ] Bırak/bas gerilim mini oyunu; farklı olta, yem ve pasif yengeç kapanı.
- [ ] Altın ve ileri cevherler, jeotlar, fosiller; yeni düşman saldırıları ve kaçınma kontrolleri.
- [ ] Roamcroft'a özgü kalıntı, gizli geçit, hazine ve bölge açma görevleri.

## 5. Köylüler ve takvim — gerekirse iki oturum

- [ ] 30'dan fazla özgün NPC; rutini, ilgi alanı, doğum günü ve hikaye görevleri.
- [ ] 10 kalp; 12 yetişkin evlilik adayı için özgün ilişkiler, teklif, düğün ve aile sistemi.
- [ ] Mevsim başına iki özgün festival: yarışma, dans, sezonluk satıcı; tekrar ödülünü engelleyen kayıtlar.
- [ ] Yardım panosu, uzun siparişler, yıldönümleri ve zamana bağlı diyaloglar.

## 6. Beceri, sahiplik ve son dengeleme

- [ ] Beş beceride 10 seviye, 5/10 seviyede meslek seçimi ve etkilerini açıklayan UI.
- [ ] 49 başarım, tamamlanma yüzdesi, uzun vadeli koleksiyonlar.
- [ ] Özgün ileri bölgeler: Tuz Düzlüğü, Akyel Adası ve Söğüt Bataklığı.
- [ ] 200'den fazla yerleştirilebilir dekor, iç mekan/duvar/zemin düzenleme; mobilya çarpışması ve kayıt.
- [ ] Kıyafet, şapka, saç, ten ve göz seçimi; kalıcı karakter görünümü.
- [ ] Sekiz çiftlik başlangıç haritası; her biri için erişilebilir başlangıç, kaynak ve ekonomi kontrolü.
- [ ] Çok günlük simülasyon, eski kayıt geçişleri, düşük donanım testi, son canlı yayın.

Çevrimiçi çalışma ayrı [yol haritasındadır](online-roadmap.md). Kimlik doğrulama hazır olmadan co-op arayüzü açılmaz. Hiçbir bölüm için tüm donanımlarda sabit FPS sözü verilmez; ölçüm raporları tutulur.
