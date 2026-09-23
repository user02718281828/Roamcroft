# Değişiklikler


## 1.7.0 — Birlikte Üreten Vadi · 23 Eylül 2026

- Üç köylüye günlük iki teslim yolu: ham ürünle altın, işlenmiş ürünle altın ve sonraki işine yarayan malzeme. On dört farklı ihtiyaç; her kişi günde yalnızca bir teslimat kabul eder. Mevsim dışında yetişmeyen başlangıç sebzesi istenmez.
- Yarının ihtiyaçları önceden görülebilir. Seviye veya envanter değişikliği teklifleri değiştirmez. Sipariş karşılığı, normal satış değerinin %25 fazlasıdır; bu değer malzeme ödülünü de içerir.
- Teslimatta malzeme, gün, teklif ve seviye motor/sunucu tarafında doğrulanır. Eski günün isteği harcama yapmaz; kayıt yükleyerek veya diğer seçeneği seçerek ödül tekrarlanamaz. Dolu çantada malzeme ödülleri korunur.
- Makinede ham sat / işleyip sat / girdiyi pazardan al karşılaştırması. Pazar ekranından siparişlere geçiş.
- Pazarda satılmayan ürünlerin kısıtlaması artık motorun satın alma komutunda da uygulanır; bu ürünleri satmak mümkün olmaya devam eder.
- Eski günlük teslim kayıtları korunur. Yeni kayıt biçimi, görsel varlık veya kare başına simülasyon taraması eklenmedi. 128 test başarılı.

## 1.6.0 — 22 Eylül 2026 · Tarladan Atölyeye

- Görsel geri bildirim doğrultusunda 1.4'ün çayır malzemesi, ağaç renkleri, yüzey gölgelendirmesi ve masaüstü kamera uzaklığı geri getirildi. Telefonda mevcut yakın kadraj korunur. Bahçeler, yeni ev ve portreler devam eder.
- Çiftlik ekranına ekim planı: mevsim, tohum stoğu, beceriye göre ilk/tekrar hasat süresi, sezon geçişi uyarısı, temel satış geliri ve işleme yolu.
- Domates ve mısır hasattan sonra kökte kalır ve sulanınca yeniden ürün verir. Tekrarlayan hasat tohum çoğaltmaz. Ekinler çapa ile sökülebilir; mevsim dışında büyüme duraklar.
- Makinelere tek parti, isteğe bağlı otomatik tekrar ve sekiz alternatif tarif. Malzeme partinin başında ayrılır; duraklatma ve kayıt sırasında korunur. Dolu çantada bitmiş ürün makinede bekler; sökmede ayrılmış girdiler geri alınır.
- Yeni makineler oyuncunun başlatmasını bekler; eski kayıtların otomatik döngüsü ve kısmi ilerlemesi korunur. Tarif/tekrar/parti komutları sunucuda doğrulanır.
- Sistem eksikleri kaynak kod üzerinden önceliklendirildi: `docs/system-gap-review.md`. Eski sayısal içerik kotaları yerine birbirini besleyen kararlar öncelikli.

## 1.5.0 — 22 Eylül 2026 · Meyve Bahçesi

- Çiftlik evi yeni kiremit çatı, veranda, pencere kutuları, baca ve yükseltmede çatı penceresiyle yeniden modellendi. Daha yakın masaüstü kamera, yumuşak modeller, mevsim renkleri ve çiçekli çayırlar; çimen dokusu dünya boyunca kesintisiz ve düşük kontrastlıdır.
- Su kareleri arasındaki keskin renk farkı azaltıldı. Gece ortam ışığı okunabilir hâle getirildi; karakteri izleyen sıcak fener ışığı gölge haritası üretmez.
- Gezgin ve üç köylüye özgün portreler; köylü modellerine farklı saç, önlük ve başlıklar. İsim levhaları metne göre boyutlanır.
- Elma ve armut bahçeleri: fidan satın alma, dikme, 2/3 günde görünür büyüme, mevsimsel günlük hasat ve kalıcı kayıt. Tam çantada ürün dalda kalır; aynı gün ikinci hasat alınamaz. Uzak bölgelerdeki ağaçlar da takvim yaşını korur.
- Çiftlik ekranında bahçe yönetimi, hazır ürün durumu ve ağaca gitme. İnşa menüsünde Bahçe kategorisi, çantada Fidanı dik düğmesi; özgün meyve/fidan/yiyecek ikonları.
- Elma marmeladı ve armutlu tart tarifleri, iki bahçe görevi. Uzun vadeli meyve hedefi beklerken kısa görevler görünmeye devam eder; alınabilecek ödüller önce gösterilir.


## 1.4.0 — 16 Eylül 2026

