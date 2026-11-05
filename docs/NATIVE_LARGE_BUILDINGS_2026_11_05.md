# Gerçek 5×4 yapı dilimi — 5 Kasım 2026

## Tamamlanan kod kapsamı

Önceki iki native paket korunarak ilk çok kareli yapı gerçek oyuna bağlandı:
**Geniş çiftlik evi / Spacious farmhouse**. Bu izole harita prototipi değildir;
aynı Engine, Three.js ValleyScene, A*, kayıt ve sunucu komut yolundadır.
Var olan evler/yapılar büyütülmez veya taşınmaz. Yeni evi oyuncu seviye 3'te
ayrıca inşa edebilir: 120 odun, 60 taş, 20 tahta; 600 temel yapı canı.
Eski yapı fiyatları/üretimi/kapasitesi, oyuncu yükseltmeleri değiştirilmedi.

Yeni ev 5×4, tek dönüşte 4×5; dört yönde toplam 20 hücre kaplar. Anchor,
kaplanan alanın minimum X/Z hücresidir. Prototip 7374026 yön sözleşmesi korunur:
rotation=1 kapıyı batıya çevirir. Three.js Y dönüşü yeni yapıda eksi işaretlidir;
eski yapıların görsel dönüş yönü değişmez. Ayrı kapı karesi footprint dışında,
walkable kalır. Bu kareye daha sonra çit/ağaç/depo gibi yapı yerleştirilemez.

`lib/game/footprint.ts` ortak sözleşmedir. Sık `buildingAt` sorgusu alan dizisi
üretmeden dikdörtgen içerme hesabı yapar. A* yalnız yeni büyük yapı için tüm
hücreleri işaretler. Eski yapıların yol bulma döngüsü tek hücre olarak korunur.

Yerleşim ve mevcut yapıyı döndürme, maliyetten/değişiklikten önce tüm hücreleri,
yüklenen sınırı, düz çim araziyi, kaynak/ekinleri, diğer yapıları/kapıları,
köy rezervasyonlarını ve oyuncu/hayvan/düşman/NPC konumlarını kontrol eder.
Sunucuda aktif diğer oyuncular da hesaba katılır; istemci bir boyut, footprint
veya maliyet belirleyemez. Gerçek shared komutları mevcut protokolü kullanır.

Çizim: özgün prosedürel 5×4 dış model; merkezlenmiş gölge/önizleme, yirmi
hücrelik mini harita ve pencere kenarında kısmen görünür yapının korunması.
Mevcut mesh birleştirme/temizleme kullanılır. Yeni üçüncü taraf görsel yoktur.
E etkileşimi ve yaklaş düğmesi yeni kapıya yönelir. Yeni kapının yanında mevcut
gece/düşman kurallarıyla uyunabilir. Eve dönüş/yenilgi konumu eski evde kalır.

Tarayıcıda yakalanan ek hata da düzeltildi: başarılı dönüş Engine'de uygulanıyor,
ancak duraklatılmış menü/sahne yenilenmiyordu. Engine.structureRevision yalnız
runtime'dır; build/rotate/reshape/upgrade/demolish sırasında değişir. Game bunu
duraklatılmış görünüm anahtarına, Scene ise tek sync koşuluna dahil eder.
Başarılı rotate/reshape ayrıca yerelleştirilmiş olay üretir; açı etiketi anında
yenilenir. Sürekli duraklatılmış render veya simülasyon ilerletme eklenmedi.

## Kayıt sınırı

Yeni State/Building alanı, D1/DO şeması veya SAVE_VERSION değişikliği yoktur.
Boyut kaynak katalogdan gelir; kayıt yalnız yeni `farmhouse` türünü tutar.
Doğrulama tüm hücreleri/kapıyı ve çakışmaları denetler. Uzak hücreler mevcut
world.edits/generation yolundan okunur. Madenin yüzey kaydı da korunur.

Eski kayıtlar yeni kodda aynı tek hücreli yapılarla açılır. Yeni evi içeren
kayıt eski katalogda bilinmediğinden **eski build'e geri yüklenemez**. Görev
kimliklerinde de var olan bu içerik uyumluluğu sınırı yayından önce açık yedek/
geri dönüş politikası gerektirir. Bu pakette kayıtları sessizce sadeleştiren
veya yeni yapıyı silen bir dönüştürücü yoktur. Üretim verisine dokunulmadı.

