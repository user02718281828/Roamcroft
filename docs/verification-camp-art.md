# Camp Art 2.0 — sınırlı karşılama/çanta paketi

Geliştirme dalı `codex/mobile-menu-fix-1-13-2`; A+B yayın adayı `ff938c7`
ayrıca `codex/release-candidate-1-13-2-domain` referansında korunur. Main ve
canlı 1.13.1 değişmedi. Bu paket tüm UI/Inventory 2.0'ın tamamı değildir.

## Oyuncunun göreceği değişiklik

- Tek marka logosu, özgün hafif SVG vadi/ev/orman illüstrasyonu ve sıcak
  ahşap/orman/kumaş paleti. Masaüstünde dünya/eylem sütunları; küçük ekranda
  kaydırılabilen düzen. Tekrarlı Roamcroft başlığı/karşılama açıklaması kalktı.
- Cihaz kaydı varsa Devam, yoksa maceraya başlama, erişim belirsizse cihaz
  çiftliğini açma. Salt okunur anahtar varlığı kontrolü kayıt yükleme veya
  doğrulama değildir; motor açılışındaki gerçek doğrulama korunur. İlk
  ziyarette boş IndexedDB oluşturulmaz, dünya klonlanmaz.
- Yeni oyun önce mevcut güvenli değiştirme onayını açar; iptal kaydı silmez.
  Arkadaşlarla, Ayarlar ve Kayıt dosyaları açık eylemlerdir. Sunucu/cihaz
  ayrımı ve eski adres açıklaması okunabilir ayrıntıda; TR/EN seçimi görünür.
- Çantada gerçek eşya gruplarından oluşan kumaş bölmeleri, belirgin seçili
  eşya/miktar, görünür kullanım eylemi ve isteğe bağlı ayrıntı. Boş 24 görsel
  yuva kalktı; yeni mekanik veya kapasite yükseltmesi olarak sunulmaz.
- Çanta/Depo düğmeleri her zaman görünür. Sandık yoksa ön koşul, açıklama ve
  mevcut İnşa akışına bağlantı vardır; varsa aynı StoragePanel/atomik aktarım
  kullanılır. Gizli uzun sayfa altındaki depoyu arama gereği kalkar.
- Mobilde bölmeler kayar; seçili eşya altta, yatayda yanda. X48, alt Kapat44
  ve pointer katman düzeltmesi korunur. Ana menü kontrolleri en az44px.

## Ek kapanış güvenliği

Ortalanmış modalda eski Sheet'in bağımsız `translate` açılış kayması kaldırıldı;
hedef yana kaçmaz. Önceki kapanışın asenkron Back geçişi tamamlanmadan yeni
geçmiş girdisi açılmaz; hızlı yeniden açma korunur. Fixture gerçek hit alanı,
normal Back ve ayrıca 350ms geciktirilmiş gerçek history traversal ile yeni
menünün açık kaldığını sınar. Oyun/online duraklama kuralları değiştirilmez.

İlk fixture, sabit240ms ve sonra tüm `getAnimations().finished` varsayımıyla
başarısız oldu; tarayıcıda opacity animasyonu zaman0/running kalabiliyordu.
Son fixture açılış durumu ve ekran içindeki geometriyi bekler; merkezin ve
dört köşenin gerçek hit testi, boyut/kapama/veri eşitliği koşulları korunur.
Bu bir animasyon kare süresi veya fiziksel dokunma ölçümü değildir.

## Doğrulama ve devam

Typecheck ve **218/218 Node testi** geçti (üç yeni salt okunur kayıt ipucu
regresyonu). Build yaklaşık2.95MB, değişmeyen3MB bütçesi içinde. Son runtime
başarılıdır (çıkış0): HTTP/SEO/nonce/CSP/CORS ve dört WS; kayıp/tekrar,
atomik stok, reconnect/Worker restart, dış D1 çakışması ve ortak uyku geçti.
Son build **2,945,354 bayt**, tahmini aktarım **1,557,844 bayt**.
390×844, 844×390 ve 320×568'de11'er
menü döngüsü geçti: gecikmiş Back/hızlı açma, depo keşfi, yiyecek seçimi ve
kayıt payload eşitliği dahil. 320px'de kapatma hedefleri 48×48 ve286×44,
merkezleri hit-test ile doğru; panel/bölmelerde yatay taşma yok.
Masaüstü1280×720 ve mobil390×844/844×390 karşılama görselleri incelendi;
TR/EN, kayıt sonrası Devam, Yeni oyun→onay→iptal→kaydet/başlangıca dön
akışı çalıştı. Mobil eylemler48/56px, yatay taşma yok. Önce/sonra gerçek yerel görüntüler
`docs/screenshots/camp-2-*`; çizilmiş mockup veya canlı sürüm kanıtı değildir.

**DOĞRULAMA EKSİK:** fiziksel Android/iPhone, OS Back, PWA/klavye/çentik,
%200 yazı ve kullanıcıyla depo keşfi/aktarım kabulü; gerçek WAN ve CWV.
**PLANLANDI:** diğer menülerin kapsamlı sanat dönüşümü, ortak HUD, gerçek9
yuvalı hotbar/ekipman/drag-drop ve kayıt göçü. Sonraki güvenli envanter dilimi,
mevcut atomik transfer üzerinde oyuncunun miktarı seçmesidir; sonra fiziksel
kabul ve 1.14 sözleşmesi. Dünya/AOI/çok kareli bina prototipleri ayrı kalır.

Engine/ekonomi/kayıt şeması/anahtarları/sunucu protokolü/D1/DO/Sentry/CSP
değiştirilmez. Yeni oyun/ayar erişimi yalnız mevcut Game/MainMenu akışına
başlangıç niyeti taşır; yeni dünya onaysız oluşturulmaz. Üretimde oyun testi,
veri yazma veya dağıtım yapılmadı.
