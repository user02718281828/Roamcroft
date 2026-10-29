# Roamcroft 2.0 — ana geliştirme planı

Bu belge Roamcroft 2.0 vizyonunun tek ana iş sırası ve durum kaynağıdır.
[AGENTS.md](../AGENTS.md) güvenlik/uyumluluk kuralları geçerlidir;
[PORTAL_ROADMAP.md](PORTAL_ROADMAP.md) portal yayın kapılarını ayrıntılandırır.
Bir plan maddesi çalışan özellik değildir. 2.0 tamamlanmış veya yayımlanmış
sayılmaz. Başlangıç tabanı: 1.11.5 + doğrulanmış TR/EN çalışması. Güncel main'e
ayrıca `1e302c3` Sentry entegrasyonu eklenmiştir; UI tesliminde korunur.

## Vizyon ve karar ilkeleri

Yaşayan, sıcak bir köyü; özgür keşif, kaynak toplama, üretim ve inşa ile
birleştiren özgün bir tarayıcı oyunu. Stardew Valley ve Minecraft yalnızca
oyuncu deneyimi referanslarıdır; karakter, arayüz, metin, model, müzik ve oyun
kimliği kopyalanmaz. Önce keyifli oynanış ve kullanılabilirlik, sonra içerik
derinliği, daha sonra ölçeklenme ve gelir.

Her uygulama paketi küçük, tamamlanabilir ve ayrı commit ile doğrulanabilir
olmalıdır. Kullanıcı verisi, ekonomik sunucu otoritesi, DO/D1 atomik kayıtları,
güvenlik başlıkları ve üretim sahipliği korunur. Canlı veritabanı sıfırlanmaz.
Eski kayıtlar kozmetik bir değişiklik için göç ettirilmez. Yeni riskli kayıt,
ekonomi, hesap veya bağımlılık tasarımları ayrı kontrollü işlerdir.

Durum sözlüğü:

- **MEVCUT:** Kodda çalışan temel var; tüm 2.0 hedefinin bittiği anlamına gelmez.
- **EKSİK:** Henüz uygulanmamış veya test kanıtı bulunmayan gereksinim.
- **PLANLANDI:** Aşağıda sırası/bağımlılığı/kabul koşulu belirlenmiş iş.
- **TAMAMLANDI:** Tanımlı paketin kodu ve gerekli doğrulaması bitmiş; yayın durumu ayrıca belirtilir.

## Öncelik sırası ve tamamlanma kapıları

Güncel sürüm sırası: **1.13.0 Gameplay Foundation** (ilk 30 dakika, ekonomi
karşılaştırması, araç hissi/yönlendirme) → **1.14.0 Inventory & Hotbar 2.0**
(gerçek eşya/ekipman/güvenli göç) → **Living World & Online 2.0** (köy,
savaş/keşif, ortak maden, hesaplar, büyük ortak dünya). Son iki aşama uygulanmış
değildir. [1.13.0 araştırması](gameplay-foundation-1.13.0.md) bu sıranın ilk
paketidir. Bu oturumda 1.13.0 için main/Cloudflare yayınına izin yoktur;
somut ve doğrulanmış paket sonrasında ayrıca kullanıcı onayı gerekir.

