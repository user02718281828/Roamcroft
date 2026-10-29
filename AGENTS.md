# Roamcroft — proje hafızası ve çalışma kuralları

Güncel uzun vadeli iş sırası ve durum kaynağı:
`docs/ROAMCROFT_2_0_MASTER_PLAN.md`. Paket teslimlerinde son doğrulama belgesine
bak; aşağıdaki 1.11.5 sayıları tarihsel tabandır. Main push/deploy yetkisini
her oturumun kullanıcı talimatından belirle; geliştirme dalı izni üretim yayını
izni sayılmaz.

29 Ekim devam güncellemesi: canlı main `a182541` / 1.13.1. Resmî domain
`https://roamcroft.com`; www→root301 doğrulandı. Eski Worker domainini açık
tut; otomatik yönlendirme, DNS/TXT veya kayıt/çerez göçü yapma. Search Console
sahipliği/ilk indeks isteği kullanıcıca tamamlandı; indeks/sıralama bilinmiyor.
Domain/SEO/marka adayı `docs/verification-domain-seo.md`; sonraki UI/oynanış
paketleri ayrı checkpoint. Yeni rehber rotası SW'de `/` önbelleğini ezmemeli.
Main/üretim yayını için bu oturumda yetki yok; güvenli geliştirme commit'leri
yetkili. Kullanıcının marka kaynaklarını ve `tatus -sb` dosyasını koru.

1.12.0 UI temelinin güncel doğrulaması: `docs/verification-ui-1.12.0.md`.
İlk açılış İngilizcedir; yalnız açıkça saklanan dil tercihi korunur. Çanta
yuvaları yalnız gösterimdir; gerçek eşya hotbar'ı veya yeni kayıt şeması yoktur.
Sentry main `1e302c3` ile eklenmiştir; SDK ve dar CSP izni korunmalı, mahremiyet
çıkış filtresi gevşetilmemelidir. 29 Ekim audit sonucu 25'tir; aşağıdaki 23
bulgu tarihsel sonuçtur. CodeScene bakım planı `docs/modularization-plan.md`;
motor/çizici refactoring'i UI tesliminden ayrı yürütülür.

1.13.0 Gameplay Foundation: `docs/gameplay-foundation-1.13.0.md` ve
`docs/verification-gameplay-1.13.0.md`. İlk Adımlar UI'sı mevcut stats/claimed
değerlerini okur, ödül/kilit vermez; tercih `roamcroft.guidance.v1` altında
oyun kaydından ayrıdır. `scripts/first-session-audit.ts` içindeki sade profil
yalnız deneydir; createState/yükleme/sunucu başlangıcına uygulanmaz.
1.14.0 envanter/hotbar sözleşmesi `docs/inventory-hotbar-1.14-design.md`;
henüz mekanik veya onaylanmış şema değildir. Kullanıcı 29 Ekim 2026'da yalnız
doğrulanmış 1.13.0 için normal main push/Cloudflare yayınına onay verdi.
Sonraki sürümlerin yayın yetkisi kendi oturum talimatından belirlenir.

1.13.1 Mobile Recovery geliştirme dalı: `docs/verification-mobile-1.13.1.md`.
Kullanıcı 29 Ekim 2026'da yalnız 1.13.1 için başarılı birleşim sonrası kontroller
koşuluyla main push/Cloudflare yayınına açık onay verdi; fiziksel Android
kabulünü yayın sonrasına bilinçli olarak erteledi. Fiziksel kabul hâlâ eksiktir. Mobil
kontrol tercihi `roamcroft.touch.v1` kayıt/ekonomiden ayrıdır; inputBlocked,
online simülasyon duraklamasıyla aynı şey değildir. GameIcon atlasları iç SVG
ile hücre sınırında kırpar; metin span flex kurallarına geri döndürme. Menü
Back geçmiş girdisi aynı URL'dedir. Güncel audit 25: 3 kritik/11 yüksek/10 orta/
1 düşük; güvenlik ayrı iş. Sanat yönü/kaynak haritası `docs/ART_DIRECTION_2_0.md`.
1.14.0 mekanik veya şema hâlâ uygulanmadı; mobil kabulden önce başlanmaz.

1.13.2 acil menü yaması: `docs/verification-mobile-1.13.2.md`. Geliştirme
dalındadır; main/yayın izni yok. Mobil `.camp-menu` boş alanı X'i örtmemeli:
container pointer-events:none, gerçek kontroller auto ve X üst katmandadır.
Görsel 44px boyut yeterli değildir; elementFromPoint ile hit alanını doğrula.
Tarayıcı touch fikstürü: build sonrası `node scripts/check-menu-touch.mjs`;
gerçek Android testi yerine geçmez. Kullanıcı 1.13.1'de hareket/balta/kamera
geçtiğini, X ve depo/menü UX sorunlarını bildirdi; plan bunları ayırır.

