# 1.13.0 — Gameplay Foundation

29 Ekim 2026. Bu dosya ilk oturum araştırması ve sınırlı uygulama paketidir;
gerçek oyuncu testi veya tamamlanmış Roamcroft 2.0 kanıtı değildir.

## Doğrulanmış başlangıç ve yayın sınırı

- Çalışma alanı `C:\Users\devbu\Roamcroft`; yeni dal
  `codex/gameplay-foundation-1-13`, başlangıç `6aa0e74`.
- GitHub main `6aa0e7407640e848a3e8c5b7b1e39515f938a669`, GitHub verify başarılı.
  Aynı SHA için Cloudflare Build `bf4d2c15-031e-4723-9e08-92c654401d17`, sürüm
  `1fa63630-edbe-4220-9709-b9c124cc6af0` başarılı. Canlı HTTP 200 ve 1.12.0
  açılış metni yeniden doğrulandı. Bu oturum 1.13.0'ı main'e göndermez/yayımlamaz.
- İzlenen dosyalar başlangıçta temizdi; önceden bulunan `tatus -sb` izlenmeyen
  dosyası korunur, teslim commit'lerine alınmaz. Sentry worktree'sine dokunulmaz.
- Sentry SDK/mahremiyet filtresi/CSP, Engine kuralları, kayıt şeması ve ağ
  protokolleri korunacak. 1.14.0 hotbar ve sonraki Living World/Online ayrı aşamalar.

## Koddan bulunan ilk oturum sorunları

Kaynaklar: model.createState/act/craft/trade/build/tick/systems, data eşya/ekin/
tarif/yapı/görev katalogları, quests.recommendedQuest, farming, Game/Panels.

1. Hareket: WASD/ok, tıkla-yürü ve joystick var. İlk ekran yönlendirmesi kısa;
   doğru aracı seçme/zemin/mesafe kuralları birlikte anlatılmıyor. İlk hareketin
   tarihsel sayacı yok; rehber böyle bir tamamlanma sonucu uydurmamalı.
2. Toplama: 25 odun, 18 taş, 10 lif, 20 tohum, 8 meyve, 3 ekmek, 10 yem ve
   180 altınla başlanır: 94 eşya. Başlangıç stoğu görev sayacını doldurmaz.
   12 odun hedefi temel güçle 4 × 3 odun vuruşu, iki ağaçta tamamlanır.
   Üç vuruş bekleme aralığı 1,14 saniyedir; yürüme ve oyuncu karar süresi hariç.
3. Araç: Kaynak düğümünde el, doğru araç yerine de kabul edilir; güç yine
   kaynağın ilgili alet yükseltmesini kullanır. Bunu bu pakette değiştirmek
   denge değişikliğidir. Balta/kazma yükseltmesi düğümün toplam ürününü artırmaz,
   kalan birimleri daha az vuruşta toplar. Kılıç enerji tüketmez; balıkçılık
   3 enerji ve 3,4 saniye bekleme kullanır, garanti balık değildir.
4. Tarım: Dokuz hazır çapalı kare, üç buğday ve biri olgun ekin vardır.
   İlk hasat hemen mümkün; oyuncunun kendi ektiği buğdayın nominal büyümesi
   65 saniye, su/mevsim/beceri koşullarıyla değişir. Olgun üründe çapa sökebilir;
   rehber hasatta eli önerir. Menüde çevrimdışı zaman bekler.
5. Üretim: Tahta/ip/bandaj için ilk seviye malzeme hazırdır. Kuyruk üç iş,
   sıradan el işi nominal 7 saniye, 4 temel enerji. İlk görev tavsiyeleri
   üretim/satışı bahçe hedeflerinin arkasına bırakır; rehber ayrı öneri sunmalı.
6. Satış: Malzemeyi sakla/üret/sat kararı görünür değil. Geri satın alma fiyatı
   dostluksuz durumda 1,55 × taban fiyatın yukarı yuvarlanmış halidir.
7. İnşa: Başlangıç stoğu atölye (25 odun/10 taş) veya kümesi (25/12) hemen
   karşılar; ikisini birden karşılamaz. Bu tercih anlatılabilir; stokları eski
   kayıtlardan silmek çözüm değildir. Yeni profil kararı ölçüm ve onay ister.