| Sıra | Paket | Durum / çıkış koşulu |
| --- | --- | --- |
| P0 / 0 | Güvenli GitHub yedeği | **TAMAMLANDI:** `codex/roamcroft-2-ui`, i18n checkpoint `38b4f9315c902ac2415d1aadbddb0e99fc95d3ac`. Typecheck, 193 test, build ve yerel runtime geçti. Main değişmedi. |
| P0 / 1 | UI 2.0 temeli | **TAMAMLANDI (sınırlı paket):** Gruplu menüler, küçük ekran düzeni, sade HUD, ikon yuvalı çanta, seçili eşya ayrıntısı, seçim/kopyalama kuralları, İngilizce ilk açılış. [1.12.0 doğrulaması](verification-ui-1.12.0.md). Fiziksel cihaz ve aşağıdaki diğer 2.0 hedefleri ayrıca eksiktir. |
| P0 / 2 | 1.13.0 Gameplay Foundation | **TAMAMLANDI (sınırlı paket):** İsteğe bağlı İlk Adımlar, araç/eylem geri bildirimi, ölçülebilir ilk oturum hedefleri ve üç seed'de iki profil deneyi. 205 test/typecheck/build/runtime geçti. Gerçek oyuncu ölçümü, onaylı ekonomi değişikliği ve yayın **EKSİK**. |
| P1 / 3 | 1.14.0 Gerçek envanter/hotbar | **PLANLANDI:** [Veri sözleşmesi/göç/test matrisi](inventory-hotbar-1.14-design.md) taslak; kabul sonrası uygulanır. Görsel çanta yuvaları bu mekanik sayılmaz. |
| P1 / 4 | Üretim, köy, keşif ve savaş derinliği | **PLANLANDI:** Ekonomi baz çizgisi ve oyuncu denemeleriyle küçük dikey paketler; salt içerik kotası yok. |
| P1 / 5 | Online erişim ve kurtarma | **PLANLANDI:** Davet UX'i → isteğe bağlı hesap/kurtarma → kalıcı ortak çiftlik UX'i. Otoriteyi koruyan protokol göçleri ayrı yapılır. |
| P1 / 6 | Ortak maden ve bağımsız bölgeler | **PLANLANDI:** Bölgesel ilgi/otorite tasarımı, çok oyunculu maden örnekleri, maliyet ve kurtarma testi gerekir. |
| P0 yayın kapısı / 7 | Güvenlik ve portal uyarlaması | **EKSİK:** Güncel 25 bulgu (tarihsel 23) açık; kontrollü düzeltme, iframe/kayıt/SDK uyumu ve fiziksel cihaz kanıtı olmadan portal çıkışı yok. Güvenlik işi diğer işlerden bağımsız öne alınabilir. |
| P2 / 8 | Analitik, reklam ve ölçek | **PLANLANDI:** İzinler, ölçüm hedefleri, sağlam kayıt ve portal test ortamı sonrasında. Gelir için oynanışa zarar verilmez. |
| P2 / 9 | Prestij ve uzun vadeli içerik | **PLANLANDI:** Gerçek oyuncu tutundurma ve ekonomi sonuçlarından sonra; kayıt sıfırlama kendiliğinden uygulanmaz. |

## 1. Temel oynanış

**MEVCUT:** Tarım, toplama, el/makine üretimi, açık yüzey keşfi, görevler,
köy dönüm noktaları ve oyun rehberi. **EKSİK:** İlk 30 dakikanın yeni oyuncularla
kanıtı, sıfırdan kurma seçeneği, yönlendirilmiş oyuncu deneyi ve başlangıç
kaynaklarının ölçülmüş dengesi. **PLANLANDI / P0:** İlk hasat → üretim → ilk
yapı kararını anlaşılır hale getir; eski çiftliklerin malzemelerini azaltma.
Bağımlılık: UI temeli ve ekonomi baz çizgisi.

**TAMAMLANDI / 1.13.0:** İsteğe bağlı TR/EN İlk Adımlar, salt okunur sayaçlar,
araç/menü seçimi ve ayrı kalıcı tercih. [İnceleme ve deney](gameplay-foundation-1.13.0.md).
Gerçek oyuncu deneyi ve ekonomi uygulaması henüz tamamlanmadı.

Kabul: TR/EN yeni oyuncu testi; hareket/hasat/üretim/yapı için süre ve terk
noktaları kaydı; öğretici atlanıp yeniden açılabilir; eski kayıt aynı kalır;
başlangıç kaynakları değişirse yalnız yeni dünyalar ve sürümlü test fikstürü.

## 2. Araçlar

**MEVCUT:** Balta, kazma, çapa, sulama, kılıç, olta, enerji/mesafe kuralları ve
üç kademeli alet/zırh yükseltmeleri. Animasyon ve ses altyapısı var.
**EKSİK:** Her aletin hissinin oyuncu ölçümü, güçlü darbe/ürün düşme geri
bildirimi, faydaların daha görünür anlatımı. **PLANLANDI / P0–P1:** Araç başına
tek tamamlanmış geri bildirim paketi. Bağımlılık: ilk oturum ve performans bütçesi.

