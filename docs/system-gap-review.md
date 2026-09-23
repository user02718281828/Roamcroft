# Roamcroft: karar derinliği ve uzun ömür incelemesi

22 Eylül 2026. İnceleme tabanı: 1.5.0 kaynak kodu; aşağıda “1.6.0” olarak belirtilenler bu inceleme sonucunda uygulandı. Diğer maddeler öneridir, bitmiş özellik sayılmaz.


### 23 Eylül · 1.7.0 ilerlemesi

Ekonomi ve mevcut NPC siparişleri için ilk teslim tamamlandı: her kişiye günde iki farklı teslim yolu, mevsime uygun başlangıç girdileri, yarının ihtiyaçları, altın + üretim malzemesi ödülleri ve makinede girdi/çıktı değeri karşılaştırması. Sipariş ödülünün toplam satış değeri %25 primlidir; günlük sınır iki seçenek arasında ortaktır. Eski kayıtlar korunur. Pazarın UI kısıtlaması motor satın alma komutuna da taşındı.

[Ekonomi tabanı](economy-baseline-1.7.0.md) gerçek fiyatlardan hesaplanır; üç on günlük sabit parti planı içerir. Tam oyuncu davranışı, bakım ve emek simülasyonu henüz yapılmadı. Alım/işleme/satım dengesinin tamamı çözülmüş sayılmaz. Aşağıdaki tablo başlangıç incelemesidir: ekonomi/NPC satırlarının bu ilk kısmı artık öneri değil uygulanmış özelliktir; kalıcı ilişki hikâyeleri, balıkçılık ve diğer öneriler henüz tamamlanmadı.

## Tasarım sınırı