## Seçilen tamamlanabilir paket

**TAMAMLANDI (sınırlı paket):** Mevcut el kitabında isteğe bağlı İlk Adımlar; mevcut sayaçlardan
gather/till/plant/harvest/craft/sell/build ilerlemesi, bir sonraki somut eylem,
araç seçme veya ilgili menüyü açma. Yeni görev ödülü/gate veya otomatik ekonomik
eylem yok. HUD ipucu kapatılıp yeniden açılabilir; tercih oyun kaydından ayrıdır.
Araç kartlarında enerji/mesafe/kademe faydaları; sonuç vurgusu yalnız mevcut
Engine/sunucu olaylarından yapılır, onaylanmamış tıklama ürün kazanımı sayılmaz.

## İlk 30 dakika kabul deneyi (henüz oyuncu sonucu değil)

| Pencere | Ölçülecek gözlem / kabul hedefi |
| --- | --- |
| 0–2 dk | TR/EN oyuncu yürüyüp kamerasını kullanır; rehberi kendi açar/kapatır. |
| 2–5 dk | Doğru araçla kaynağa yaklaşır; miktar/enerji geri bildirimini anlar. |
| 5–10 dk | Dört kare çapar, altı tohum eker, sular; olgun ekini el ile hasat eder. |
| 10–15 dk | İlk el işini kuyruğa alır, yalnız açık oyun zamanı ilerlediğini anlar. |
| 15–20 dk | Ham ürün/satış/işleme arasında bir tercih yapar; tohumu yanlışlıkla tüketmez. |
| 20–30 dk | Bir yapı için malzemeyi ayırır veya eksik kaynağı toplar; istediği yolu seçer. |

Kaydedilecekler: adım başı gerçek süre, yardım sayısı, yanlış araç, terk noktası,
enerjisiz kalma, rehberi kapatma ve kararın gerekçesi. Hedefler başarı oranı
veya tutundurma istatistiği değildir. En az TR/EN yeni oyuncu, masaüstü/dokunma
gözlemi gerekir. Otomatik ajan rotası insan süre ölçümünün yerine geçmez.

## Güvenlik incelemesi

Bu oturumdaki `npm audit --json`: 25 paket, 3 kritik/10 yüksek/11 orta/1 düşük.
`oxfmt@0.61.0 → tinypool@2.1.0`; `shadcn@4.18.0 → MCP SDK@1.30.0 →
express@5.2.1 → proxy-addr@2.0.7`. Bunlar formatter/CLI zincirleri. Mevcut
üretim JS taramasındaki oxfmt eşleşmesi paket metaverisidir; Worker'da bu
araçların çalıştığına kanıt bulunmadı. Bu, tüm üretim risklerinin yokluğu veya
25 bulgunun kapanması değildir. Vite/dev sunucusu, CLI ve ağ araçları ayrı
kontrollü güvenlik paketinde giderilir; bu görev sürüm yükseltmez/CSP gevşetmez.

## Karşılaştırmalı ekonomi deneyi

Tekrarlanabilir komut: `npm run audit:first-session` (JSON). Kaynak
`scripts/first-session-audit.ts`; üç seed: 42, 84621, 20261029. Deney modülü
oyun veya sunucu tarafından import edilmez. `sparse-proposal-v1` yalnız deney
durumu oluşturur: 8 odun, 6 taş, 4 lif, 6 buğday tohumu, 4 havuç tohumu,
4 meyve, 2 ekmek ve 60 altın; mevcut üç başlangıç ekini korunur.

| Ölçüm | Gerçek mevcut profil | Deney profili, uygulanmadı |
| --- | ---: | ---: |
| Başlangıç altını | 180 | 60 |
| Başlangıç eşya adedi | 94 | 34 |
| Başlangıç eşyalarının taban satış değeri | 554 | 222 |
| Hemen karşılanabilen seviye 1 yapı türleri | Atölye, kamp ateşi, kümes, depo, çit | Çit |
| İlk atölyeye giden rotada kaynak vuruşu | 4 | 9 |
| Rota bitiminde altın | 385 | 265 |
| Rota bitiminde enerji | 100 | yaklaşık 94,06 |
| Scriptin aktif simülasyon süresi | 17,7 sn | 21,0–22,6 sn |