Kabul: Animasyon gerçek vuruşla eşleşir; iptal/menü/gecikmede çift hasar veya
çift ürün yok; uygun mesafe/enerji sunucuda denetlenir; mevcut yükseltme seviyesi
ve maliyetler korunur; dokunma ve klavyede aynı kurallar çalışır.

## 3. Envanter ve hotbar

**MEVCUT:** `Bag = Record<itemId, quantity>`, 600/900 toplam eşya kapasitesi,
ortak depo, taşan teslimatlar, sabit araç çubuğu. **EKSİK:** Gerçek araç eşyaları,
9/10 özelleştirilebilir hotbar, sürükle-bırak, yığın sınırları, ekipman yuvaları
ve kapasite yükseltme tasarımı. **PLANLANDI / P1:** Önce aşağıdaki veri sözleşmesi.
Bağımlılık: ekonomi ve otoriter komut protokolü.

İlk UI paketindeki yuvalar yalnız görünümdür: mevcut miktarları ve kapasiteyi
değiştirmez; boş görsel yuva yeni depolama kapasitesi değildir. Görsel sıralama
çantayı sunucuda yeniden yazmaz. Oyuncu bilerek ayrıntı düğmesine basmadan
tüketme/ekme/inşa yapılmaz.

Önerilen gelecek model (henüz kayıt şeması değildir):

- Sabit eşya kimliği + araç örneği kimliği/upgrade verisi; araçlar çantaya ikinci
  kez çoğaltılmaz. Önce eski alet seviyelerinin bire bir eşlemesi tanımlanır.
- Hotbar dokuz yuvalı referans listesi olur; stok içermez. Referans silinmiş
  veya stok tükenmişse boşalır/etkisiz kalır; miktar üretemez. Onuncu yuva
  ancak masaüstü/mobil testinden sonra kararlaştırılır.
- İlk aşamada sıralama ve seçim istemci tercihidir. Ekipman/taşıma/ayırma/birleştirme
  ekonomik işlemleri sunucuda atomik, nonce/sequence ile tekrar güvenli olmalıdır.
- Eski `Bag` ve alet seviyelerinden toplam miktarı koruyan deterministik göç;
  eski kayıt yedeği, şema sürümü ve protokol pazarlığı. Uygulama öncesi ayrı onay.
- Sürükleme dışında klavye ve dokunma ile seç → taşı/ata yolu; hiçbir işlem
  yalnızca hover veya sürüklemeye bağlı olamaz.

Kabul: Eski/taşmış çanta, dolu depo, bilinmeyen eski eşya, aynı eşyayı iki
hotbar yuvasına atama, kopma/tekrar/paket sırası, tüm yükseltmeler, dört oyunculu
eşzamanlı taşıma ve mobil iptal testlerinde sıfır kayıp/çoğaltma.

## 4. Arayüz 2.0

**MEVCUT:** Merkezi modal, mobil bölüm seçicisi, ortak bileşenler, TR/EN metinler.
**TAMAMLANDI / P0, ilk paket:** Tutarlı kamp grupları, seçili eşya ayrıntısı ve
sakin varsayılan HUD; 1440×900, 390×844, 844×390, 320×568 yerel tarayıcı kontrolü.
**EKSİK:** Fiziksel cihaz/ekran klavyesi/PWA ve oyuncu kullanılabilirlik kanıtı.
Masaüstünde gruplu kamp menüsü; mobilde tek yerel
seçici; modal başlığı/kapatma ve içerik kaydırması; seçili eşya ayrıntısı; az
kalabalık HUD. Bağımlılık: i18n, mevcut odak/duraklama kuralları.

