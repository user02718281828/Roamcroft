# Living Forest — gerçek sahne ilk dilimi

30 Ekim 2026, `codex/living-forest`, **1.14.0-alpha.2 yalnız yerel**.
Canlı1.14.0-alpha.1/main3331e6a değişmedi. Bu paketin production onayı yok;
non-main Cloudflare davranışı belirsiz olduğundan dal push edilmez.

## Oyuncunun göreceği değişiklik

- Mevcut `ValleyScene.resource()` gerçek ağaç kaynaklarını üç özgün çam/meşe/
  huş siluetiyle çizer. Tohum/koordinat yüksekliği, eğimi ve kök yönünü sabitler;
  mevsim yalnız renk paletini değiştirir. Beyaz kabuk, dal ve katlı taçlar var.
- Orman kenarlarında altı dekor: eğrelti, yabani çiçek, mantar, çalı, yosunlu
  kütük ve ot. Mevcut kıyı/sazlık sunumu korunur. Bu dekorlar hasat/ödül vermez.
- İki yeni görsel tür: tavşan dolaşır/kaçar, sekmesi ve kulak hareketi var;
  kuş dolaşır, yaklaşınca yumuşak yükselir, kanat çırpar ve tehdit geçince iner.
  En fazla4+4 aktör, bölge başına2; yerel/uzak oyuncu sunum konumuna tepki var.
  Fauna client sunumudur; çok cihazda aynı anda aynı poz vaat edilmez.

İlk girişte mevcut köyün ağaç kenarlarına bak; seyrek orman açıklığında yürü,
küçük kahverengi tavşana veya mavi kuşa yaklaş. Habitat kalmamış/kesilmiş alana
hayvan veya ağaç zorla eklenmez. Tekrar edilebilir yerel kabul URL'si
`http://127.0.0.1:8951/?fixture=normal&profile=1`, mevcut gerçek Game ve
Three.js sahnesi, seed84621; ayrı harita/demo değildir. Bu fixture yalnız
localhost'ta devreye girer. Normal eski kayıt açılışı ayrıca kontrol edilir.

## Koruma ve maliyet

`forest-layout.ts` yalnız okur; `forest-art.ts` mevcut ortak geometrileri
kullanır; `forest-life.ts` kendi sınırlı çalışma zamanı aktörlerini tutar.
State/SAVE_VERSION/IndexedDB/world generation/Engine/çarpışma/sunucu protokolü,
envanter/ekonomi ve üretim DB değişmedi. Yol/su/tarla/ekin/kaynak/hasat edilmiş
gövde veya yapı ve bitişik giriş alanı dekor/fauna için uygun değildir.
Yapı rezervasyonu değişince ilgili tile sunumu mevcut chunk kuyruğunda yenilenir.
Dekor raycast/ganimet/komut sistemi oluşturmaz. Eski kaynak koordinatı ve
kesilmiş ağacın yokluğu korunur; E/F prototipleri bağlanmadı.

Statik dünya için mevcut WorldBatches, canlılar için ayrı AnimalBatches;
iki ek ortak düşük poligon geometri, frustum eleme, periyodik habitat kontrolü,
oyuncu yakınında16 kare seçim,8 aktör sınırı ve dispose temizliği kullanılır.
Her ağaç en fazla310 üçgen. İlk sanat turunun486k üçgenlik maliyeti azaltıldı.

1280×720/DPR1/dengeli, aynı seed84621 ve başlangıç kamerası anlık ölçümleri:

| Ölçüm | Önce | Yeni geometri |
| --- | --- | --- |
| Draw calls | 61 | 68 |
| Görünür üçgen | 325,992 | 334,464 (~%2.6 artış) |
| Aktif arazi / bölge | 3600 /25 | 3600 /25 |
| Yüklü görsel orman aktörü | 0 | 8 |

Kamera/tohum/viewport aynı; oyun saati, NPC/animasyon fazı ve pause katmanı
görüntülerde farklıdır. Bu bir sabit kare veya uzun süre FPS benchmark'ı değildir.
Mobil390×844'te sayfa yatay taşması yok; o farklı kamera/zoom örneğinde63 draw/
198,850 üçgen ve8 aktör görüldü. Masaüstü mobil viewport'u fiziksel Android
veya30FPS kabulü sayılmaz. Ham ölçümler work/forest-{before,after}-stats.json.

