# Roamcroft Art Direction 2.0 — uygulanacak sanat rehberi

Durum: **PLANLANDI / P1**. Mobile Recovery hata düzeltmeleri, bu sanat
paketinin tüm menülere uygulanması değildir. Mevcut low-poly dünya korunur.
Kaynak: ana devam talimatı ve kullanıcının 30 Ekim çalışma listesi.

## Kimlik ve görsel dil

Sıcak orman, kendi emeğiyle kurulan yuva ve keşfedilmeyi bekleyen vadi.
Stardew Valley/Minecraft yalnız deneyim referansıdır; arayüz, karakter, logo,
eşya, ses veya müzik kopyalanmaz. Mevcut varlıkların köken/lisans kaydı
tamamlanmadan yeni portal pazarlama paketi yayımlanmaz. Yeni çizimler özgün
olmalı; lisanssız üçüncü taraf görsel alınmaz.

| Öğe | Karar / kabul |
| --- | --- |
| Yüzeyler | Orman yeşili `#20372b`, koyu gölge `#142b24`, ahşap/kumaş katmanları. Doku metin arkasında düşük yoğunlukta; ağır raster arka plan zorunlu değil. |
| Vurgu | Hasır/kumaş `#dcca91`, sade altın `#edcc82`; metal küçük bağlantılarda. Altın bütün düğmelere dağıtılmaz; tek birincil eylem belirgin. |
| Tehlike | Kiremit/koyu kırmızı saldırı; araç kullanımı toprak/altın. Renk tek bilgi kaynağı olamaz: ikon ve metin eşlik eder. |
| Çerçeve | İnce doğal kenar, hafif iç gölge, ölçülü yuvarlaklık; yönetim paneli kart yığınları azaltılır. |
| Yazı | Mevcut fontlar korunarak başlıkta karakterli serif, sayısal/gövde metninde okunabilir sistem fontu. TR karakter, uzun EN metin, %200 yakınlaştırma ve odak testi. Yeni font indirme bütçesi ayrı karar. |
| İkon | Tek kaynak `GameIcon`; atlas hücreleri bağımsız kırpılır, oran korunur. Miktar ayrı okunur; görsel sıralama stok değiştirmez. Araç seviyesi veri otoritesi değildir. |
| Hareket/ses | Eylem onayından sonra küçük tepki; iptal/gecikmede sahte ürün yok. Azaltılmış hareket/ses tercihi; hover zorunlu bilgi yok. |
| Mobil | En az 44px, birincil eylem 56–64px; OS kenarından inset; güvenli alanlar. Form/kopyalama/ekran okuyucu korunur. |

## Sonraki ayrı paket: karşılama + örnek envanter

1. Tek Roamcroft logosu; yinelenen başlık ve “Return to your world” açıklaması
   kaldırılır. Özgün yerel oyun dünyası sahnesi/arka planı; eski görüntü güncel
   sürüm diye sunulmaz.
2. Devam Et, Yeni Oyun, Arkadaşlarla Oyna, Ayarlar. İlk ziyaret/kayıtlı ziyaret
   ayrı görünür. Yeni oyun mevcut kaydı açık onay ve dışa aktarma yolu olmadan
   değiştiremez. Sunucu ve cihaz kaydı ayrı anlatılır.
3. Bir örnek çanta ekranında ahşap/kumaş/ikon/ayrıntı/odak sistemi doğrulanır.
   Masaüstü merkez modal ve mobil oyun navigasyonu aynı görsel kimliği taşır.
4. Kullanıcı kabulünden sonra üretim, inşa, çiftlik, emanet, günlük, dostlar,
   online, maden, ayarlar ve HUD'a küçük paketlerle yayılır. HUD'da sağlık,
   enerji, açlık, görev, bağlantı ve tehlike uyarıları kalır; soru işareti ve
   görev düğmelerinin adları/işlevleri okunur olmalıdır.

