# 1.10.0 — hareket altyapısı doğrulaması

## Aşama kapıları

1. **WebSocket + oda otoritesi:** ortak çiftlikte 20 Hz sabit simülasyon, 10 Hz snapshot. Dört gerçek WebSocket bağlantısında ACK ilerlemesi, en az 30 snapshot/4 saniye, dört ayrı kimlik ve sınırlı giriş kuyruğu gerekiyor.
2. **HTTP hareketini kapatma:** bağlı ve bağlantısı kesilmiş oyuncunun HTTP pose alanı konumunu değiştiremez. Ekonomik komutlar çalışmalı ve tekrar edilen istek bir kez uygulanmalı. Üretim ve uygulama `/api/shared` girişleri aynı Durable Object yönlendiricisini kullanır.
3. **Ölçüm:** localhost üretim Worker'ı üzerinde 50/100/200/300 ms ek RTT; ayrıca yaklaşık %5,9 uygulama mesajı düşürme, ±45 ms jitter, 180 ms ek sıra değiştirme ve duplicate. Gerçek ping/pong süreleri ölçülür; Windows zamanlayıcısı ve işlem yükü eklenen gecikmenin üzerine çıkar. Bunlar internet/Cloudflare uç nokta ölçümü değildir. WebSocket TCP kullandığından snapshot sıra boşlukları IP paket kaybı oranı değildir.
4. **Prediction + reconciliation:** aynı çarpışma integratörü istemci ve otoritede çalışır. Epoch/sequence/tick, input ACK, eski paket reddi, sınırlı yeniden gönderim ve ACK sonrası bekleyen girdilerin yeniden oynatılması vardır. Otorite bir tick'te bir adımdan fazla yürütmez. Yığılan eski yönler hızlandırılmadan elenir.
5. **Tampon:** ilk 12 snapshot boyunca 650 ms korunur. Sonrasında RTT, jitter ve snapshot boşluklarından 120–650 ms hedef hesaplanır; düşüş en fazla 100 ms/s, artış 800 ms/s. Uzak karakter çizimi ayrıca 8 kare/s ile sınırlıdır. Bu değerler tüm ağlarda kanıtlanmış mutlak minimum değildir.

## Ölçülen sonuçlar

Son yayın adayında Node 22.13.0 ile **162/162 test**, TypeScript, hedefli lint, üretim build/boyut kontrolü ve dört bağlantılı üretim runtime testi geçti. Son prediction tekrarında 300 ms ek RTT altında çizilen tepki **62,02 ms**, ilk ACK **447,54 ms**, RTT **310,70–311,54 ms**, tampon **260,92–261,87 ms** ölçüldü. Önceki ölçümler aşağıda karşılaştırma için korunuyor.

Yerel gerçek WS koşusu (Node 24, dört bağlantı): RTT p50 1,40 ms, p95 2,16 ms; jitter p95 0,62 ms; snapshot 10,05 Hz; snapshot boyutu p95 834 bayt.

| Eklenen RTT | Ölçülen temiz RTT p50 | Bozuk bağlantı RTT p95 |
| --- | ---: | ---: |
| 50 ms | 62,55 ms | 266,16 ms |
| 100 ms | 124,20 ms | 311,53 ms |
| 200 ms | 218,13 ms | 404,49 ms |
| 300 ms | 312,03 ms | 392,34 ms |

Farklı tekrarda 300 ms + bozuk bağlantı RTT p95 526,85 ms oldu; koşular arası değişkenlik saklanmıyor. Bu tabloda istemci gönderim/alımına uygulanan kontrollü hata modeli vardır, işletim sistemi seviyesinde TCP paket kaybı yoktur.

Gerçek `RealtimeClient` sınıfı + üretim Worker'ı + dört bağlantı + her yönde 150 ms gecikme: ilk çizilen hareket **77,50 ms**, ilk otoriter ACK **480,96 ms**. RTT EWMA **310,57–311,08 ms**, jitter **0,76–1,14 ms**; tampon **256,98–257,63 ms**. Bu kısa yürüyüş/durma probunda en büyük reconciliation **0 kare**. Bu çizim konumu ölçümüdür; dört GPU/tarayıcının ekran sunum süresi ölçülmedi.

20 saniyelik deterministik, düz arazili dört istemci matrisinde bozuk ağda en büyük düzeltme **0,525–0,700 kare**; p95 0. Render adımı 10 ms örneklerde en fazla 0,08 kare. Son tampon temiz bağlantıda 125/150/200/250 ms, bozuk bağlantıda 238/263/313/363 ms. Bu sentetik model yoğun çiftlik veya tüm ağ koşulları için garanti değildir.

Tarayıcıda yerel ortak dünya açıldı; RTT 3–4 ms, tampon 120 ms görüldü. Tıklama rotası (15,19) → (25,19) → (15,19); arazi penceresi x=-12 → 0 → -12. Aynı WebMCP/motor oturumu korundu; konsol hatası görülmedi. Yeniden yükleme sayacının korunması ayrıca regresyon testiyle kontrol edilir.

## Kayıt ve kurtarma

