# Davranışı koruyarak modülerleştirme planı

Kaynak: kullanıcının 29 Ekim 2026 tarihli CodeScene GitHub analizi özeti.
Panel ve ham CodeScene çıktısı bu oturumda bağımsız doğrulanmadı. Analiz,
GitHub sürümünü kapsıyor; o sıradaki yerel UI 2.0 değişikliklerini kapsamıyor.
Puanlar hata veya güvenlik açığı kanıtı değildir.

| Ölçüm | Bildirilen sonuç |
| --- | --- |
| Kapsam | Yaklaşık 27.836 TS/JS satırı |
| Genel / hotspot Code Health | 7,4 / 4,9 |
| Kırmızı / sarı / yeşil | %18 / %30,3 / %51,7 |
| Refactoring önerilen / etkilenen dosya | 2 / 7 |
| Kötüleşen / kötüleşme riski | 1 / 3 |
| model.ts / scene.ts | 1,15 / yaklaşık 1,7 |
| client.ts / Game.tsx / save.ts | 5,51 / yaklaşık 5,76 / 6,5 |

`client.ts` ve `save.ts` adlarının CodeScene'deki tam yolları sağlanmadı;
birden fazla client modülü olduğu için kesin eşleme ayrıca doğrulanmalı.
Panels/Launcher puanlarının yüksek olması, iyi oyuncu deneyimi kanıtı sayılmaz.

## Sınırlar

Bu UI paketinde model/scene topluca yeniden yazılmaz. SAVE_VERSION=1, eski
anahtarlar, dünya üretimi, RNG çağrı sırası, ağ protokolleri, ekonomik atomiklik
ve zaman adımı korunur. UI tesliminden sonra küçük ayrı paketler uygulanır.
Her paket önce davranış testi, sonra çıkarım, sonra karşılaştırma ve commit.

## Riskli sorumluluklar ve test kapıları

| Alan (bildirilen satır sayısı) | Kaynakta görülen sorumluluk / önce gerekli kanıt |
| --- | --- |
| createState (169) | Tohumdan arazi, başlangıç yapıları/çantası/ilerleme. Aynı tohum için tüm State ve kaydet-yükle eşitliği; eski generation dünyasının değişmemesi. Önce saf üretim yardımcıları ayrılabilir. |
| Engine.act (163) | Guest komut yönlendirmesi, cooldown/mesafe, araç, maden ve arazi eylemleri. Araç × arazi × enerji × mesafe matrisi; offline/otoriter sonuç eşitliği; reddedilen eylemde stok ve sayaç değişmemesi. |
| Engine.combat (140) | Kuleler, düşman hedefi/hareketi, saldırı hazırlığı, hasar/ölüm. Sabit RNG ve tick dizisinde can, ganimet, cooldown ve olay sırası; boss yarı can, görüş hattı ve yenilgi dönüşü. |
| Engine.systems (103) | Keşif ödülleri ve aralıklı tarla/makine/hayvan üretimi. Dolu çanta, recipient, sökme iadesi, parti girdisi ve tekrar ACK testleri; maden/yüzey zaman ayrımı. Saf hesapla → tek commit sınırı korunmalı. |
| Engine.wanderAnimals (93) | Yüklü arazi, ev, gece/tehdit ve çalışma zamanı rota durumları. Kare başı iki rota bütçesi; negatif koordinat ve streaming; State ile runtime alanlarının ayrılması. |
| Engine.tick (62) | 0,1 delta sınırı, cooldown, oyuncu yolu, NPC ve diğer sistemlerin sıralaması. Aynı girdi/tick dizisinin pozisyon/enerji/olay eşitliği; DO sabit adım ve prediction regresyonları. |
| build/move/trade/raid | Otorite ve maliyet/çarpışma/saldırı kapıları. Eşzamanlı ekonomik komut, replay, kapasite ve yetkisiz işlem testleri; facade Engine üzerinde kalmalı. |
| scene.ts | GPU kaynak ömrü, model kurma, dünya eşitleme, render/minimap. Küçük kaynak sahipliği sınırları; dispose/context loss, instancing/culling ve 49 ms streaming sıçraması baz çizgisi. Render çıkarımı State'i değiştirmemeli. |
| Game.tsx / ağ istemcileri / save.ts | Önce yaşam döngüsü, listener/abort/yeniden bağlanma ve atomik yedek testleri. Kaydetme doğrulaması veya nonce/ACK sınırlarını sadeleştirme gerekçesiyle gevşetme. |

## Uygulama sırası (PLANLANDI)

1. UI teslimi ve ilk 30 dakika ölçümü; riskli davranışlar için mevcut test
   kapsama haritası ve sabit seed/tick fikstürleri.
2. Saf hesaplama/üretim yardımcılarını çıkar; public Engine API değişmesin.
3. Araç geri bildirimi işi öncesinde yalnız act'ın ilgili dalına karakterizasyon
   testleri; savaş işi öncesinde combat testleri. Büyük tek PR yerine küçük adımlar.
4. Hayvan rota/simülasyon çalışma zamanı ve systems üretim sınırları.
5. Scene kaynak sahipliği ve render alt sistemleri, aynı sahnede CPU/GPU ölçümü.
6. Ağ ve kayıt refactoring'i en son, yerel dört istemci + gerçek WAN ve kesinti
   kanıtıyla. Şema/protokol değişikliği gerekiyorsa ayrı tasarım ve kullanıcı onayı.

Kabul: typecheck, tam test, build/bütçe, runtime ve ilgili benchmark karşılaştırması;
aynı kayıt/girdi için aynı ekonomik sonuçlar; eski kayıt geçer; sıfır kayıp/çoğaltma.
CodeScene puan artışı tek başına teslim veya oynanış kalitesi ölçütü değildir.