Bu dosya depoda çalışan kod ajanları için mimari rehberdir. İlk kaynak incelemesi
28 Ekim 2026 tarihinde `main` dalındaki `becf1b8` commit'i üzerinde yapıldı.
İncelenen uygulama sürümü **1.11.5 — Hafif Kamera** idi. Buradaki sayılar ve
sürüm bilgileri bu başlangıç durumunu anlatır; sonraki değişikliklerde kodla
karşılaştırılıp güncellenmelidir.

## Kullanıcıyla çalışma ve değişiklik sınırları

- Kullanıcıyla Türkçe iletişim kur; bulguları, belirsizlikleri ve doğrulama
  sonuçlarını açıkça ayır.
- Mevcut oyun sistemlerini, oyuncu ilerlemesini ve kayıt uyumluluğunu koru.
  İlgisiz yeniden düzenleme, ekonomi değişikliği veya özellik ekleme yapma.
- Hata çıktığında önce hatayı ve etkisini raporla. Kullanıcının izni olmadan
  büyük değişiklik, mimari dönüşüm, bağımlılık yükseltmesi veya kayıt şeması
  değişikliği yapma. Sorunu gizlemek için testleri ya da doğrulamaları gevşetme.
- Kullanıcı açıkça istemedikçe canlı dağıtım yapma. `npm run deploy`,
  `wrangler deploy`, rollback ve üretim veritabanı işlemleri ayrı yetki gerektirir.
- Commit ve push için kullanıcı talimatını bekle. Özellikle `main` dalına push,
  bağlı Cloudflare Workers Builds akışında otomatik yayın tetikleyebilir.
- Kullanıcının mevcut değişikliklerini geri alma veya üzerine yazma. Çalışma
  başında ve sonunda Git durumunu kontrol et.
- Sırları, oturum çerezlerini, davet kodlarını veya `.env*` içeriğini raporlara
  ve günlüklere kopyalama. Test verisini canlı oyuncu kayıtlarına yazma.
- Bu belge gelecekteki tüm işler için salt okunur çalışma zorunluluğu getirmez;
  ilgili oturumda kullanıcının verdiği kapsam ve izinler esas alınır.

## Teknoloji ve giriş noktaları

- TypeScript, ESM (`type: module`), React 19.2.8, Three.js ^0.180.0.
- Vinext 1.0.0-beta.9 / Vite 8.2.2; Next tarzı `app/` yönlendirmesi.
- Tailwind 4, Base UI/shadcn bileşenleri ve Lucide simgeleri.
- Sunucu hedefi Cloudflare Workers; D1 ve oda başına SQLite Durable Object.
- `package.json`: Node >=22.13.0. `.node-version` ve GitHub CI: 22.13.0.
  Kullanılan yerel Node/npm sürümünü doğrulama raporunda belirt.
- Windows'ta `npm` PATH üzerinde bulunmayabilir. Bu bilgisayarda doğrulama için
  resmi, SHA256 özeti kontrol edilmiş Node 22.13.0 / npm 10.9.2 taşınabilir
  paketi `work/toolchains/node-v22.13.0-win-x64` altına hazırlandı. Gerekirse
  yalnız komut oturumunun PATH'ine ekleyip `npm.cmd` kullan; sistem genelinde
  kurulum varsayma. Yerel npm önbelleği `work/npm-cache` altında tutulabilir.
- `app/page.tsx` → `components/game/Launcher.tsx` → dinamik `Game.tsx`.
- `Game.tsx` motoru, girişleri, kayıtları, sesi, çizimi ve React HUD/panellerini
  bağlar. `scene.ts` dinamik import, `Panels.tsx` React lazy ile yüklenir.
- `vite.config.ts` Vinext, Sites ve Cloudflare eklentilerini; Three.js paket
  ayrımını ve yerel Wrangler yollarını yapılandırır. Sites eklentisinin varlığı
  tek başına canlı yayının Sites üzerinde olduğu anlamına gelmez.

## Oyun motoru ve veri akışı

- `lib/game/model.ts` merkezdir: `State`, `Tile`, `Building`, `Animal`, `Enemy`,
  `Job`, `Event`, `createState()` ve `Engine` burada tanımlıdır.