- Son Node 22.13.0 gerçek runtime koşusunda harici D1 revision çakışması enjekte edildi: 503 alındı, harici revision ve payload değişmedi. Aynı koşudaki prediction probu: 62,30 ms görsel tepki, 497,87 ms ilk ACK, 258,47–259,04 ms tampon. Taşıma ölçümünün ilk 50 ms diliminde eşzamanlı test yükü vardı (RTT p95 644,06 ms); bu dilim boşta çalışan ağın taban gecikmesi diye kullanılmaz.
- HTTP ortak protokolü 2 oldu. Eski sürüm 1 istemcisi hareketi sessizce kaybetmek yerine 426 ve yenileme mesajı alır. WS hareket protokolü ayrı olarak sürümlenir.

- Ortak hareket tick'leri ve snapshot'ları D1 kullanmaz. D1 kimlik/lobi/kota metaverisi ve 5 saniyelik kayıt checkpoint'i için kullanılır; kişisel sunucu dünyasının eski HTTP yolu bu sürümün kapsamı dışındadır.
- Otorite Durable Object'tır; host, çiftliğin sahibi ve yaşam döngüsü yetkilisidir. İstemci konum, hız, tick süresi veya para sonucunu dayatamaz.
- DO SQLite atomik checkpoint'i ekonomik HTTP ACK'inden önce yazılır. Hareket için 1 saniyelik checkpoint vardır. Ani runtime kaybında son hareket saniyesi geri alınabilir; onaylanmış ekonomik işlemin kaybı kabul edilmez.
- D1 revision CAS ve kayıt hash'i, yazılmış fakat yerel onayı kaybolmuş checkpoint'i tanır. Harici çakışmada oda 503 ile durur; iki kaydın otomatik birleştirilmesi yapılmaz.
- Gerçek host soketi aniden kesildi: 15 saniye toleranstan sonra dünya dondu, misafir işlemi 423 aldı, host aynı kimlikle döndü.
- Worker runtime yeniden başlatıldı: dört kimlik, çanta ve WS yeniden bağlantısı korundu. Sadece DO'yu `evictDurableObject` ile boşaltan ek harness denemesi zaman aşımına uğradı; bu ayrı test başarılı sayılmıyor. Runtime yeniden başlatma ve host çökmesi testleri onunla aynı şey olarak sunulmuyor.
- Eski HTTP dayanıklılık testindeki bir zamanlama yarışı giderildi: başka oyuncunun retry'ı sürerken yeni arka plan paketini kaybeden oyuncuya yeni işlem göndermeden önce kendi bağlantısının toparlanması beklenir. 24 işlemin tam bir kez kaydı, kayıp yanıt ve host çökmesi iddiaları korunur.

## Oyuncu akışı ve ekonomi incelemesi

Canlı 1.9.1 başlangıcında ilk hedef fidan satın almaktı; toplama/ekim öğretimi arka sıradaydı. HUD ve köy panosu ayrıca farklı hedef seçimleri yapıyordu. Mevcut görevler toplama → çapa → ekim → hasat şeklinde sıralandı; iki ekran tek öneri fonksiyonuna bağlandı. Hazır ödüller önce gelir. Fidan/mevye görevleri kaldırılmadı, eski kayıt kimlikleri ve ödül değerleri değişmedi. Save/load sonrasında ikinci kez ödül alınamaması test edildi.

Ekonomi denetimi: on parti üretimde ham satmaya göre tahıl işleme +280, elma reçeli +840, süt işleme +200 altın farkı. Bina maliyeti ve oyuncu emeği farklı olduğu için bunlar dengeli olduklarının kanıtı değildir; fiyatları kısa incelemeye dayanarak değiştirmedik. Mevcut 28 günlük sipariş/arbitraj regresyonları test paketinde korunur.

Canlı 844×390 yatay viewport: joystick ve eylem düğmeleri ekran içinde; çanta menüsü kendi kaydırma alanında açılıyor. Gerçek Android cihazı veya ana ekrana eklenmiş PWA testi yapılmadı. Referans yalnızca temel öğretim/görev ve ortak dünya prensipleri için incelendi: [görevler](https://stardewvalleywiki.com/Quests), [çok oyunculu](https://stardewvalleywiki.com/Multiplayer). İçerik, karakter, metin ve tasarım aktarılmadı.

## Tekrar çalıştırma komutları

`npm run typecheck`, `npm test`, `npm run build`, `node scripts/check-runtime.mjs`.

Zaman ölçümünü diğer CPU ağırlıklı testlerle aynı anda çalıştırmayın. CI Node 22.13.0 kullanır. Runtime testi dört bağımsız oturumu yalnızca localhost'ta oluşturur; üretim test verisi yazmaz.

## Bilinen sınırlar

Dört fiziksel cihaz / Android Chrome / gerçek WAN paket kaybı ve uzun süreli yük testi yapılmadı. Ortak yüzey keşfi hâlâ 20 kare mesafe sınırında; bağımsız uzak bölgeler, ortak maden ve toplu uyku açılmadı. Uzun kopuş, ölüm ve eve dönüş güvenli konumlandırma gerektirebilir. Sıfır teleport, sıfır gecikme veya her cihazda 30 FPS garantisi verilmez. Kayıt çakışması otomatik çözülmez; durdurulan oda için kayıtların incelenmesi gerekir.