Kabul: 1440×900, 390×844 ve 844×390 görünüm testleri; yatay taşma yok; kapatma,
ana eylem ve dil seçimi erişilebilir; klavye odağı görünür, Esc/Tab/Q/E çalışır;
online menü dünya zamanını durdurmaz. HUD sadeleşirken sağlık/enerji/açlık ve
bağlantı/tehlike uyarıları kaybolmaz. Yazı seçimi oyun kabuğunda kısıtlanabilir;
input, textarea, davet kodu ve işaretli kopyalanabilir metin seçilir. Seçim kuralı
ekran okuyucuyu veya klavye odağını kapatmaz. `translate=no` yalnız bir ipucudur;
tarayıcı çeviri eklentilerinin tümünü engelleme garantisi verilmez.

## 5. Görsel kimlik, ses ve atmosfer

**MEVCUT:** İzometrik Three.js, özgün prosedürel modeller/kaplamalar, özgün eşya
çizimleri, üretken ses/müzik, batching, su/hava/ışık ve eklem animasyonları.
**EKSİK:** Tek sanat rehberinde tutarlılık, daha iyi çalışma/saldırı hissi ve
tatmin edici küçük efektler. **PLANLANDI / P1:** Dünya korunarak küçük alan
paketleri. Bağımlılık: performans ve azaltılmış hareket/ses tercihleri.

Kabul: Orijinal veya açıkça lisanslı kaynak kaydı; lisanssız üçüncü taraf
görsel kopyalanmaz. Efekt oyun verisini değiştirmez; dispose/context recovery
testi; DPR/kalite tercihi ve düşük cihaz bütçesi korunur; ses izinsiz açılmaz.

## 6. Ekonomi ve ilerleme

**MEVCUT:** Seviye/yetenek, makine maliyetleri, sipariş primi, depo/teslimat,
dostluk avantajları. **EKSİK:** Çok günlük toplam emek/bakım dengesi ve başlangıç
fazlalığının oyuncu kanıtı. **PLANLANDI / P0 araştırma, P1 uygulama:** Yeni dünya
senaryoları ve çok günlük ekonomi raporu. Bağımlılık: gerçek oynanış ölçümleri.

Kabul: Satış/üretim/yükseltme/inşa arasında en az iki uygulanabilir tercih;
ilerleme yalnız tıklama sayısını artırmaz; eski stoklar/altın/ödüller azaltılmaz;
tamamlanmış ödül ikinci kez verilmez; kooperatif sahiplik ve atomiklik korunur.

## 7. Çiftlik ve üretim

**MEVCUT:** Altı ekin, mevsim, gübre/sulama/sera, meyve bahçesi, üç hayvan,
bakım/yavrulama, 24 yapı, alternatif tarifler ve parti/otomatik üretim.
**EKSİK:** Dekorasyon ve ev/çiftlik kişiselleştirmesi, yeni anlamlı tarifler,
daha derin bakım kararları. **PLANLANDI / P1:** Önce küçük bir kişiselleştirme
döngüsü, sonra yeni zincirler. Bağımlılık: ekonomi, kayıt alanı ve çizim bütçesi.

Kabul: Tarife erişim/maliyet/kapasite anlaşılır; dolu çantada çıktı kaybolmaz;
parti girdileri sökmede iade edilir; uzaktaki üretim kuralları açıkça anlatılır;
dekorasyon eski yapıların çarpışma/yol bulmasını bozmaz.

## 8. Yaşayan köy

**MEVCUT:** Narin, Torin, Lale; rutin, diyalog, sohbet, hediye, günlük sipariş,
dostluk ve ilerlemeye tepki veren altı hikâye bölümü. **EKSİK:** Daha uzun ilişki
gelişimi, özgün olaylar/festivaller ve karar sonuçları.
**PLANLANDI / P1:** Bir NPC için tamamlanmış özgün hikâye döngüsüyle başla.
Bağımlılık: i18n, oyun takvimi, içerik ve kayıt tasarımı.

Kabul: TR/EN kişilik sesi tutarlı; günlük sınırlar/ödüller tekrarda çoğalmaz;
oyuncu kararı kayda doğru yansır; eski dostluk/görevler göçte korunur. Mevcut
olmayan evlilik/festival tamamlanmış özellik olarak tanıtılmaz.