- `State` kaydedilebilir oyun verisidir. Rotalar, bazı bekleme süreleri,
  NPC/hayvan hareket durumları ve ağ kontrolü Engine çalışma zamanı alanlarıdır.
  Sunucu kayıtları gerekli çalışma zamanı alanlarını ayrıca saklar.
- Engine, değiştirilebilir `s: State` üzerinde kuralları yürütür. Olaylar
  `events` kuyruğuna gider; arayüz bunları mesaj, ses ve efektlere dönüştürür.
- `Game.tsx` requestAnimationFrame döngüsünü yönetir. `Engine.tick()` adımı
  en fazla 0.1 saniye kabul eder; arayüz kendi delta süresini 0.08 ile sınırlar.
- Toplu tarla/makine/hayvan üretimi `systems()` üzerinden yaklaşık 0.5
  saniyelik aralıklarla yürür. El üretimi kuyruğunun yalnız ilk işi ilerler.
- Çevrimdışı oyunda menüler, duraklatma ve gizli sekme simülasyonu durdurur;
  kapalı geçen süre için ilerleme hesaplanmaz. Ortak oyunun duraklama ve zaman
  kuralları oda otoritesinde ayrıca değerlendirilir.
- Çizici oyun kurallarının otoritesi değildir. Görsel yumuşatma, simülasyon
  koordinatlarını, envanteri veya kayıt verisini değiştirmemelidir.
- Başlangıç incelemesinde `model.ts` 2.250, `scene.ts` 2.696 satırdı. Yardımcı
  modüllere ayrım olsa da bunlar çok sorumluluk taşıyan büyük merkezlerdir.

## Dünya, hareket ve keşif

- `world.ts`: `CHUNK=12`, `WINDOW=60`; 25 etkin bölge ve 3.600 arazi karesi.
- Başlangıç köyü ve maden haritaları 36×36 temelini kullanır. Koordinat
  hesaplarında sabit genişlik varsayma; `worldOrigin`, `worldSize`, `tileIndex`
  ve `tileAt` yardımcılarını kullan. Negatif koordinatları koru.
- Dünya tohumdan deterministik üretilir. `world.edits` değiştirilmiş kareleri
  tutar; değişmeyen arazi yeniden üretilebilir. Arazi üretim sürümü eski
  kayıtların dünyasını korur; yeni dünyalar generation 2 ile başlar.
- Biyomlar: Roamcroft başlangıç köyü, Çam ormanı, Bakır sırtları, Çiçek ovası,
  Mantar korusu ve Kristal bozkırı.
- Uzak/yüklü olmayan tarlalar, üretim yapıları ve hayvanlar simüle edilmez.
  Meyve ağacının yaşı oyun günüyle hesaplandığından takvim yaşını korur.
- `collision.ts` su, duvar, kaynak ve ağaç gövdesi çarpışmasını tanımlar.
  `pathfinding.ts` heap tabanlı A* ve çapraz köşe engeli içerir.
- `worldRevision` gerçek dünya/kat geçişinde yeniden kurulum içindir. Aynı
  dünyadaki kayan arazi penceresi sahneyi, kamerayı ve sesi yeniden kurmamalıdır.

## Oyun sistemleri ve korunacak davranışlar

### Tarım, bahçe ve yapılar

- Gün 300 saniye, mevsim 7 gün; dört mevsim. Yağmur ve gündüz/gece döngüsü var.
- Altı ekin: buğday, havuç, patates, domates, mısır, balkabağı.
- Çapalama, ekim, sulama, gübre, büyüme, hasat ve mevsim koşulları mevcut.
  Mevsim dışındaki ekin ölmez; büyümesi bekler. Sera bu kısıtı kaldırabilir.
- Domates ve mısır tekrar hasat verir; tekrar hasatta yeni tohum üretilmez.
  Çapa ile ekin sökülebilir. `farming.ts` büyüme ve ekim planı hesabını paylaşır.
- Elma/armut ağaçları yapı olarak tutulur. `orchard.ts` gün bazlı yaş,
  olgunlaşma, mevsim ve günlük tek hasadı hesaplar. Dolu çantada ürün dalda kalır.
- Başlangıçta 24 yapı tanımı vardır; bahçe ağaçları, depo ve savunma da buna
  dahildir. Yapı seviyesi en fazla 3'tür. Başlangıç evi ve pazar korunur.
- Yapılar döndürülebilir; sur/duvar düz veya köşe olabilir. Onarım ve sökme var.
- `progression.ts` sulama/sera kapsamını yapıların küçük alanlarından üretir.
  Fıskiye normalde bitişik 8, emanet ödülüyle 24 kareyi kapsar.

### Üretim, ekonomi ve envanter

