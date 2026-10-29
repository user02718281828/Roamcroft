# 1.14.0 — Inventory & Hotbar 2.0 veri sözleşmesi taslağı

**PLANLANDI; uygulanmış mekanik veya onaylanmış şema değildir.** 1.13.0 rehber
tesliminden sonra ayrı tasarım kapısıdır. Yeni kayda alan eklenmedi, göç yapılmadı.
Referans: master plan bölüm 3 ve mevcut Bag/State/save/HTTP2/WS1/recipient kuralları.

## Kaynaklar ve tek otorite

- Tüketilen/üretilen eşya stoğu ilk geçişte mevcut `Bag<Record<itemId,count>>`
  olarak tek ekonomik defter kalır. Hotbar, ekipman ve görsel yığın miktar kopyası
  tutmaz. 600/900 kapasite ve depo/overflow kuralları korunur.
- Dokuz yuva: `null | {kind:'item', itemId} | {kind:'tool', instanceId}`.
  Aynı eşya iki yuvaya bağlanabilir; ikisi aynı stoğu okur. Sıfır stoklu referans
  etkisiz görünür; eşya veya miktar üretemez. Silinmiş/geçersiz kimlik boşaltılır.
- Araç envanteri `ownedTools[instanceId] = {kind, ownerProfileId}` önerilir.
  Kademe için ilk aşamada **mevcut upgrades tek kaynaktır**, ikinci bir level
  alanı kopyalanmaz. Sonraki örnek bazlı yükseltme kararı ayrı şema ister.
- Araç eşyaları ilk aşamada atılmaz/satılmaz/başkasına verilmez; mevcut ücretsiz
  araç erişimi kaybolmaz. Kapasite, ticaret ve kayıp/yeniden edinme dengesi
  onaylanmadan bunlar ekonomik olarak dolaşıma sokulmaz.
- El ile etkileşim her zaman erişilebilir temel eylemdir. Ekim eşyası tohum
  kimliğine, gübre kendi stoğuna bağlanır; inşa ayrı yerleştirme modudur.
  Hotbar bir tarifi veya keyfî sunucu metodunu çalıştıramaz.

Görsel yığınlar başlangıçta Bag'den türetilir; 99 gibi bir gösterim sınırı eski
1.200 odunu silemez veya yeni kapasite sınırına dönüştüremez. Kalıcı `stackId`
ve yığın bölme defteri istenirse bu ilk sözleşmeden ayrı tasarlanır; hem Bag
hem bağımsız stack quantity tutularak iki ekonomik otorite oluşturulmaz.

## Eski kayıt ve kimlik göçü

1. Ayrı onaydan sonra gerekli SAVE_VERSION/protokol sürümü ve minimum istemci
   sürümü seçilir. Yalnız UI tercihleri oyun şemasına gereksiz yere sokulmaz.
2. Eski dosya önce eski kurallarla doğrulanır; bilinmeyen eşya kimliğini şu anda
   reddeden doğrulama, göç gerekçesiyle gevşetilmez. Taşmış geçerli miktar korunur.
3. Eski alet erişimleri ve her upgrade seviyesi bire bir araç referansına
   eşlenir. Tekrar göç var olan araç kimliğini kullanır; yeni ödül/araç çoğaltmaz.
4. Offline araç kimliği, kayda bir kez atanacak world/profile kimliği altında
   sabit ad alanıyla üretilir; seed tek başına benzersiz kimlik sayılmaz.
   Sunucuda kalıcı profil kimliği ve araç sahipliği sunucuda atanır. İstemci
   gönderdiği UUID ile sahiplik veya araç kazanamaz.
5. Eski Bag/altın/stats/claimed/upgrades ve dünya üretim sürümü aynı kalır.
   Kayıt yükleme yalnız dönüştürür; mevcut dünyaya createState profili uygulanmaz.
6. Önceki snapshot/JSON yedeği tutulur, yeni kayıt atomik yazılır. Kesinti,
   quota veya doğrulama hatasında head değiştirilmez. Yeni sürümü eski istemci
   sessizce açıp alanları düşürmemeli; açık yenileme/geri dönüş yolu gerekir.

## Sunucu ve çok oyunculu komutlar

- Düzenleme UI tercihi olarak tutulabilir; aktif ekipman sunucunun bildiği
  sahiplikle eşlenir. Geçerli şema/slot 0–8/eşya izin listesi/araç sahipliği
  doğrulanır. Salt atanmış slot ne malzeme ne upgrade verir.
- Kullanma mevcut act/eat/craft/build yollarına çözülür. İstemci miktar,
  enerji, konum, süre, tier veya maliyet dayatamaz. Nonce/sequence/ACK/replay
  ve kota korunur; yeni protokol eski istemciyi güvenli biçimde durdurur.
- Depoya/oyuncuya ekonomik taşıma gerekiyorsa bütün stok ve kapasite kontrolü
  + atomik DO kaydı ACK öncesindedir. Kaybolan ACK aynı işlem kimliğiyle
  tekrarlandığında ikinci eşya veya tüketim doğurmaz.
- Kişisel çanta ve araç, ortak altın/dünya/depo ile karıştırılmaz. recipient,
  kuyruktaki yükseltme, ayrılan oyuncunun makine çıktısı ve kalıcı profil
  limitleri korunur. UI sürüklemesi henüz sunucu onayı alınmış sonuç gibi çizilmez.

## Klavye ve dokunma

1–9 yuva seçimi; seç → ata/taşı/kullan açık ayrımı; Space/Enter ve odakla
tam erişim. Mevcut 1–8 araç kısa yollarından geçiş anlaşılır anlatılır.
Dokunmada en az 44 px hedef, yatay hotbar kaydırması/joystick/pinch çakışma
testi. Sürükleme tek yol olamaz. pointercancel, blur, sekme gizleme, menü ve
yeniden bağlantı bekleyen sürüklemeyi iptal eder; sessiz eşya atma/tüketme yok.
Ekipman seçimi ile kullanma iki ayrı eylem; ekran okuyucu ad/miktar/kademe/seçim
durumunu duyar. Sıfır stokta sebep açıklanır; yeni dil eklenmez.

## Kabul matrisi

| Alan | Zorunlu örnekler |
| --- | --- |
| Göç | 1.11/1.12/1.13 kayıtları, tüm tier 0–3, taşmış Bag, boş çanta, aynı göçü iki kez, eski yedek kurtarma, bozuk/bilinmeyen kimlik reddi |
| Sahiplik | Konuk boş çanta, host/guest geçişi, yeni davetle aynı profil, başka profilin instanceId'si, çift slot referansı, offline import ↔ sunucu ayrımı |
| Atomiklik | Son eşya aynı anda kullan/depola, dolu çanta/depo, kayıp ACK/replay, gecikmiş eski komut, offline/online çift tüketim, queued upgrade maliyeti |
| Yaşam döngüsü | Göç yazarken kesinti/quota/IDB abort, restart/D1 conflict, reconnect sırasında seçili araç, sahibinin ayrılması ve recipient ürünü |
| UX | 320×568, 390×844, 844×390, masaüstü; klavye-only, ekran okuyucu, dokunma iptali, Türkçe/İngilizce, düşük hareket tercihi |

Çıkış: stok/altın/ilerleme eşitliği, sıfır kayıp/çoğaltma, tam test/typecheck/
build/runtime + gerçek cihaz/WAN kontrolü. Tasarım kabul edilmeden 1.13.0'a
yarım hotbar, yeni şema veya migration eklenmez.