Gerçek görüntüler: [önce](screenshots/living-forest-before.jpg),
[sonra](screenshots/living-forest-after.jpg),
[yakın canlı tepkisi](screenshots/living-forest-life.jpg),
[mobil](screenshots/living-forest-mobile.jpg). Sonraki son kabul notu bu
dosyaya eklenir; bunlar canlı1.14.0-alpha.1 görüntüsü değildir.

## Kabul kapsamı ve devam

Beş yeni test: eski save serialize eşitliği/negatif streaming/determinizm;
inşa/ekin/yol/su/kesilmiş gövde reddi; dolaşma/kaçış/yumuşak uçuş/iniş ve
otoriter verinin değişmemesi; model sınırı/üçgen bütçesi; gerçek Three.js actor
batch sınırı/streaming/dispose. İlk Node strip-mode constructor kısayolu
uyumsuzluğu açık alan atamasıyla düzeltildi; test gevşetilmedi.

**DOĞRULAMA EKSİK:** fiziksel Android/iPhone/PWA, gerçek WAN görsel kabulü,
uzun oturum/çok büyük çiftlik/performance ve kullanıcı sanat kabulü.
**PLANLANDI:** sincap/geyik/tilki, gece/yağmur rutinleri, nadir canlılar,
kurbağa/balık/ateşböceği ve daha ayrıntılı mevsim dağılımı. Bu ilk dilim bütün
Living World/Game Art2.0 tamamlandı demek değildir.

Büyük backlog korunur: versioned World Generation3, gerçek footprint/rotation/
giriş, ev/atölye/ahır iç mekânları, AOI ile bağımsız uzak online keşif, gerçek
stack/ekipman/drag-drop, NPC/ilişki/görev/ticaret ve üretim derinliği.
Bu oturumda bu alt sistemlere başlanmadı. Sonraki en değerli adım bu orman
diliminin fiziksel mobil ve sanat kabulü; kabulden sonra aynı sunum sistemiyle
iyi görünümlü sincap ve küçük çevre olayları için dar bir paket seçilir.

## Son doğrulama — 30 Ekim

Node22.13.0/npm10.9.2; son kaynakta typecheck, **232/232 test**
(0 hata/atlanan,16.24s), build ve dört oyunculu yerel runtime başarılı/çıkış0.
Statik **2,963,483 bayt**, tahmini aktarım1,563,577;3,000,000 bütçe korunur.
HTTP/SEO/marka/nonce/CSP/CORS,4WS,50–300ms gecikme/kayıp/tekrar,
Worker restart/reconnect,atomik envanter/üretim sahipliği,D1 çakışması ve
ortak uyku geçti. Loglar work/forest-{typecheck,test,build,runtime}.log.

Normal, fixture parametresi olmayan eski localhost8950 kaydı alpha.2'de açıldı:
180 altın/1 ekmek ve yuva9 bağı korundu;8 orman aktörü mevcut. Kayıtlı çıkış
sonrası yeniden yükleme/Continue denendi. Görsel living-forest-legacy-save.jpg.
Seed84621 gerçek Game'de oyuncu18,23'e mevcut WebMCP terrain/hand eylemiyle
yürüdü; kuşun havalanma/kanat tepkisi ve tavşan modeli sahnede görüldü.
Mobil390×844 sayfa taşması yok. Son hareket yarıçapı4.2 ile tehdit mesafesi3'ün
dışına çıkmaya izin verilir; yol/su/yapı engeli hâlâ geçilmez. Şema/ekonomi veya
bağımlılık sürümü değiştirilmedi; package/lock yalnız alpha.2 kaynak sürümüdür.
Fiziksel cihaz/WAN/uzun oturum/sanat kabulü açık kalır. Yeni production yok.

Eski test kaydında ilk resume180 altın/1 ekmek doğrulandı. Sonrasında yalnız
bu yerel test çiftliği açık beklerken mevcut3. gün akını/yenilgi kuralı işledi
ve altın180→162 oldu; bu simülasyon ilerlemesidir, orman helper'larının ekonomi
mutasyonu veya kayıt yükleme kaybı değildir. Testi durdurup kapattık; üretim
çiftliklerine/DB'ye erişilmedi. Yardımcı fonksiyonlar için State eşitliği testi
oyun zamanı ilerletilmeden ayrıca geçti.