- `data.ts` eşya, ekin, yapı, el tarifi, görev, araç, hayvan ve yetenek kataloğudur.
- El üretiminde üç işlik kuyruk, malzeme/enerji, istasyon ve seviye şartları var.
  Alet ve zırh yükseltmeleri en fazla 3; kuyruktaki yükseltmeler maliyete katılır.
- `production.ts` temel/alternatif makine tarifleri ve üretim hızını tanımlar.
  Yeni makine tek parti bekler; otomatik tekrar oyuncu tercihidir. Eski
  kayıtlarda tanımsız tekrar alanı önceki sürekli üretim davranışını korur.
- Makine girdisi parti başında ayrılır. Çalışan partide tarif değişmez;
  duraklatma girdiyi kaybettirmez. Dolu çantada tamamlanmış çıktı makinede bekler.
  Sökme sırasında ayrılmış girdilerin iadesini koru.
- Çanta normalde 600, Hasat sandığı ödülüyle 900 eşya tutar. Ortak depo kapasitesi
  sandık seviyesi başına 1.200'dür. Fazla kazanımlar depo/teslimat alanına gider.
  Satın alma ve hayvan ürünü toplama gibi kapasite kurallarını ayrı koru.
- `economy.ts` fiyat, dostluk indirimi, pazar erişimi ve işleme değeri hesabıdır.
  Pazarda satılmayan ürünün satın alınması Engine seviyesinde de engellenir.
- `orders.ts`: dünya tohumu/güne bağlı deterministik iki günlük teklif;
  NPC başına ortak tek teslim sınırı. Yarının ihtiyaçları görülebilir. Sipariş
  toplam ödül satış değeri yaklaşık %25 primlidir; tarih/token/seviye doğrulanır.
- `materials.ts`: tarif/makine/sipariş maliyetini gerçek durumdan çıkarır.
  Depodan yalnız eksik miktar, bütün stok ve kapasite kontrolünden sonra atomik
  alınır. İstemciye keyfî maliyet veya miktar dayatma yetkisi verme.
- Çok günlük tam ekonomi dengesi kanıtlanmış değildir; sabit parti kâr
  tablolarını oyuncunun bütün emek/bakım döngüsünün testi olarak sunma.

### Hayvanlar, karakter ve sosyal yaşam

- Tavuk, inek ve koyun; kümes/ahır kapasitesi seviye başına 3 hayvan.
- Günlük yem, günlük en fazla bir üretim partisi, elle ürün toplama, yakınlık,
  adlandırma, sevme ve yavrulama mevcut. 60 yakınlıkta iki ürün; hayvanda en
  fazla 12 ürün bekler. Yavru iki günde yetişir; yavrulama aralığı üç gündür.
- Hayvanlar otlar, yol bulur, oyuncuyu/ebeveyni takip eder, gece eve döner,
  tehditten kaçar. Kare başına hayvan rota bütçesi 2, NPC rota bütçesi 1'dir.
- Sağlık, açlık, enerji, yemek, dinlenme, kamp ateşi, koşma ve evde uyku var.
  Düşük enerji yürümeyi yavaşlatır; sıfır enerjide yürümek mümkündür.
- Üç NPC: Narin, Torin, Lale. Günlük sohbet, hediye, sipariş, rutin, 100'e
  kadar dostluk ve fiyat/üretim/balıkçılık avantajları vardır.
- `living.ts` gün ışığı, NPC takvimi ve insan/hayvan pozlarını üretir.
- Balıkçılık bir genel Nehir balığı ürünü, süre ve şans hesabı kullanır.
  Çok tür/gerilim mini oyunu mevcut özellik değildir.

### Savaş, maden ve ilerleme

- Üçüncü günden itibaren her üçüncü gece akın; kule savunması, yapı hasarı,
  görüş hattı, yol bulma ve hazırlık süresi/zemin uyarılı düşman saldırıları.
- Beş düşman türü: bozkurt, mağara peltesi, kül büyücüsü, taş muhafız,
  Derinlik Muhafızı. Son muhafız yarı can altında güçlenir.
- `expedition.ts`: beş katlı Kadim Maden, harita üretimi, asansör ve geçitler.
  Karakter seviye 3'te açılır; günde tek keşif, kat düşmanları ve dört cevher
  darbesi koşulu vardır. Açılan katlar kontrol noktası olarak saklanır.
- Madende yüzey saati/tarla/hayvanlar bekler; açlık, savaş ve el üretimi sürer.
  Yüzey durumu, maden ve saldırı hazırlıkları kayıt uyumluluğunun parçasıdır.
