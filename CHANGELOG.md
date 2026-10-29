# Değişiklikler

## 1.13.2 — Mobil menü kapatma · geliştirme dalı, yayımlanmadı

- Mobil navigasyonun şeffaf tam genişlik katmanının X dokunmasını yutması düzeltildi: boş katman hit testing'den çıkarıldı, etkileşimli çocuklar korundu, kapatma hedefi üst katmana alındı ve 48×48 yapıldı.
- Mobil menü altında ayrı 44px Kapat alternatifi; mevcut Back/Escape yolu korundu. Menünün yüksekliği 720px ile sınırlandı; filtre/sıralama tek satır, yinelenen eşya başlığı azaltıldı.
- Gerçek Panels/Base UI ve derlenmiş CSS üzerinde hit testing + sentetik touch ile aç/kapat/yeniden aç, açık navigasyon, alternatif kapatma, Back ve Escape regresyon fikstürü eklendi.
- Kullanıcının Android'de hareket/balta-saldırı/iki parmak kamerası geçti; X başarısızdı. Envanterin büyük panel hissi ve deponun keşfedilememesi sonraki UI/Inventory işi olarak kaydedildi. Fiziksel cihazda yama kabulü henüz yok; ekonomi/şema/online/Sentry/CSP değişmedi.

## 1.13.1 — Mobile Recovery · geliştirme dalı, 29 Ekim 2026

- Gerçek Android kullanıcı geri bildirimi sonrası daha içeride ve safe-area uyumlu joystick; oyun kaydından ayrı sağ/sol düzeni, boyut ve hassasiyet tercihi.
- Ayrı büyük kullanım ve saldırı düğmeleri, tek bırakma/iptal davranışı; mobil seçili araç için menzil içi uygun hedef. Menü/arka plan/resize sırasında takılı joystick/kamera girdisini bırakma.
- Native Section yerine gruplu oyun içi bölüm düğmeleri; aktif bölüm, erişilebilir odak/Escape ve aynı URL'de Back ile menüyü kapatma.
- Ortak ikon bileşeninde metin flex kurallarından ve kutu oranından bağımsız SVG kırpması; tohum/yem/ekmek/patates komşu atlas parçaları temizlendi. Kaynak görseller ve bağımlılıklar korunur.
- Mobil çantada büyük yuva ve açılır ayrıntı; depo seç/yön/onay akışı, güncel miktar/kapasite kontrolü, çift onay koruması. Ekonomi/kayıt/online protokolleri değişmez.
- Master plan, sanat rehberi/Three.js kaynak haritası, portal/domain/Android/münhasırlık kararları ve güncel 25 audit kaydı. Fiziksel Android/iOS/PWA kabulü ve yayın ayrı bekler.
- [Doğrulama ve açık işler](docs/verification-mobile-1.13.1.md). Gerçek hotbar, ekonomi dengesi veya tüm sanat tasarımı bu paket değildir.

## 1.13.0 — Gameplay Foundation · 29 Ekim 2026

- İsteğe bağlı TR/EN İlk Adımlar: mevcut sayaçlarla yedi temel hedef, araç seçimi ve ilgili menüye geçiş. Yeni ödül/görev kilidi veya otomatik ekonomik eylem yok.
- Rehber HUD düğmesi kapatılıp yeniden açılabilir; tercih oyun kaydından ayrı saklanır. Ortak ilerleme ve çevrimdışı menüde zamanın durması açıklanır.
- Altı araç için mevcut enerji, yükseltme ve kullanım notları; kazanım mesajları yalnız gerçek Engine/sunucu olayında ikonla vurgulanır.
- Başlangıç ekonomisi için üç tohumda karşılaştırmalı senaryo ve `audit:first-session`. Sade profil yalnız deneydir; yeni/eski gerçek dünyaların başlangıcı ve ekonomisi değişmez.
- 1.14.0 gerçek envanter/hotbar veri sözleşmesi ve göç/test matrisi tasarımı. Bu sürüme hotbar veya kayıt şeması değişikliği eklenmedi.
- Doğrulama: `docs/verification-gameplay-1.13.0.md`; ilk oturum incelemesi: `docs/gameplay-foundation-1.13.0.md`.