Kullanıcının verdiği [Türkçe Wiki](https://tr.stardewvalleywiki.com/Stardew_Valley_Wiki), sistem kategorilerini kontrol etmek için kullanıldı. Referanstaki karakter, hikâye, görev metni, diyalog, yer adı, görsel, harita ve özel içerik alınmadı. Aynı olay örgüsünü farklı adlarla kurmak hedef değildir. Roamcroft'un mevcut içerikleri korundu.

Ana bulgu: oyunda pek çok sistemin başlangıcı var; asıl açık, oyuncunun neden farklı bir ürün yetiştireceği ve ödülle bir sonraki işini nasıl değiştireceği. Sayıca 100 tarif, 50 balık veya 30 kişi eklemek şu anda bu açığı çözmez. Önce az sayıda, birbirine bağlı ve okunabilir tercih gerekir.

## Mevcut durum ve öncelik

| Alan | Kaynak kodda bulunan | En önemli açık ve Roamcroft için çözüm | Öncelik / durum |
| --- | --- | --- | --- |
| Atmosfer ve kullanım | Özgün izometrik modeller, mobil joystick, gece/gündüz, açılır menüler | 1.5.0 çayır ve ağaç paleti önceki hissi değiştirdi. 1.4'ün çimen malzemesi, ağaç renkleri, yüzey gölgelendirmesi ve masaüstü kadrajı geri getirildi; yeni ev, portre, bahçe ve gece feneri kaldı. | P0 · 1.6.0 |
| Çiftçilik | Altı ekin, su, mevsimde büyüme, gübre, sera, iki meyve ağacı | Ekim öncesi süre/mevsim/kullanım bilgisi bir arada değildi. Ekim planı eklendi. Domates ve mısır sulandıkça yeniden hasat verir; tek hasatlık ekinlerin tohum geri dönüşü sürer. | P1 · 1.6.0 |
| Hayvanlar | Tavuk, inek, koyun; barınak kapasitesi, günlük yem, sevme/bağ, yavrulama, ürün toplama | Bakımın getirisi çoğunlukla aynı ürün adedine dönüyor. Önce bir günlük bakım özeti ve görünür verim tahmini; daha sonra yemleme seçimi ile otomasyon. Yeni tür ancak farklı bir üretim yolu açarsa eklenmeli. | P2 · öneri |
| Ürünler / makineler | Sabit tarifli makineler, yemek ve alet üretim kuyruğu | Makineler çantadan fark edilmeden tüketiyordu; çalışan parti için malzeme ayırmıyordu. Tek parti, isteğe bağlı tekrar, başlangıçta malzeme ayırma ve sekiz alternatif makine tarifi eklendi. Un/yem ve mutfak tercihleri tarla-hayvan-keşif döngüsünü bağlar. | P1 · 1.6.0 |
| Ekonomi | Alım/satım, dostluk indirimi, üretimle değer artışı, yükseltme maliyetleri | Her ürünü pazardan alabilmek üretimi anlamsızlaştırabilir; sabit fiyatlar aynı kârlı işlemi tekrar etmeye iter. Önce satın al → işle → sat ve hasat → işle → sat kazanç/dakika ölçümü. Sonra küçük, önceden görülen talep primleri ve sınırlı toptan sipariş; rastgele fiyat cezası yok. | P1 · sonraki çalışma |
| Balıkçılık | Oltayı atma, süre/olasılık, beceri, tek balık ürünü, yemek ve sipariş bağlantısı | Yer/saat seçimi anlamsız. Başlangıçta 4–6 gerçek, genel balık türü; Roamcroft nehrinin akıntı/kıyı koşulları ve hava tercihleri; gözlem defteri. Ardından dokunmatik için atış mesafesi ve çekme zamanını seçen kısa bir etkileşim. Referanstaki takip çubuğu mini oyunu alınmamalı. | P1 · sonraki çalışma |
| Maden / savaş | Beş kat, cevherler, asansör, saldırı hazırlığı olan düşmanlar ve son düşman | Katlar arası karar ve tekrar keşif nedeni zayıf. Daha fazla aynı kat yerine yan damar seçimi: kısa güvenli yol / daha çok yakıt ve yiyecek isteyen uzun keşif. Cevher ödülleri makine ve araç seçeneklerine bağlanmalı. | P2 · öneri |
| NPC / ilişkiler | Üç kişi, günlük sohbet/hediye, rutin, günlük sipariş, dostluktan fiyat/üretim etkisi | Aynı sipariş ve az sayıda diyalog tekrar ediyor; ilişkinin dünyadaki izi az. Mevcut kişilere Roamcroft'ta yapılan işlere tepki veren diyaloglar ve iki farklı çözüm yolu olan işbirliği görevleri. Önce üç kişiyi derinleştir, sonra kişi sayısını artır. | P1 · öneri |
| Görevler | İstatistik hedefleri, günlük sipariş, dört teslim koleksiyonu, sıralı köy hedefleri | Çoğu görev sayacı dolduruyor. Bir işi para, malzeme veya oyuncunun üretimiyle çözme seçenekleri; sonucu köyde görünür olmalı. Örneğin bakım yükünü azaltan bir düzenek için hazır satın alma / kendin üretme. Mevcut teslim sistemini yeni bir kopya merkez etrafında yeniden kurma. | P1 · öneri |
| İlerleme | Beş beceri, altı yetenek dalı, alet/yapı yükseltmeleri, köy aşamaları | Sayısal bonus çok, oyun şeklini değiştiren seçim az. Sıralı güç artışı yerine makineye tek parti/tekrar gibi kararlar; ileride düşük yakıt/yüksek hız gibi geri alınabilir tercihler. Mevcut beceri puanlarını sıfırlama. | P1 · ilk parça 1.6.0, devamı öneri |
| Etkinlikler | Hava, mevsimler, gece baskınları var; sosyal takvim etkinliği yok | İlk etkinlik, mevcut üretimle oynanan küçük bir ortak pazar günü olabilir: oyuncu satılacak ürün grubunu seçer, katılım sonucu depoya/üretime küçük yarar sağlar. Özgün kurallı bir etkinlik yeterli; hazır festival dizisi veya yarışmaları kopyalama. | P2 · öneri |
| Oyun sonu | Son maden düşmanı, en üst fener ile baskınların bitmesi, son köy aşaması, devam eden dünya | Bunlardan sonra yeni kararlar azalıyor. Sınırsız stat artışı yerine oyuncunun seçtiği bir üretim projesi: az alan, az elle bakım veya çeşitli ürün hedefi. Ödül farklı bir köy düzeni kurmaya yardım etmeli; tekrarlanan zorunlu günlük görev olmamalı. | P2 · ekonomi/üretimden sonra |

Kod dayanakları: `lib/game/model.ts`, `data.ts`, `content.ts`, `progression.ts`, `settlement.ts`, `expedition.ts`, `living.ts`, `components/game/Panels.tsx`. Maden ve hayvancılık yokmuş gibi yeniden yazılmadı; çalışan temeller genişletilecek.

## 1.6.0 oynanış kuralları

- Çiftlik ekranı: ekim mevsimi, eldeki tohum, ilk/tekrar hasat süresi, temel satış geliri ve mevcut işleme yapılarını gösterir. Süre, sulanmış açık tarla varsayımıdır; gübre/sera ve susuzluk bu süreyi değiştirir. Mevsim dışı ekinler ölmez, duraklar. Mevcut 7 günlük mevsim ve 300 saniyelik gün korunur.
- Domates ve mısır: hasatta kök kalır, yeniden büyümeye başlar, tekrar tohum üretmez. Çapa ile sökülerek yer açılabilir. Yeni kalıcı alan gerekmedi; eski ekin kayıtları aynı biçimde yüklenir.
- Makineler: yeni kurulan makine tek parti bekler. Oyuncu tekrar kutusunu açarsa döngü sürer. Eski kayıtların otomatik üretim davranışı ve kısmi ilerlemesi korunur; o partinin girdisi ilk ilerlemede ayrılır.
- Çalışan makinenin malzemesi çantadan başta düşer. Parti tamamlanmadan tarif değişmez; duraklatma girdiyi kaybettirmez. Dolu çantada bitmiş ürün makinede bekler. Sökme sırasında ayrılmış girdiler geri döner. Üretim seçimi ve parti durumu kaydedilir ve sunucu komut izin listesinden doğrulanır.
- Alternatifler: değirmende yem; ocakta bakır/demir külçesi; mutfakta elma marmeladı, armutlu tart, ekmek ve çorba; dokumada halat. Yeni çizim varlığı, harita büyüklüğü veya kare başına ek simülasyon taraması yok.

## Sıradaki teslim sırası

1. Ekonomi ve anlaşılır hedef: 3 örnek oyuncu yolu için 10 günlük kaynak/gelir ölçümü; en kârlı tek eylemin diğer yolları gereksiz kılmaması. Ardından mevcut NPC siparişlerine oyuncunun üretimine uygun çeşitlilik.
2. Balıkçılık seçimi + gözlem kaydı: birkaç türle başla, bütün türler en az bir yemek/sipariş/keşif amacına hizmet etsin. Küçük telefon ekranında tek elle oynanabilsin.
3. Hayvan bakım özeti + anlamlı otomasyon; mevcut üç NPC için kalıcı ilişki sonuçları.
4. Bunları kullanan tek özgün etkinlik, sonra üretim odaklı oyun sonu projesi.

Her teslimde: eski kayıt göçü, sunucu doğrulaması, yeniden denemede ödül çoğaltma, dolu envanter, dokunmatik menü ve üretim derlemesi kontrolü. Mobil güvenilirliği P0 olarak kalır; masaüstü viewport kontrolü gerçek Android/PWA testi yerine geçmez.

## Bilinçli olarak ertelenenler

Sırf referansta olduğu için 28 günlük mevsim, dört metal adlı kalite seviyesi, çok sayıda evlilik adayı, onlarca festival, yüzlerce tarif veya farklı isimle aynı özel bölge eklenmeyecek. Bunlar mevcut ritim ve kayıt sistemini büyütür, eğlenceyi otomatik artırmaz. Önceki plandaki sayısal içerik kotaları bu incelemeyle zorunlu hedef olmaktan çıkarılmıştır. Ürün kalitesi ancak satış/işleme/hediye arasında gerçek bir tercih yarattığında ele alınacak.

## Referans sistemi incelemesi

Mevsim ve tekrar hasat gibi genel tarım kavramları için [Ekinler](https://tr.stardewvalleywiki.com/Ekinler); bakımın ürüne bağlanması için [Hayvanlar](https://tr.stardewvalleywiki.com/Hayvanlar); girdiyi işlemenin rolü için [Zanaat Ürünleri](https://tr.stardewvalleywiki.com/Zanaat_%C3%9Cr%C3%BCnleri) incelendi. Buradaki tarifler Roamcroft'un kendi malzemeleri ve süreleriyle tanımlandı.

Koşula bağlı av ve kayıt sistemleri için [Balıklar](https://tr.stardewvalleywiki.com/Bal%C4%B1klar); risk/ilerleme yapısı için [Madenler](https://tr.stardewvalleywiki.com/Madenler) ve [Yetenekler](https://tr.stardewvalleywiki.com/Yetenekler); tekrar ziyaret nedenleri için [Arkadaşlık](https://tr.stardewvalleywiki.com/Arkada%C5%9Fl%C4%B1k), [Görevler](https://tr.stardewvalleywiki.com/G%C3%B6revler) ve [Festivaller](https://tr.stardewvalleywiki.com/Festivaller) kategori olarak incelendi. Yukarıdaki öncelik ve tasarımlar bu kaynakların talimatı değil, mevcut Roamcroft koduna ilişkin değerlendirmedir.