- Yenilgi eve dönüş ve %10 altın kaybı getirir. Üçüncü seviye Kadim fener
  akınları bitirir; oyun sonrasında serbest yaşam devam eder.
- Başlangıçta 30 karakter seviyesi, beş beceri (en fazla 10), altı yetenek
  dalı (beşer kademe), 20 görev, 12 başarım ve üç keşif noktası vardır.
- Dört kısmi bağış koleksiyonu; çanta, hayvan üretimi, makine hızı ve sulama
  ödülleri verir. Beş köy dönüm noktası sırayla ve tek sefer ödüllenir.
- `quests.ts` HUD ve günlük için ortak öneri seçer; hazır ödüller önceliklidir.
- `settlement.ts` köy adı/dönüm noktaları; `story.ts` bunlardan türeyen altı
  hikâye bölümü ve NPC tepkileridir. Hikâyenin ayrı ödülü/kayıt şeması yoktur.

## Çizim, ses, mobil ve tanılama

- `scene.ts` / `ValleyScene`: ortografik kamera, prosedürel modeller, arazi,
  raycast seçimi, mini harita, animasyon, ışık, hava ve kaynak temizliği.
- Güncel varsayılan **dengeli mod** (`highQuality=false`). Ayrıntılı mod elle
  açılır. Dengeli mod DPR üst sınırı 1, ayrıntılı modda 1.35'tir. Çözünürlük
  yük altında otomatik küçültülmez; ayrıntılı mod seçimi korunur.
- `batches.ts`: `WorldBatches`, instancing, ekran dışı eleme, sabit görünür
  yuvalar, değişen matris/renk aralıkları, statik model birleştirme/temizleme.
- `actor-batches.ts`: hayvanların eklem dönüşümleri korunarak tür/parça bazlı
  toplu çizimi. `animal-presentation.ts` online hayvanı yalnız görsel yumuşatır.
- `art-direction.ts`, `workshop-art.ts`, `visuals.ts`: ev/ağaç tasarımları,
  on atölye hareket detayı, su ve rüzgâr shader katkıları.
- `clouds.ts` ve `ambience.ts`: dünya koordinatına bağlı bulut/doğa/hava
  örnekleri. Kamera hücre seçer; parçacıkların dünya konumunu sürüklememelidir.
- `audio.ts`: Web Audio ile üretken müzik/efekt; müzik, doğa ve aksiyon ayrı
  seviyelerdir. Ses kullanıcı etkileşiminden sonra açılır. Konumsal çevre
  karışımı kameraya, su/ağaç uzaklığına, gece/yağmur/madene bağlıdır.
- `interaction.ts`, `joystick.ts`, `touch.ts`, `viewport.ts`: sürükleme/tıklama
  ayrımı, kare bütçesi, analog joystick, pinch, görünür viewport ve tam ekran.
  Bırakma/iptal/odak kaybında takılı girdi bırakma. Mobil kontrol hedefleri
  ve güvenli alanları korunmalı; dokunma hareketi yanlış tıklama üretmemeli.
- Temel kısayollar: WASD/yön tuşları yürüyüş; 1–8 araç seçimi; Tab menü;
  E etkileşim; Shift koşu; Ctrl saldırı; Esc menü/inşadan çıkış veya duraklama.
  İnşa sırasında yön tuşları döndürme, menüde Q/E bölüm değişimi içindir.
- `pwa.ts` service worker/kurulum/güncelleme kaydını oyun açılışından sonra
  hazırlar. `public/sw.js` API ve RSC isteklerini önbelleğe almaz; uygulama
  kabuğu ve statik varlıklar çevrimdışı kullanım için saklanır.
- `profile.ts`: isteğe bağlı `?profile=1`, CPU/GPU, yüzdelikler ve %1 düşük
  FPS ölçümü. `profile-fixture.ts` yalnız yerel profil girişinde kullanılır.
- `webmcp.ts`: destekleyen tarayıcıda durum okuma, arazi eylemi başlatma ve
  üretim kuyruğu araçlarını aynı Engine üzerinden sunar.
- FPS, CPU benchmark, GPU süresi ve ağ RTT'si farklı ölçümlerdir. Birbirinin
  yerine kullanma; masaüstü mobil viewport sonucunu fiziksel Android testi sayma.

## Kayıt ve uyumluluk

- `save.ts`: JSON zarfı, bütünlük özeti, doğrulama, eksik eski alanların
  tamamlanması, localStorage yedekleri ve içe/dışa aktarma. `SAVE_VERSION=1`.
- Eski adlar bilinçli korunur: `format: ocak-vadisi`,
  `ocak-vadisi.save.v1`, `ocak-vadisi-worlds`. Bunları kozmetik ad değişikliği
  gerekçesiyle değiştirme. İndirilen dosyanın kullanıcı adı Roamcroft'tur.