## 1.12.0 — Çantam ve Kampım · 29 Ekim 2026

- Türkçe/İngilizce altyapısı; yeni ilk açılış İngilizce, açıkça saklanan dil tercihi korunur.
- Masaüstünde üç gruplu kamp gezinmesi; küçük ekranlarda tek bölüm seçicisi ve kaydırılabilir içerik.
- Çantada özgün ikonlu eşya yuvaları, miktarlar, kategori filtresi, yalnız görünümü sıralama ve seçili eşya ayrıntısı. Kullanmak, ekmek veya yerleştirmek ayrı açık eylemdir; mevcut çanta/kapasite ve kayıt biçimi değişmez.
- Varsayılan kompakt HUD; hayati değerler korunur, geniş ayrıntılar açılabilir. Kare tanılaması yalnız `?profile=1` ile görünür.
- Oyun kabuğunda yanlış yazı seçimini azaltan, giriş/kod/kopyalanabilir metinleri koruyan seçim kuralları.
- Mobil dikey/yatay panel hizası ve görev başlığının dar sütuna sıkışması düzeltildi; açık menüde Tab odak dolaşımı korunur.
- Güncel main'in Sentry 11.10.0 bağımlılığı ve dar CSP izni korunur. Hata çıkışında oyuncu/kayıt/istek verisini dışlayan filtre ve regresyon testi eklendi.
- Roamcroft 2.0 master planı, İngilizce ana README ve Türkçe alternatif. Bu sürüm 2.0 hedeflerinin bütünü değildir; yayın durumu commit kontrolleri ve teslim kaydıyla doğrulanır.
- Gerçek eşya hotbar'ı, ekipman, sürükle-bırak, ekonomi değişikliği, ortak maden ve portal SDK/reklam bu pakete dahil değildir.
- Doğrulama kaydı: `docs/verification-ui-1.12.0.md`.

## 1.11.5 — Hafif Kamera · 5 Ekim 2026

- Kamerada görünür kalan dünya parçalarının konum ve renk tamponları yeniden yazılmaz. Görüşe giren/çıkan parçalar için yerinde güncelleme yapılır; modeller, renkler ve ayrıntılar korunur.
- Görünür nesneler değişmediyse culling işlemi gölge haritasını gereksiz yere yeniden çizdirmez.
- Bölge kaldırma, tampon büyümesi ve aynı karede birden çok arazi değişikliği için regresyon kontrolleri; ölçüm yöntemi ve sınırlar `docs/verification-1.11.5.md` içinde.

## 1.11.4 — Sakin Akış · 4 Ekim 2026

- Oyun ayrıntılı görüntü kapalı, dengeli modda başlar. Ayarlardan ayrıntılı mod elle açılabilir.
- Online tampon, sabit RTT yerine son 40 dünya hareketi paketinin geliş düzensizliği ve kayıplarına uyum sağlar. İlk bağlantının 650 ms güvenli başlangıcı korunur; kararlı akışta kademeli olarak 120 ms'ye iner. Eski kesintiler tamponu kalıcı olarak yüksek tutmaz.
- Online hayvan konumları görüntü tarafında yumuşatılır; seyrek dünya güncellemeleri modeli doğrudan sıçratmaz. Yürüme/dinlenme animasyonları görsel harekete bağlanır. Gerçek konum, ürünler, etkileşimler ve kayıt sunucu kontrolünde kalır.
- Ağ RTT'si, paket geliş düzensizliği ve tampon ayrı gösterilir. Gerçek kullanıcı bağlantısındaki RTT'nin düştüğü iddia edilmez.

## 1.11.3 — Akıcı Vadi · 4 Ekim 2026