## Doğrulama

- Node22.13.0/npm10.9.2; final typecheck ve 275/275 test geçti.
- Yeni 8 regresyon: dört yön/hücre/kapı; gerçek Engine maliyeti/A*; her hücrede
  engel/oyuncu/yükseklik; güvenli dönüş; uzak streaming+kayıt/bozuk çakışma;
  kapıdan uyku; madende yüzey kaydı; dört oyunculu RoomCore yetkisi/tekrar.
- İlk test, tek oyuncuda optional sharedAnchors için eksik boş liste varsayımını
  yakaladı ve kod düzeltildi. İki test fikstürünün gerçek yüklü pencere/oyuncu
  konumu beklentileri düzeltildi; kayıt doğrulaması gevşetilmedi.
- Normal build/finalize/bütçe ve portal uyumluluk build'i geçti. Oyun varlıkları
  2.99 MB, galeri ayrı 0.47 MB. Portal build'inin chunk uyarısı sürer; bu yeni
  portal teslimi veya QA kabulü değildir. Üç eski portal ZIP'i korunur.
- Yerel gerçek Worker/D1/DO üzerinde dört WS; reconnect, replay, özel çanta,
  dış D1 revizyonu korunması ve ortak uyku kontrolleri geçti.
- Yerel browser kabulü için yalnız localhost8991'de üretilmiş, canlı kullanıcı
  içermeyen JSON fixture kullanıldı. Gerçek katalogdan plan seçimi ve
  Engine.go/act ile 6 adımlı rota sonunda 5×4 ev inşası, 120/60/20 maliyet
  ve 3D model görüldü. On adımlı rota evin çevresinden kapıya ulaştı; E ile
  yönetim ve uyku → ikinci gün geçti. Karakteri örtecek dönüş reddedildi;
  açık alandan dört yön, 90→180 etiketinin duraklatılmış menüde anlık güncellemesi
  ve cihaz kaydıyla yeniden açılışta aynı id/tür/konum/dönüş doğrulandı.
- TR/EN yapı adı/açıklama/yönetim; 320×640 görünümde 44px yüksek / 276px geniş
  dönüş hedefi; 740×360 yatayda panel 12..728px yatay ve 6..342px dikey sınırda,
  yatay taşma olmadan kapatma geçti. Viewport override test sonunda kaldırıldı.
  Son açılışın console error listesi boştu. Ekranlar work/farmhouse-world-final.png
  ve work/farmhouse-mobile-320.png; bunlar yalnız yerel fixture oyunundan kanıttır.

Fiziksel Android, insanlı oynanış/ekonomi, gerçek WAN ve yeni evle telefon FPS
kabulü yoktur. FPS artışı veya tüm görsel sorunların çözümü iddiası yoktur.

## Yol haritası durumu ve sonraki sınır

- G10: 5×4 prototip gerçek motor için ürünleştirildi; izole eski prototip silinmedi.
- G11: **kısmi**; yalnız yeni ev. 3×3 atölye, büyük ahır/kümes/sera henüz yok.
- G12/G13/E14: içeri giriş, iç/dış alan geçişi, mobilya ve dekor **yapılmadı**.
- World3 hâlâ ayrı prototiptir; generation=2 veya eski dünyalar dönüştürülmedi.
- İlk 30 dakika yeni oyuncu ve fiziksel cihaz kabulü açık; yeni görevler ve
  isteğe bağlı başlangıç profilleri korunur.

Sonraki iş: bu dış yapı kabulünden sonra 3×3 atölyeyi gerçek istasyon şartlarıyla
genişletmek; iç mekânları ayrı kayıt/sahne/çok oyuncu sözleşmesiyle ele almak.
Mevcut sistemlerin hepsini büyük hale getirdik veya iç mekânlar hazır denemez.
Çalışma yereldir; kullanıcının açık talimatıyla commit/push/deploy yapılmaz.
Yerel checkpoint work/native-footprint-progress-20261105 içindedir: doğrulanmış
tam Git bundle, tracked binary patch ve önceki iki native paket dahil tüm yeni
kaynak/belge dosyaları. Aynı diskteki bu kopya fiziksel ayrı yedek veya tarayıcı/
üretim oyuncu kayıt yedeği değildir. Önceki checkpoint üzerine yazılmadı.