- Android Chrome için Oyna dokunuşunda Fullscreen API ve yatay yön isteği. Ekran dönüşü, klavye, uygulamaya dönüş ve görünür viewport değişimleri izlenir; 540 px asgari dünya yüksekliği kaldırıldı. Canvas güvenli alan dolgusu olmadan ekranı kaplar, kontroller çentik ve gezinme alanından uzak tutulur.
- Mobil HUD yeniden düzenlendi: küçük kaynak/sağlık satırları, 104 px joystick, 44 px araçlar, ayrı etkileşim ve saldırı düğmeleri. İnşa/ekim/sulamada öndeki kareye dokunmatik eylem eklendi. Kamera telefonda daha yakından başlar.
- Yatay menüler 86 px kategori sütunu ve bağımsız kayan içerik kullanır. Eşya kartları küçültüldü; üretim, inşa, çiftlik ve ayarlar yatayda sütunlara ayrıldı. Kapat düğmesi 44 px ve sabit erişilebilir; menüden nasıl oynanır sayfasına ulaşılır.
- Hafif başlangıç ekranı sunucudan gelir. Oyun ve Three.js yalnızca Oyna sonrasında yüklenir. Duraklatılmış sabit sahne tekrar tekrar çizilmez. PWA önbelleği oyun açıldıktan sonra hazırlanır; bekleyen güncelleme kaydetme sonrasında etkinleştirilebilir.
- Ayrı sunucu dünyası: HttpOnly/Secure/SameSite oturumu, sunucu zamanı ve çarpışması, komut izin listesi, sıralı nonce, atomik kayıt, yeniden denemede aynı sonucu döndürme, istek/gövde/dünya kapasitesi sınırları. Değişen harita alanları gönderilir. Cihaz kaydı sunucuya aktarılmaz.
- COOP same-origin ve HSTS includeSubDomains eklendi; ilerleme çubuklarının erişilebilir adları tamamlandı. Yeni HTTP kontrolü hafif açılışı ve oturumsuz/yabancı kaynaklı sunucu isteklerinin reddini doğrular.


## 1.3.1 — 15 Eylül 2026

- Kameraya yapışan opak bulut modelleri, dünya koordinatlarına bağlı seyrek ve şeffaf bir sis katmanıyla değiştirildi. Kenarlar yumuşak; gölge ve derinlik yazımı yok; tek çizim çağrısı.
- Worker yanıtlarına altı güvenlik başlığı, HTML scriptlerine her istekte yeni nonce eklendi. Statik dosyalar da başlıklarla korunur. Üretim HTTP/CSP kontrolü CI'a eklendi.
- Drizzle Kit 0.31.10 korunarak @esbuild-kit/core-utils altındaki esbuild 0.25.12'ye sabitlendi. Dört moderate audit bulgusu giderildi; geçici klasörde SQL şema üretimi doğrulandı.
- Kayıt yükleme hatası ana menüde kalıcı kırmızı mesajla görünür; bozuk dosya mevcut çiftliği değiştirmez.
- Kullanıcının bulut, güvenlik, PageSpeed, kayıt/CORS ve gelecekteki egress maddeleri gelişim planına eklendi.

## 1.3.0 — 14 Eylül 2026

- Mobil yön tuşları yerine 360° analog joystick eklendi; merkez uzaklığı hızı belirler, bırakma/odak kaybı hareketi sıfırlar. Yatay/dikey araç çubuğu ayrıldı, dokunma alanları büyütüldü.
- İki parmakla yakınlaştırma ve hareket sonrasında yanlış tıklamayı önleyen dokunma takibi eklendi.
- Ana ekrana ekleme, tam ekran, uygulama simgeleri ve çevrimdışı uygulama önbelleği eklendi.
- D1 kimliği tek yapılandırmadan alınır; her derlemenin çıktısı otomatik doğrulanır ve düzeltilir.

- Nehir yüzeyini örten taban geometrisi düzeltildi; mavi su, yansıma ve kıyı köpüğü iyileştirildi.
- Hayvanlara eklemli bacak hareketi, kamp ateşine alev hareketi, bitkilere hafif rüzgar eklendi. Hasatta gölge haritası yenilenir.
- Hayvanlara bağımsız kafa ve nefes hareketi, karaktere yumuşak animasyon geçişleri eklendi. Kış yağışı kar olarak çizilir; hava efektleri keşif kamerasını izler.
- Dört mevsime özgü özgün müzik dizileri, maden teması ve konuma bağlı gece böcek sesleri eklendi. Aktif eylem parçacıkları 42 ile sınırlandı.
- Küçük bitkiler geçilebilir; ağaç çarpışması gövdeyle sınırlıdır. 1–8 araç kısayolları geri getirildi.
- Adım ve malzemeye özgü eylem sesleri, rüzgar, akarsu, kuşlar ve gündüz/gece müziği; üç ayrı ses ayarı.
- Görseller WebP oldu (14.02 → 0.92 MB). Menü ihtiyaç anında yüklenir; Three.js paketleri ayrıldı. Gerçek yükleme ilerlemesi ve 3 MB derleme bütçesi eklendi.
- Hazır olmayan co-op girişi menülerden kaldırıldı, bağımsız yayında uç nokta kapatıldı. Gelecek çevrimiçi aşamalar belgelendi.
- Node 22.13 test uyumluluğu, GitHub doğrulama iş akışı, OG meta ve kayıt geçişi kontrolleri eklendi.

## 1.2.0

- Birleşik menü, A* yol bulma, ortak depo, NPC rutinleri ve Host-Join altyapısı.