- Hayvanların eklem animasyonları korunarak aynı türün parçaları toplu çizilir; ekran dışındaki hayvanlar çizimden çıkarılır.
- Opak zemin katmanlarında görünmeyen piksellerin tekrar gölgelendirilmesi azaltılır. Ayrıntı, çözünürlük, gölge ve doku kalitesi düşürülmez.
- Arazi eşitlemesinde değişmeyen kareler yeniden hazırlanmaz; bölge geçişinde zemin tamponları döngüsel olarak kullanılır.
- Otomatik kayıt, önceki dünyayı tekrar kopyalamadan atomik iki kayıt rotasyonu kullanır. Eski kayıtlar ve bozuk kayıttan yedek kurtarma desteklenir.
- FPS yanında kare süresi gösterilir. İsteğe bağlı `?profile=1` tanılaması CPU/GPU, p95/p99, %1 düşük FPS ve ağ RTT'sini ayrı ölçer. Gerçek ölçümler ve sınırlar: `docs/performance-audit-2026-10-01.md`.

## 1.11.2 — Hafif Adımlar · 30 Eylül 2026

- Ekran dışındaki dünya modelleri çizim tamponundan çıkarılır; kamera döndüğünde, yürürken ve yakınlaştırırken tekrar görünür. Kaynak modeller, renkler ve dünya değişiklikleri korunur.
- Ayrıntılı modda yük nedeniyle gölge, çiçek ve ortam animasyonları otomatik kapatılmaz. Görüntü çözünürlüğü düşürülmez; ekran dışındaki gereksiz çizim yükü azaltılır.
- Mobil menülerde yan sekmeler yerine 44 piksel yüksekliğinde tek bölüm seçicisi kullanılır. İçerik tam genişlikte kayar; yatay ekranda kartlar iki sütuna yerleşir ve bölüm değişince kaydırma başa döner.
- Çizim yükü, kare süresi ve görünür nesne sayıları için saniyelik tanılama; kaynak dönüşümleri ve ayrıntılı mod için regresyon testleri. Ölçümler ve sınırlar: `docs/verification-1.11.2.md`.

## 1.11.1 — Berrak Vadi · 28 Eylül 2026

- Görüntü çözünürlüğü oyun sırasında otomatik olarak küçültülmez. Yük altında gölge ve çevre efektleri azaltılır; seçilen netlik korunur.
- Menü, yükleme, arka plan ve yeniden devam edilen ilk kare performans bütçesini düşürmez.
- Balta, kazma ve diğer elde tutulan araçlarla binaların yönetim ekranı açılır. İnşa yerleştirmesi ve boş elle meyve toplama davranışı korunur.

## 1.11.0 — Aynı Sabah · 28 Eylül 2026

- Ortak uyku: akşam evin yakınındaki tüm bağlı oyuncular hazır olduğunda tek bir sabaha geçilir. Uzaklaşma, kopma, yeni katılım veya süre aşımı onayları sıfırlar.
- Kaydet ve başlangıca dön: mobilde sekme kapatma girişimi kaldırıldı; kayıt onayından sonra sahne ve bağlantılar kapatılır. Kayıt hatasında oyun korunur.
- Köy dönüm noktalarıyla açılan altı özgün hikâye bölümü, geçmiş bölümler ve NPC'lerin köyün gelişimine tepkileri.
- Ortak maden, bağımsız bölge keşfi, uzun vadeli ekonomi ve fiziksel Android testleri açık öncelikler olarak korunuyor.

## 1.10.1 — Depodan Tezgâha · 28 Eylül 2026

- Tarif, makine ve günlük siparişlerde eksik miktar, depo/teslimat stoğu ve malzemenin kaynağı gösterilir.
- Tek tuşla yalnızca eksik miktar ortak depodan alınır. Çanta kapasitesi ve bütün girdiler sunucuda kontrol edilir; yetersiz stokta kısmi aktarım yapılmaz.
- Üretimin neden kapalı olduğu düğmede belirtilir: istasyon, kuyruk, enerji veya malzeme.
- Kayıt biçimi ve hareket protokolü değişmedi. Ortak depoya yarışan oyuncular, yinelenen istek ve oda yeniden kurulumu için regresyon testleri eklendi.