Bağımlılık: Mobile Recovery fiziksel cihaz kabulü; eski kayıt ve giriş akışı.
Kabul: TR/EN, 320×568/390×844/844×390/1440×900, gerçek Android Chrome ve iOS,
klavye/odak, azaltılmış hareket, %200 metin; 3MB varlık bütçesi; eski kayıt,
Sentry/CSP ve dört oyunculu runtime. Bunlar tamamlanmadan “tüm UI yenilendi” denmez.

## Mevcut Three.js ve arayüz kaynak haritası

Bu harita modül/fonksiyon sorumluluğunu gösterir; motoru yeniden yazma izni değildir.

| Görsel alan | Kaynak / giriş |
| --- | --- |
| Karakterler/araçlar | `lib/game/scene.ts`: `makeCharacter`, `handTool`, `render` içinde araç kurma/hareketi; `animateHuman`; `lib/game/living.ts`: `humanPose`. |
| NPC | `scene.ts`: `makeVillagers`, `nameTag`, `render`; `living.ts`: `schedule`, `timedGreeting`; kişilik/diyalog `lib/game/content.ts`. |
| Hayvanlar | `scene.ts`: `animal`, `render`; `living.ts`: `animalPose`; `actor-batches.ts`: `AnimalBatches.update`, `animal-presentation.ts` görsel yumuşatma. |
| Ağaç/kaya/kaynak | `scene.ts`: `resource`, ortak `geo/mesh/mat`; `art-direction.ts`: `fruitTree`; kurallar `model.ts`, üretim `world.ts`. |
| Çimen/zemin/ekin | `scene.ts`: `makeTerrain`, `refreshGround`, `updateTurf`, `crop`, `updateTerrain`; `batches.ts` toplu çizim. |
| Nehir/su/kıyı/köprü | `scene.ts`: `makeTerrain`, `refreshGround`, `shore`; `visuals.ts`: `WATER_SURFACE_Y`, `addWind`; köprüler de kıyı/zemin görselinin parçasıdır. |
| Ev/binalar | `scene.ts`: `building`, `specialBuilding`; `art-direction.ts`: `cottage`; `workshop-art.ts`: `addWorkshopArt`, `animateWorkshop`. |
| Işık/hava/doğa | `living.ts`: `sunlight`; `scene.ts`: `makeWeather`, `makeClouds`, `animateNature`, `render`; `clouds.ts`, `ambience.ts`, `visuals.ts`. |
| Efekt/düşman | `scene.ts`: `burst`, `celebrate`, `enemy`, `render`; savaş kuralları `model.ts`/`expedition.ts`. |
| Eşya/UI ikonları | `components/game/GameIcon.tsx`, `OrchardIcon.tsx`, `lib/ui/item-art.ts`, dört `public/art/farm-icons-*.webp`; NPC portreleri ayrı `VillagerPortrait.tsx`. |
| Arayüz | `Game`, `Launcher`, `MainMenu`, `Panels`, `CampNavigation`, `InventoryPanel`, `StoragePanel`; `ui-v2.css` ve sınırlı `mobile-recovery.css`. |
| Ses/müzik | `lib/game/audio.ts`: Web Audio üretken müzik, doğa ve eylem katmanları. Kullanıcı etkileşimi/tercihi korunur. |

Gelecek dünya işleri **PLANLANDI / P2**: model/ışık/su tutarlılığı, kamerayı
kapatan ağaç okunabilirliği, çalışma/saldırı animasyonları, NPC kişilik/rutin/
hediye/ilişki/festival, ev/çiftlik dekoru, hayvan/üretim zincirleri, savaş AI/
kaçınma/ganimet/boss, maden sırları, balık mini oyunu, başarımlar/koleksiyon/
prestij. Her biri küçük dikey paket; ekonomi/şema onayı ve performans ölçümü
gerektirir. [CodeScene planı](modularization-plan.md) davranış testlerinden önce
büyük `model.ts`/`scene.ts` refactoring'i yapılmamasını sürdürür.