Politika: Gerçek Engine.go/act/tick ile yürü/topla → 4 çapa → 6 buğday ekimi ve
sulama → başlangıçtaki olgun buğdayı hasat → bir tahta işi → bir tahta satışı →
eksik malzemeyi topla → bir atölye yerleştir. Hazır görev ödülleri aynı noktalarda
alınır. Kuyrukta gerçek 7 saniyelik üretim ilerler. Araziye ışınlanma veya RNG
yeniden yazımı yoktur; inşa mevcut Engine'in yüklü kare yerleştirme kuralını
kullanır. Menüde düşünme/okuma, yanlış giriş, animasyonu izleme, gerçek tıklama
aralığı, tüm gün bakım döngüsü ve portal/online gecikmesi modellenmez.

**Bu süreler insanın ilk oturum süresi veya başarı oranı değildir.** Script
bilinen hedefleri gecikmesiz seçer, bazı tarım eylemlerinin cooldown'u yoktur ve
ilk olgun ekini hazır alır. Hızlı rota mekanik alt sınırıdır; insanlarda 30
dakikalık derinlik kanıtlamaz. Üç seed'deki benzer sonuç başlangıç köyünün
korunan düzenindendir, bütün dünya/oyuncu yollarının örneklemi değildir.

İlk üç görevin ödülü toplam 120 altın; 2. ve 3. seviyeler toplam 75 altın ve
enerjiyi 100'e doldurur; satış 10 altındır. Böylece daha sade profil de aynı
erken ödül/enerji ivmesini taşır. Yalnız malzeme azaltmak çoğunlukla beş ek
vuruşa dönüşür; anlamlı karar derinliği veya tutundurma sağlamış sayılmaz.

**Karar:** 1.13.0'da başlangıç kaynağı, ödül, büyüme, fiyat, cooldown ve seviye
yenilenmesi değiştirilmedi. Önce TR/EN yeni oyuncu gözlemi, ardından görev/
başlangıç/enerji döngüsünü birlikte ele alan onaylı denge deneyi gerekir.

Gelecekte yeni profil kabul edilirse sürümlü kimlik yalnız **yeni dünya
oluşturma** yolunda atanır (`legacy-1.12` / onaylı yeni profil). Yüklemede eksik
kimlik eski profil kabul edilir; eldeki Bag/altın/upgrades/stats üzerine profil
yazılmaz. Offline yeni dünya, soğuk kişisel sunucu dünyası ve yeni ortak dünya
ilk kopyası ayrı test edilir; ortak konuk kişisel başlangıç paketi kazanamaz.
Yeni alan/göç gerekiyorsa ayrı tasarım/onay, eski yedek ve atomik kayıt kapısı.

## 1.13.0 somut kapsamı ve sonraki aşama

Rehber mevcut earned stats/claimed değerlerini okur; ilk kaynak, toprak,
ekim, ilk hasat, üretim, satış ve yapı hedefleri seçilebilir. Yanlış sırada
ilerlemek engellenmez. Satış adımı tek satış ister; mevcut 300 altınlık görev
değişmez. Tamamlanmış eski görevler kayıp sayaç yüzünden baştan istenmez.
Klavye/dokunma ve kalıcı, kayıttan ayrı rehber tercihi vardır. Araç seçme
düğmesi yalnız seçim yapar; rehber açılışı/ödül önizlemesi ekonomik komut değildir.

Araçların yeni enerji/upgrade notları gerçek Engine maliyet/hasar/yield testleriyle
karşılaştırılır. Mevcut ses ve parçacıklar korunur; kazanım mesajında ikon ve
kısa vurgu yalnız kabul edilmiş mevcut Engine olayıyla oluşur. Yeni animasyon,
ganimet düşürme mekaniği, yükseltme dengesi veya optimistik ödül eklenmez.

[1.14.0 veri sözleşmesi](inventory-hotbar-1.14-design.md): dokuz referans,
tek miktar otoritesi, araç sahipliği, göç, HTTP/DO doğrulaması, mobil/klavye
etkileşimi ve kabul matrisi. Bu oturumda gerçek hotbar/ekipman/göç uygulanmaz.
Gerçek sonuçlar: [1.13.0 doğrulama kaydı](verification-gameplay-1.13.0.md).