## 1.10.0 — Birlikte Adım Adım · 27 Eylül 2026

- Ortak çiftlik hareketi WebSocket ve oda başına Durable Object'a taşındı: 20 Hz otorite, 10 Hz snapshot, sequence/tick, ACK ve eski paket reddi. HTTP artık ortak karakterin konumunu değiştiremez.
- Yerel hareket tahmini ve sunucu onayıyla uzlaştırma; ölçülen RTT/jitter/snapshot boşluklarına göre 650 ms'den kademeli ayarlanan 120–650 ms uzak oyuncu tamponu.
- Ekonomik komutlar atomik DO kaydından sonra onaylanır; D1 checkpoint'leri revision/hash ile korunur. Reconnect, host kopması ve runtime yeniden başlatması için kimlik ve çanta devamlılığı testleri eklendi.
- Hareketsiz oyuncu da kendi otoriter konumunu ve donmuş oda durumunu alır. Koşulu tıklama yürüyüşünde enerji iki kez tüketilmez.
- İlk hedefler toplama → çapa → ekim → hasat sırasına alındı. HUD ve köy günlüğü aynı hedefi önerir; hazır ödüller önce gösterilir. Mevcut görev kimlikleri, ödüller ve kayıt formatı korundu.
- Dört bağlantılı gerçek Worker testi, 50/100/200/300 ms gecikme ve bozuk mesaj koşulları CI kapsamına alındı. Ölçümler ve sınırlar: `docs/verification-1.10.0.md`.

## 1.9.1 — Kesintisiz Ortak Vadi · 26 Eylül 2026

- Harita penceresi değişince sahne, kamera ve ses yeniden kurulmaz. Mevcut sahne yeni araziyi parça parça işler; yürüyüş rotası korunur.
- Uzak oyuncular zaman damgalı hareket geçmişinden çizilir. Yinelenen/eski örnekler atılır; kısa kayıpta tahmin sınırlıdır, geç paket ani konum sıçraması yapmaz.
- Ağ isteğinin süresi 500 ms güncelleme aralığına dahildir; yanıtın üzerine bir 500 ms daha eklenmez. Tek uçuş ve hata beklemesi korunur. Durum çubuğu son isteğin ölçülen gidiş-dönüş süresini gösterir.
- Kendi karakterinin yanıt beklerken yaptığı hareket korunur; sunucu çarpışma düzeltmeleri uygulanmaya devam eder.
- Bağlı oyuncular ortak keşif sınırında durur; host uzaklaşınca konukları geri çeken olağan hareket engellenir. Host bulunamayan ilk açılışta kişisel çiftlik açılır.
- Sınırlar: HTTP senkronizasyonu, 20 kare ortak keşif ve 650 ms uzak oyuncu görüntü tamponu. İnternet gecikmesi sıfırlanmaz; ölüm, eve dönüş ve uzun kopuştan dönüşte güvenli konumlandırma sürer.

## 1.9.0 — Birlikte Büyüyen Çiftlik · 25 Eylül 2026