## 9. Keşif, savaş, maden ve balıkçılık

**MEVCUT:** Beş düşman türü, akın, alan uyarıları, kule/sur, beş katlı maden ve
boss, tek genel balık ürünü. **EKSİK:** Düşmanların çok kolay olduğu iddiasının
ölçümü, kaçınma/savunma/ganimet derinliği, yeni gizemler ve balık mini oyunu.
**PLANLANDI / P0 araştırma, P1 içerik:** Farklı ekipman/seviyelerde savaş matrisi;
ardından telegraph/AI ve bir keşif paketi. Bağımlılık: araç hissi ve ekonomi.

Kabul: Vuruş süresi, hasar, düşmana yaklaşma, kaçınma ve ekipman farkı ölçülür;
sadece can artırarak denge sağlanmış sayılmaz. Hasar/ganimet sunucu otoritesinde;
ölüm, maden kontrol noktası ve yüzey geri dönüşü kayıt testlerinden geçer.

## 10. Online 2.0

**MEVCUT:** Misafir kimliği, davet lobisi, kişisel/ortak ayrı kayıtlar, dört
oyuncu, ortak uyku, HTTP ekonomik ACK ve DO 20 Hz / WS 10 Hz hareket.
**EKSİK:** Okunabilir sekiz karakterli kod, bağlantıyla katılma, sade lobi,
isteğe bağlı hesap/kurtarma/arkadaşlık, ortak maden/asansör/boss, bağımsız uzak
keşif ve ortak çiftlik sahipliğinin anlaşılır yönetimi.
**PLANLANDI / P1–P2:** Önce giriş/kurtarma, sonra bölgesel simülasyon.

Sekiz karakterli kod tasarımı: karışmayan alfabe ve kriptografik rastgelelik;
örneğin 32 sembol × 8 karakter = 40 bit kod uzayı. Kod kimlik doğrulama veya
kalıcı hesap sırrı değildir. Kota, kısa ömür, üyelik, deneme sınırı, çakışma
yeniden üretimi ve iptal gereklidir. URL daveti kayıtlara/referrer'a sızmamalı;
ilk katılım sonrasında URL temizleme ve eski kod uyumluluğu ayrıca tasarlanır.

20 kare sınırının mimari çözümü: hareket penceresini CSS veya istemci sabitiyle
büyütme. Oda otoritesinde oyuncu/bölge ilgi alanları, etkin chunk bütçesi,
paylaşılan takvim ve uzak üretim politikası; ardından maden örneği/asansör
grup geçişi, düşman/ganimet sahipliği ve checkpoint'ler. Gerekiyorsa çok oda
otoritesi için koordinasyon/ekonomik işlem tasarımı ve maliyet modeli.

Kabul: Eski misafir erişimi, profil/çanta/üretim alıcısı kaybolmaz; aynı davet
ve ekonomik komut tekrarında çoğaltma yok; dört WS istemcisi + gerçek WAN;
kopma/yeni katılım/boss ölümü/asansör oylaması atomik; D1/DO çakışması veri
üzerine yazmaz. Oturum sırrı istemci loguna/analitiğe konmaz.

## 11. Diller

**TAMAMLANDI, i18n temeli:** TR/EN merkezi sözlük, tip güvenliği, kalıcı seçim,
kanonik kayıt/ağ metninden ayrı istemci gösterimi. **TAMAMLANDI / P0:** İlk kez
açıldığında tarayıcı dili ne olursa olsun İngilizce; açıkça kaydedilmiş `tr`
veya `en` korunur. Bu kullanıcı talimatı eski tarayıcı algılama kararını değiştirir.
Yeni dil eklenmez. **EKSİK:** Editoryal İngilizce inceleme ve sosyal kartlar.

Kabul: Temiz/depolaması kapalı TR tarayıcı da İngilizce başlar; kayıtlı Türkçe
korunur; dil değişimi Engine/bağlantıyı yeniden başlatmaz; kullanıcı adları
çevrilmez; sözlük/yer tutucu eşliği ve iki manifest kimliği korunur.

