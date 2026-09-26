# 1.9.1 doğrulaması — 26 Eylül 2026

## Düzeltilenler

- `applySharedState` arazi penceresi kaymasını dünya değişimi sayıyordu; `worldRevision` Game bileşeninde motor, WebGL sahnesi ve sesin yeniden kurulmasına neden oluyordu. Aynı dünya içindeki pencere kayması artık mevcut sahnenin parça güncellemesine gider.
- Konum onayı, isteğin gönderildiği konumla karşılaştırılır. İstek yolculuğu sırasında geçerli yerel hareket kaybolmaz; sunucunun reddettiği hareket düzeltilebilir.
- Uzak oyuncuda 650 ms hareket geçmişi, eski/tekrar örnek reddi, en fazla 200 ms sınırlı tahmin ve kare başına hız sınırı var. Paket geldiğinde 6 kare üzerindeki farkı doğrudan konuma atayan kod kaldırıldı.
- 500 ms istek aralığına geçen istek süresi dahildir. Aynı anda yalnızca bir istek ve kota/hata beklemesi korunur. Gösterilen ms, son HTTP isteğinin gövde okuması dahil gidiş-dönüş süresidir.
- Ortak 20 karelik keşif sınırı klavye, tıklama ve sunucu hareketinde uygulanır. Bağlı oyuncuyu uzaklaştırıp sonra host'a geri ışınlayan olağan hareket önlenir. Host yokken 423 alan ilk bağlantı kişisel çiftliğe döner.

## Gerçekleştirilen kontroller

- TypeScript, hedefli lint, üretim derlemesi ve 155 test başarılı.
- Dört istemci + API/D1 testinde 300 ms ek RTT: 52 pulse, 5 istek kaybı ve 5 yanıt kaybı; 24 ekonomik işlem tam bir kez işlendi. Duplicate, reconnect, host crash ve atomik kayıt kontrolleri geçti.
- Node 22.13.0 ile temiz yerel Worker/D1: dört eşzamanlı oyuncu, +300 ms RTT, kayıp yanıt tekrarı, ayrı çantalar, ortak saat ve host çıkışı başarılı. İlk paralel Wrangler denemesinde Miniflare ProxyWorker bağlantı kaybı görüldü; tek sunuculu tekrar geçti.
- Yeni regresyon testleri: arazi penceresi kayarken yeniden yükleme sayacı değişmiyor; rota/öngörülen konum korunuyor; gecikmiş onay ile geçersiz hareket ayrılıyor; 300 ms gecikme/kayıp/eski örnek altında uzak konumun karelik adımı sınırlı; ortak sınırdan dönüş mümkün.
- Gerçek üretim derlemesini iki bağımsız tarayıcı kimliğiyle açtım. Host (15,19) → (25,19) → (15,19) yürüdü; pencere x=-12 → 0 → -12 değişti. Aynı motorun WebMCP aracı geçerli kaldı, konuk aynı dünyada kaldı. İki konsolda da hata yok.
- Yerel iki oyuncuda gözlenen istek yanıtları yaklaşık 55–70 ms; görüntülenen FPS örnekleri 64–144. Bunlar canlı sunucu gecikmesi veya tüm cihazlarda FPS garantisi değildir.

## Bilinen sınırlar

- Taşıma hâlâ HTTPS polling; WebSocket/Durable Object gerçek zamanlı varlık kanalı yok. 650 ms görsel tampon, akıcılık karşılığında uzak oyuncu görüntüsünü geciktirir.
- Ortak yüzey keşfi 20 kareyle sınırlı. Bağımsız uzak bölgeler, ortak maden ve toplu uyku bu güncellemede açılmadı.
- Ölüm, eve dönüş ve uzun kopuştan dönüşte güvenli konumlandırma devam eder. Uzun kopuşta oyuncu görünümünün kaldırılması/yeniden oluşturulması mümkündür.
- Dört fiziksel cihazla internet/Android Chrome testi ve küresel p95 gecikme ölçümü yapılmadı.