- Başlangıç ekranından **Arkadaşlarla oyna → Online**: dört kişilik davet kodlu ortak yüzey çiftliği. Host önce ortak çiftliğe girer; konuklar ona katılır. Tarım, kaynak toplama, inşa, balıkçılık ve mevcut yüzey eylemleri tek sunucu kaydında işlenir.
- Her oyuncunun ayrı karakteri, canı, enerjisi ve çantası var. Altın, dünya zamanı, ekinler, yapılar, depo ve ilerleme ortak. Konuk çantası boş başlar; ayrılma ve yeni davet lobisinden dönüşte korunur. Sandıkla eşya paylaşılır.
- Üretim kuyruğu ve makineler ürünü malzemeyi ödeyen oyuncuya teslim eder. Makinenin otomatik tekrarı aynı oyuncunun çantasını kullanır. Oyuncu lobiden ayrılsa da teslimat kaybolmaz.
- Ortak kayıt host'un sunucu çiftliğinden bir kez kopyalanır, ardından ayrı ve host'a bağlı Cloudflare D1 kaydıdır. Kişisel çiftlikler değiştirilmez. Host 15 saniye bağlantı vermezse konuk işlemleri bekletilir; 5 dakikada lobi kapanır. Host tekrar açtığında kayıt geri gelir.
- Sunucu üyelik ve komutları doğrular; nonce, sıra numarası, aynı isteğin güvenli tekrarı, istek kotası ve atomik revizyon kontrolü uygulanır. Aynı hasat veya depodaki son eşya iki kez alınamaz. Tam harita yerine sıralı fark güncellemeleri gönderilir; kaçırılan geçmişte tam kayıtla eşitlenir.
- Oyuncular ayrı renklerle görünür; uzak oyuncu sıçraması ve dünya penceresi değişiminde yeniden yükleme sorunu düzeltildi. Online sekmesi, küçük ekranlara uygun kaydırılan lobi ve araç çubuğunu örtmeyen masaüstü bağlantı durumu eklendi.
- Protokol sürümü uyuşmazlığında işlemler durur ve yenileme istenir. Rate-limit bekleme süresine uyulur. Sunucu hataları sır, oyuncu adı veya istek gövdesi olmadan korelasyon kimliğiyle kaydedilir. Onay bekleyen komutlar artık kaydedildi diye gösterilmez.
- Beta sınırları: yalnızca host çevresindeki ortak yüzey; maden, bağımsız bölgeler, oyuncuya özel kulübe ve toplu uyku henüz yok. IP/port gerektirmeyen HTTPS bağlantısı kullanılır; P2P/WebSocket veya Steam entegrasyonu değildir. Hesap kurtarma henüz yok; oturum çerezini silmek erişimi kaybettirir.

## 1.8.0 — Canlanan Vadi · 24 Eylül 2026

- Kelebekler, ateşböcekleri, yağmur/kar ve yeni seyrek sonbahar yaprakları dünya koordinatlarına bağlı. Kamera yalnızca görünen hücreleri seçer; parçacıkları karakterin peşinden sürüklemez. Hücre geçişlerinde ortak parçacıkların konumu ve evresi korunur.
- Başlangıç köyündeki basamaklı kuzey arazi kaldırıldı. Eski kayıt ve arşivlenmiş bölgeler düzleştirilirken mahsuller, yapılar ve su korunur; maden duvarları değiştirilmez.
- On yapı için özgün hareketli detay: testere, körük, yem çarkı, asılı balıklar, dokuma mekiği, yayık, tencere kapağı, arılar, kuyu kovası ve sulama başlığı. Değirmen üretim durunca durur. Çalışmayan makine hareketsiz; uzak ve düşük bütçeli ayrıntılar azaltılır.
- Tavuklara kanat/sevinç ve gagalama ayrıntısı; koyun ve ineklere kuyruk hareketi; bahçıvan ve balıkçı köylüye farklı çalışma pozu. Mevcut sıcak palet korunur; yeni geometri oyun için yazılmıştır.
- Sunucu dünyası → Ayarlar bölümünde dört kişilik davet lobisi önizlemesi. Davet kodu, üyeler, ev sahibi, ayrılma ve süre aşımı çalışır. Ortak çiftlik senkronizasyonu henüz açık değildir; cihazdaki dünya ayrı kalır.
- Yeni efektler sabit üst sınırlı instancing kullanır. Yapı ayrıntısı başına en fazla iki çizim grubu; uzaklık ve uyarlanabilir ayrıntı bütçesi. 134 test ve üretim derlemesi başarılı; ölçüm sınırları docs/verification-1.8.0.md dosyasında.



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