## 12. Portal altyapısı

**MEVCUT:** Yerel üretim Worker, PWA, context recovery, CSP ve bütçe denetimleri.
**EKSİK:** CrazyGames, Playgama, GameDistribution, itch.io ve olası Poki için
doğrulanmış teknik/ticari gereksinimler ve SDK adaptörleri.
**PLANLANDI / P1 yayın kapısı:** Her hedef seçildiğinde güncel resmi koşullar
araştırılır; adları listelenmiş olması başvuru/kabul/uyumluluk anlamına gelmez.

Bağımlılık: güvenlik düzeltmeleri, onboarding, kayıt kurtarma, performans.
Kabul: SDK olmadan oyun açılır; loading/gameplay/pause yaşam döngüsü doğru;
iframe/origin/çerez/Cloud Save kısıtları ve context loss testleri geçer. Mevcut
`frame-ancestors 'none'`/X-Frame-Options koruması gelişigüzel gevşetilmez;
hedefe özel çerçeve izni ayrı güvenlik tasarımı ister.

## 13. Para kazanma ve analitik

**EKSİK:** Reklam, portal SDK onayları, sıklık sınırları, rıza/mahremiyet ve
tutundurma ölçümü. **PLANLANDI / P2:** Önce temel yükleme/onboarding ölçümü;
sonra doğal duraklarda midroll ve yalnız açık oyuncu tercihiyle rewarded.
Bağımlılık: portal adaptörü, güvenilir kayıt, uygulanacak izin/yaş kuralları.

Kabul: Reklam hatası/iptal oyunu veya eşyayı kaybettirmez; ödül tek seferlik,
otoriter ve tekrar güvenlidir; ortak dünya keyfî durdurulmaz. Ham kayıt, çanta,
oturum çerezi, davet kodu ve kişisel metin analitiğe gitmez. Oturum/ilk anlamlı
ilerleme/geri dönüş ölçümleri tanımlanır; veri kaybı veya zorunlu reklamla gelir
artışı başarı sayılmaz.

## 14. Uzun vadeli oyun

**MEVCUT:** 12 başarım, dört koleksiyon, köy mirası hedefleri ve fener sonrası
serbest oyun. **EKSİK:** Tekrar oynanabilir olaylar, gizli içerikler, prestij ve
düzenli içerik döngüsü. **PLANLANDI / P2:** Önce oyuncu geri dönüş nedenleri;
prestij ancak korunan ödül/sıfırlanan veri/geri dönüş sınırları kararlaştırılınca.

Kabul: Yeni içerik mevcut ilerlemeyi geçersiz kılmaz; prestij açık onay/yedek
ve ortak çiftlik sahiplik kuralı olmadan kaydı sıfırlamaz; TR/EN içeriği birlikte
çıkar; eski ödüller ikinci kez alınamaz.

## 15. Güvenlik

**MEVCUT:** Kaynak/üyelik/nonce/sequence/kota/boyut kontrolleri, güvenli çerez,
CSP, otoriter ekonomi ve çakışmada durma. **EKSİK:** Güncel audit **25 paket
bulgusu: 3 kritik, 10 yüksek, 11 orta, 1 düşük**. Tarihsel 23 (9 orta) sonucu
arşivdir. 1.13.0'da yeniden doğrulandı, bağımlılık yükseltilmedi; sıfır audit iddiası yok.
**PLANLANDI / P0 yayın kapısı:** [Portal yol haritasındaki](PORTAL_ROADMAP.md)
kontrollü gruplarla düzeltme. Bu UI paketi bağımlılık yükseltmez.

Kabul: Araç zinciri ve canlı Worker erişilebilirliği ayrı kanıtlanır; yeni
`npm audit --json`/üretim alt kümesi ve lock diff'i incelenir; formatter/Vite,
shadcn/MCP/Express/Zod, Cloudflare/Sharp/Undici ve kalan OG/framework zincirleri
uyumlu gruplarla doğrulanır. `deepmerge` için upstream/CLI ayrımı takip edilir;
otomatik `audit fix --force` ve CSP gevşetme yoktur.