- Bütünlük özeti kriptografik imza/hile koruması değildir; çevrimdışı kayıt
  doğrulaması ile sunucu otoritesini birbirine karıştırma.
- `storage.ts`: IndexedDB `saves` deposu, `snapshot-a`/`snapshot-b` ve atomik
  `head` rotasyonu. Eski current/backup anahtarları okunur; işlem iptalinde
  işaretçi ve yedek korunmalıdır. IndexedDB hatasında localStorage kullanılır.
- Yaklaşık her 15 oyun saniyesinde boşlukta otomatik kayıt, sayfa
  kapanışı/gizlenmesinde localStorage kontrol kaydı denenir.
- Kayıtlı çıkış gerçek kayıt/ACK bekler; hata varsa oturum korunur.
- Kayıt cihaz ve origin'e bağlıdır. Git deposunu geri yüklemek tarayıcıdaki
  çiftliği, güvenli çerezi veya Cloudflare verisini geri yüklemez.

## Online mimari ve güvenlik sınırı

- Üç ayrı durum vardır: çevrimdışı cihaz çiftliği, kişisel sunucu çiftliği,
  davet kodlu ortak yüzey çiftliği. Bunların kayıtlarını birbirine karıştırma.
- `lib/server/client.ts` / `ServerWorldClient` HTTP komut/kayıt/eşitleme
  akışını; `lib/coop/realtime-client.ts` WebSocket hareketini yönetir.
- `/api/world`: kişisel otoriter dünya. `/api/lobby`: davet/üyelik.
  `/api/shared`: ortak dünya komutları. `/api/realtime`: WS hareketi.
- Eski `/api/coop` hâlâ 404 döner. Bu, güncel ortak oyunun kapalı olduğu
  anlamına gelmez; eski co-op altyapısı ile aktif yolları ayır.
- `worker/realtime.ts` → `RealtimeRoom` → `lib/server/room-core.ts`.
  Oda otoritesi host bilgisayarı değil Cloudflare Durable Object'tır.
- 50 ms sabit adım (20 Hz), iki tick'te snapshot (10 Hz). Epoch, input
  sequence, ACK, tekrar/eski paket reddi ve sınırlı kuyruk vardır.
- `network-movement.ts` aynı hareket integratörünü otorite ve tahminde
  paylaşır. Sunucu istemcinin konum/hız/geçen süre dayatmasını kabul etmez.
- `prediction.ts` onaylanmayan girdileri yeniden oynatır; `motion.ts` uzak
  oyuncu geçmişini çizer. Ortak HTTP yolu karakter konumunu yönetmez.
- `realtime-protocol.ts`: ilk bağlantıda yaklaşık 650 ms tampon; ilk
  örneklerden sonra son 40 kabul edilen snapshot'ın geliş düzensizliği/kaybıyla
  120–650 ms aralığına uyarlanır. RTT bu bekleme hesabına tekrar eklenmez.
- Kişisel: karakter konumu/can/enerji/açlık, çanta/taşan teslimat ve bazı eylem
  sayaçları. Ortak: altın, dünya, zaman, hava, ekinler, yapılar, depo ve ilerleme.
- Ortak dünya ilk kez host'un kişisel sunucu dünyasından kopyalanır; ardından
  host'a bağlı ayrı `shared_farms` kaydıdır. Konuk boş çantayla başlar;
  kalıcı kimliği/çantası yeni davet koduyla tekrar girişte korunur.
- İş/makine `recipient` alanı, çıktı ve otomatik tekrar girdilerini işi
  başlatan oyuncuya bağlar; ayrılan oyuncunun ürünü kaybolmamalıdır.
- En fazla dört eşzamanlı oyuncu, çiftlik başına 32 kalıcı profil sınırı var.
  Host için 15 saniye tolerans, lobi için beş dakika ömür/yenileme akışı var.
- Ortak hareket yaklaşık 20 kareyle sınırlı; host çevresindeki tek yüzey
  penceresi paylaşılır. Ortak maden ve uzak bölgelerde bağımsız keşif kapalıdır.
- Ortak uyku mevcuttur: ev yakınında uygun zamanda tüm katılımcıların onayı;
  kopma, yeni katılım, uzaklaşma veya süre aşımı onayları sıfırlar. Gün bir kez
  ilerler; gece üretimi doğru oyuncuya, iyileşme tüm katılımcılara uygulanır.