## 16. Kalite

**MEVCUT:** Tip kontrolü, mekanik/kayıt/otorite/online testleri, bütçe ve yerel
üretim runtime kontrolü. **EKSİK:** Fiziksel Android, gerçek WAN/çok cihaz,
uzun oturum/ölçek/maliyet, erişilebilirlik ve mahremiyetli çökme raporu kanıtı.
**PLANLANDI / bütün paketler:** Değişikliğe uygun kabul matrisi ve doğrulama kaydı.

Kabul: Eski kayıt/yedek, dolu çanta, üretim sahipliği, negatif koordinat,
streaming, reconnect ve ortak uyku regresyonları. Dil ve odak/klavye, azaltılmış
hareket, menü taşması. FPS/CPU/GPU/RTT ayrı ölçülür; masaüstü mobil viewport
fiziksel cihaz testi sayılmaz. Yerel test verisi canlı veritabanına yazılmaz.

## 17. GitHub, belgeler ve yayın

**MEVCUT:** GitHub deposu, doğrulama Actions'ı, main üzerinde başarılı Cloudflare
Workers Builds kontrolü. Pages API sorgusu 404 döndü; Pages kaynak kabul edilmez.
**TAMAMLANDI (1.12.0 paketi):** Güncel İngilizce README, Türkçe alternatif,
gerçek yerel ekran görüntüleri ve changelog/doğrulama kaydı.
**PLANLANDI / her yayın:** Kaynak ve tanıtım sürümünü eşitle; tarihsel ekranları
arşiv olarak etiketle veya ana tanıtımdan çıkar. Depo açıklaması gerçek özellikleri anlatır.

Kabul: Her pakette typecheck/test/build/ilgili runtime ve yalnız kaynak dosyalı
commit; `.env`, sırlar, `work`, `node_modules`, `dist` gönderilmez. `codex/`
dalına push, CI ve remote SHA doğrulaması. Main/üretim yayını için kullanıcının
o oturumdaki açık kapsamı esas alınır. 29 Ekim güncel devam talimatı, tamamlanmış
1.12.0 paketinin tüm kritik kontrolleri ve Sentry birleşimi sonrası normal main
push/otomatik yayınına izin vermişti; bu teslim tamamlandı. 1.13.0 görevi için
güncel talimat ayrı yayın onayı ister; önceki 1.12.0 izni yeni sürüme taşınmaz.
Canlı açılış kontrolü tek başına bir dağıtım veya yeni sürüm kanıtı
olarak sunulmaz; dağıtım yapılırsa yayımlanan SHA ayrıca eşlenir.

## 29 Ekim 2026 altyapı ve kalite güncellemesi

- **MEVCUT / kullanıcı tarafından canlı doğrulanmış:** Sentry `@sentry/react`
  11.10.0, main `1e302c3`, ROAMCROFT-3 canlı test kaydı. Sponsored Team planının
  28 Ekim 2027'ye kadar geçerli olduğu kullanıcı tarafından bildirildi; hesap
  planı bağımsız kontrol edilmedi. SDK/CSP bu pakette korunur. Yeni mahremiyet
  filtresi hata türü/kod konumu/sürümü saklar; serbest mesaj, oyuncu, istek,
  breadcrumb, kayıt ve ekleri göndermez. Son sürümde teslimat ayrıca doğrulanır.
- **MEVCUT / kullanıcı testi:** BrowserStack iPhone 15 Pro / Safari üzerinde
  eski canlı oyun açıldı; yatay tam ekran beklentisi karşılanmadı. Yeni UI için
  fiziksel cihaz kanıtı değildir. **EKSİK:** Yeni UI'de iOS Safari ve Android
  Chrome dikey/yatay; çentik, joystick/kamera, klavye, PWA Ana Ekran ve yaşam
  döngüsü. Tarayıcı çubuğunu gizleme ile oyunun görünür alanı kullanması ayrı
  test edilir; Safari'nin desteklemediği fullscreen davranışı vaat edilmez.
- **PLANLANDI / P1:** [CodeScene kaynaklı modülerleştirme planı](modularization-plan.md).
  29 Ekim GitHub analizi: genel 7,4, hotspot 4,9; model 1,15, scene yaklaşık 1,7.
  Kullanıcı özeti kaynak alınmıştır. UI öncesi yerel değişiklikleri kapsamayan
  bir bakım göstergesidir; oyun hatası/güvenlik açığı kanıtı değildir. act,
  createState, combat, systems, wanderAnimals, tick için önce davranış testleri.
  Büyük motor/çizici değişikliği bu pakete dahil değildir.
- **GÜNCEL DENETİM:** 29 Ekim `npm ci`/`npm audit --json`: **25 paket bulgusu**,
  3 kritik / 10 yüksek / 11 orta / 1 düşük. Tarihsel 23 sonuç korunur, giderilmiş
  sayılmaz. Toplu güncelleme yok; araç zinciri/canlı erişilebilirlik ayrı kontrollü iş.
- Domain satın alınmadı (kullanıcı bildirimi). Güncel adres
  `https://roamcroft.roamcroft.workers.dev/`. Domain/DNS/origin taşıma bu işin
  kapsamında değil. Gelecek taşımada IndexedDB ve güvenli oturum otomatik
  taşınmaz; yerel dışa aktarma ve hesap/kurtarma ayrı çıkış koşuludur.

Sonraki sıra: ilk 30 dakika/başlangıç ekonomisi → gerçek hotbar/araç → toplama,
üretim ve darbe hissi → yaşayan köy → savaş/keşif → Online 2.0. Modülerleştirme,
ilgili riskli davranışa dokunmadan önce küçük test paketleriyle araya girer;
sonrasında portal, performans, izinli analitik ve gelir. Reklam SDK'sı veya
portal hesabı bu UI oturumunda eklenmez.

## Devam protokolü

Yeni oturum önce bu belge, AGENTS, portal yol haritası ve en son doğrulama
kaydını okur; Git/remote durumunu kontrol eder. Önce tamamlanmış paketi güvenli
checkpoint'e getirir, sonra sıradaki işi seçer. Durumlar yalnız gerçek kanıtla
güncellenir. Yarım işler ve sıradaki kabul testi aşağıdaki teslim kaydına yazılır.

## Bu oturumun teslim kaydı

- i18n yedeği: **TAMAMLANDI**, yukarıdaki `38b4f93` checkpoint'i GitHub'da.
- UI 2.0 temeli: **TAMAMLANDI (1.12.0 sınırlı paket)**; önceki kaynaklar
  `fa20119` yerel checkpoint'iyle kurtarıldı. [Doğrulama kaydı](verification-ui-1.12.0.md)
  test/görsel kapsamını açıklar. Yayın SHA'sı ve gerçek durum GitHub commit
  kontrolleri ve oturum teslim raporuyla eşlenir; plan bir canlı sürüm kanıtı değildir.
- Hotbar/equip/drag-drop, ekonomi, düşman dengesi, kısa davet kodu, hesap,
  ortak maden, portal SDK/reklam/analitik/prestij: **EKSİK / PLANLANDI**.
- 1.13.0 ilk oturum/ekonomi/araç incelemesi ve sınırlı rehber paketi:
  [araştırma](gameplay-foundation-1.13.0.md),
  [doğrulama](verification-gameplay-1.13.0.md). Ekonomi deneyi gerçek başlangıca
  uygulanmadı; gerçek oyuncu ölçümü ve denge kararı eksik.
- 1.14.0 [veri sözleşmesi ve göç/test matrisi](inventory-hotbar-1.14-design.md)
  **PLANLANDI**. Gerçek hotbar/ekipman veya şema geçişi yapılmadı.
- En önemli sonraki görev: TR/EN ilk 30 dakika oyuncu gözlemi, başlangıç + erken
  ödül + seviye enerji döngüsünü birlikte değerlendirmek; sonra onaylı 1.14.0.
  Portal çıkışı öncesi güvenlik kapısı ayrıca zorunlu.