- Ekonomik HTTP ACK öncesi atomik DO SQLite kaydı; hareket için yaklaşık
  bir saniyelik yerel checkpoint ve beş saniyelik D1 checkpoint vardır.
  Revision CAS ve hash, kayıp onay/çakışmayı ayırır; dış kayıt çakışmasında
  oda durur, otomatik kayıt birleştirilmez.
- Oturum `__Host-roamcroft-session`: Secure, HttpOnly, SameSite=Strict;
  otuz günlük süre ve sunucuda hash kimliği. Hesap/cihazlar arası kurtarma yok;
  çerez kaybı erişimi kaybettirir. Sunucu dünyasına JSON yükleme açık değildir.
- Aynı kaynak, üyelik, komut izin listesi, nonce/sıra, tekrar koruması, istek
  kotası ve gövde sınırlarını koru. Paylaşılan HTTP protokolü 2, hareket
  protokolü 1'dir; uyumsuz istemci durmalı ve yenileme istemelidir.
- `worker/security.mjs` ve üretilen güvenli giriş; yanıt başlıkları ve HTML
  script nonce'larıyla CSP uygular. Script için unsafe-inline/unsafe-eval
  açma; dinamik arayüz stillerinin ihtiyacını script izniyle karıştırma.
  API ve statik yanıtların güvenlik başlıkları ayrı ayrı doğrulanmalıdır.
- `db/schema.ts` eski co-op tablolarını içerir; aktif authoritative/lobi/shared
  tabloları ilgili sunucu modüllerinde SQL ile de hazırlanır. Tek başına bu
  Drizzle dosyasını bütün aktif veri modelinin kaynağı sayma.
- Çevrimdışı Engine tarayıcı paketindedir. Sunucu doğrulaması oyun
  algoritmalarının gizlendiği veya bütün güvenlik açıklarının kapandığı anlamına gelmez.

## Doğrulama ve yayın araçları

İstenen temel sıra:

```text
npm ci
npm run typecheck
npm test
npm run build
```

- `npm ci` kilit dosyasını kullanır; sorun çözmek için kendiliğinden
  `npm install`, `npm update`, `npm audit fix` veya sürüm değişikliğine geçme.
- `typecheck`: `tsc --noEmit`. `test`: Node test runner + experimental strip
  types ile `tests/*.test.ts`.
- `build`: Vinext build → `scripts/finalize-build.mjs` →
  `scripts/check-budget.mjs`. Bu komut yerel üretim çıktısı hazırlar, yayın yapmaz.
- Finalize betiği `deployment.config.json` verisini üretilmiş Wrangler
  yapılandırmasına uygular; güvenlik sarmalayıcısı, DO/WS girişi, migration
  tanımı ve PWA dosya listesini üretir. Üretilmiş dist dosyalarını elle düzeltme.
- Statik varlık bütçesi 3.000.000 bayt; rapor `dist/client/asset-budget.json`.
  Sıkıştırılmış aktarım değeri tahmindir, gerçek ağ ölçümü değildir.
- `.github/workflows/check.yml` temel dört adıma ek olarak yerel üretim
  Worker/D1/DO ve dört WS istemcisiyle `check:runtime` çalıştırır.
- `check:http`, `check:runtime`, `audit:economy`, `benchmark` ek araçlardır.
  Runtime testleri yerel test verisi kullanmalıdır; gecikme ölçümlerini başka
  CPU ağırlıklı testlerle aynı anda çalıştırma.
- İlgili regresyonlar: eski kayıt/yedek kurtarma, atomiklik/çoğaltma, dolu
  çanta, üretim sahipliği, negatif koordinat/streaming, batching/culling,
  yeniden bağlantı, ortak uyku ve mobil etkileşim.
- Yeni değişikliklerde gerekli kontrolleri çalıştır; yalnız uygulanmış bir
  geri döndürülebilir belge değişikliği için anlamsız test ekleme.
- `node_modules`, `dist`, `.wrangler`, `.vinext`, `.next`, `work` ve
  `*.tsbuildinfo` gibi yerel/üretilmiş çıktıları kaynak değişikliği sayma.
- Testleri gerçekten çalıştırmadan başarılı ilan etme. Tarihsel test sayısı
  ile mevcut çalıştırmanın sonucunu ayrı raporla.

## Belgeler, inceleme kapsamı ve bilinen açıklar

- İlk incelemede README, CHANGELOG, package.json, `lib/game` altındaki 40
  TypeScript kaynağının tamamı ve `docs` altındaki 23 Markdown belgesi okundu.
  Üç arşiv ekran görüntüsü de incelendi. Başlatma/ağ bağlantılarını doğrulamak
  için ilgili arayüz, Worker, sunucu, protokol ve PWA kaynaklarına bakıldı;
  bu işlem bütün depo veya tüm test kodunun denetimi değildi.
- README başlığı 1.7.0, bazı sayılar/kalite/online açıklamaları eskidir.
  1.11.5 kodunda 24 yapı ve 20 görev vardır; dengeli kalite varsayılandır;
  ortak yüzey çiftliği ve ortak uyku uygulanmıştır.
- `docs/server-security.md` 1.4, `docs/online-readiness.md` 1.9 tabanlıdır.
  Eski planların açık işaretlerini güncel özellik yokluğunun kanıtı sayma.
- Güncel durum için kaynak kod, CHANGELOG ve en yeni doğrulama belgelerini
  birlikte kullan. `docs/development-plan.md` başındaki güncelleme eski
  sayısal içerik kotalarından daha yenidir.
- Referanslar: `docs/system-gap-review.md`, `docs/economy-baseline-1.7.0.md`,
  `docs/online-roadmap.md`, `docs/verification-1.11.5.md` ve
  `docs/performance-audit-2026-10-01.md`.
- 1.11.5 doğrulama belgesinde 185/185 test bildirilir; bu tarihsel sonuçtur.
  Sonraki oturumun sonucu komut çıktısından belirlenir.
- Açık işler: ortak maden, uzak bağımsız co-op bölgeleri, çok günlük ekonomi,
  hesap/kurtarma, fiziksel Android/PWA yaşam döngüsü, gerçek WAN/çok cihaz,
  uzun oturum ve ölçek/maliyet testleri.
- Önceki ölçümlerde streaming/sahne eşitlemede yaklaşık 49 ms kare sıçraması
  kalmıştır. Her donanımda sabit FPS, sıfır takılma veya sıfır RTT iddiası yoktur.
- Daha fazla balık/NPC/tarif, evlilik/festival, ürün kalitesi ve 28 günlük
  mevsim gibi eski plan maddelerini tamamlanmış özellik sayma. Özgün içerik ve
  mevcut sistemler arasındaki anlamlı kararlar, salt içerik sayısından önceliklidir.
- Kaynak deposunun varlığı canlı sürümü, Cloudflare/GitHub bağlantılarını veya
  format öncesi oyuncu kayıtlarının kurtarıldığını doğrulamaz.

## Yerel doğrulama — 28 Ekim 2026

Windows üzerinde taşınabilir Node **22.13.0**, npm **10.9.2** kullanıldı.
Başlangıçta npm PATH'te yoktu; resmi Node arşivi SHA256 doğrulamasıyla yalnız
Git tarafından yok sayılan `work/toolchains` altına açıldı. İlk kısıtlı ağ
kurulumu registry.npmjs.org için ENOTFOUND aldı; ağ erişimi onayından sonra
aynı `npm ci` başarılı oldu. Sistem geneline kurulum yapılmadı.

| Komut | Bu çalıştırmanın sonucu |
| --- | --- |
| `npm ci` | Başarılı; 575 paket kuruldu, 576 paket tarandı. |
| `npm run typecheck` | Başarılı; `tsc --noEmit`, çıkış kodu 0. |
| `npm test` | 185 başarılı, 0 başarısız, 0 atlanan; yaklaşık 14.67 saniye. |
| `npm run build` | Başarılı; finalize ve 3 MB varlık bütçesi kontrolleri geçti. |

- Statik toplam yaklaşık **2.70 MB**, tahmini sıkıştırılmış aktarım **1.49 MB**.
- npm kurulum taraması **23 güvenlik bulgusu** bildirdi: 1 düşük, 9 orta,
  10 yüksek, 3 kritik. Otomatik düzeltme, sürüm yükseltmesi veya kilit dosyası
  değişikliği yapılmadı. Bu bulgular giderilmiş sayılmamalıdır; eski belgelerdeki
  sıfır audit sonucu bu kurulumu temsil etmez. Etkileri ayrıca incelenmelidir.
- Kullanım dışı esbuild-kit/punycode ve deneysel Node API uyarıları vardı.
  Vinext bazı rotaları statik olarak sınıflandıramadığını bildirdi; derleme
  başarıyla tamamlandı. Bunlar test hatası olarak raporlanmadı.
- `check:runtime`, canlı HTTP kontrolü ve tarayıcı/fiziksel cihaz testi bu
  doğrulamada çalıştırılmadı. Yerel build başarısı canlı D1 erişimi veya canlı
  dağıtım doğrulaması değildir.
- Uygulama/oyun kaynakları değiştirilmedi; dağıtım, commit veya push yapılmadı.
