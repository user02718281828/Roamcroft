# Online altyapı denetimi — 25 Eylül 2026

Bu rapor 1.9.0 ortak yüzey çiftliği betasını kapsar. Testlerden geçen davranışlar ile henüz ölçülmeyen durumlar ayrılmıştır.

| Konu | Uygulama ve doğrulama |
| --- | --- |
| Davet güvenliği | Kriptografik rastgele 96 bit kod; tam biçim kontrolü; yetkili oturum ve aynı kaynak zorunlu; oda/kimlik istemciden alınmaz. Yanlış kod, sahte alan ve yabancı kaynak reddi testli. |
| Authority | Dünya ve mali işlemler Cloudflare Worker'da hesaplanır. Host dünya sahibi ve oda yöneticisidir. Konum isteği hız/çarpışma sınırından geçer. Tarayıcıdan para/envanter atama komutu yoktur. |
| Atomik/cloud save | Ortak dünya + tüm oyuncu çantaları + nonce/sıra tek D1 satırı ve revizyon karşılaştırmalı işlemde yazılır. Eşzamanlı çakışma yeniden okunarak çözülür. Üretim Worker/D1 üzerinde dört eşzamanlı satın alma doğrulandı. |
| Veritabanı hatası | SQLite D1 taklidinde ilk UPDATE sonrası hata enjekte edildi: transaction tamamen geri alındı, aynı isteğin tekrarında yalnızca tek değişiklik gerçekleşti. Gerçek Cloudflare bölge arızası enjekte edilmedi. |
| Duplicate/idempotency | Aynı nonce/sıra/istek özeti tekrarında mevcut onay döner. İki eşzamanlı aynı istek yalnızca bir revizyon artırır. Hasat, yapı, sandık ve ekonomik işlemlerde çoğaltma testli. |
| İşlem sırasında disconnect | Sunucuda commit sonrası yanıt düşürülüp istemci yeniden yaratıldı: çanta ve altın korunur, işlem ikinci kez uygulanmaz. Sunucuya ulaşmadan düşen istek aynı gövdeyle tekrar denenir. |
| Host crash | `leave` çağrısı yapılmadan host istemcisi durduruldu. 15 saniyelik toleranstan sonra konuk yazmaları engellendi. İsteyen konuk hemen ayrılabilir; 5 dakikada kişisel dünyaya dönüş olur. Süreler test saatinde ilerletildi. |
| Alt+F4/crash save | Kapatma olayıyla kaydetmeye bağımlı değildir: her başarılı komut cevabından önce kayıt yazılmıştır. Onaysız ama commit edilmiş son işlem de reconnect'te bulundu. Gerçek işletim sistemi Alt+F4, güç kesintisi veya mobil uygulamanın OS tarafından öldürülmesi denenmedi. |
| Reconnect/kimlik | Oturum çereziyle aynı opak oyuncu kimliği ve çanta döner; yeni oda kodu karakteri silmez. Dört slot sınırı sunucuda uygulanır; ayrılmış oyuncunun eski konumu inşayı engellemez. Çerezin silinmesine karşı hesap kurtarma yoktur. |
| Gün/gece | Saat sunucu duvar zamanından bir kez ilerler; her oyuncu için ayrı artırılmaz. Dört eşzamanlı pulse gece yarısını bir kez geçirdi. Kaçırılan delta geçmişinden tam snapshot dönüşü testli. |
| Sürüm uyumsuzluğu | `X-Roamcroft-Protocol` kontrolü ve yanıtta protokol sürümü. Eski/eksik/gelecek sürüm 426 ile reddedilir; istemci yazmayı ve otomatik tekrarını durdurur, yenileme ister. |
| Latency/paket kaybı | Dört gerçek istemci sınıfı + API işleyicileri ile 300 ms ek RTT, her beşinci pulse'ta deterministik istek/yanıt kaybı. 24 ekonomik eylem tam bir kez işlendi. Ayrı gerçek yerel Worker/D1 HTTP kontrolünde dört eşzamanlı oyuncu +300 ms RTT ve kayıp yanıtın tekrar gönderimi geçti. |
| Rate limit | Oyuncu başına 180 shared isteği/dakika; lobi kotası ayrı. 429 yanıtı Retry-After içerir, istemci bekleme süresince yeni istek/komut üretmez. Kota aşımında dünya değişmez. |
| Oda yaşam döngüsü | Host'un önce girmesi, konuk katılması, kapasite, konuk çıkışı, host kapatması, süre aşımı ve yeni davetle aynı çiftliğin açılması testli. |
| Hata logları | API 5xx için olay türü, route, HTTP durumu ve UUID korelasyon kimliği. Cookie, davet kodu, oyuncu adı, gövde, exception metni ve stack loglanmaz. Redaksiyon testli. Cloudflare Logs yapılandırıldı; dashboard'da gerçek üretim arızası kaydı henüz gözlenmedi. |

## Testlerin kapsamı

- `tests/shared-resilience.test.ts`: dört istemci, 300 ms RTT, her beşinci denemede kayıp, ekonomik tutarlılık, konuk reconnect, host crash ve kalıcı kimlikler.
- `tests/shared-world.test.ts`: eşzamanlı çakışma, rollback, idempotency, gece yarısı, delta fallback, üretim sahipliği, kimlik/slot, protokol, kota ve log redaksiyonu.
- `tests/shared-client.test.ts`: native tarayıcı fetch bağlamı, tekrar deneme, kişisel dünyaya dönüş, sürüm durdurması ve rate-limit bekleme.
- `scripts/check-http.mjs --session-smoke`: yalnızca localhost'ta gerçek Worker/D1; dört çerezli oyuncu, paralel yazma ve +300 ms ek RTT. CI'de otomatik çalışır. Varsayılan HTTP modu canlıda kayıt oluşturmaz.
- İki ayrı tarayıcı oturumuyla ortak harita, hasat, özel çanta, yenilemeyle geri dönüş ve mobil menü ayrıca incelendi.

Paket kaybı, uygulama isteği/yanıtı seviyesinde kontrollü kesintidir; gerçek mobil operatör bağlantısı veya UDP paketi testi değildir. Kayıp oranı her beşinci denemeye uygulanır; koşu sonunda deneme sayısı beşin katı değilse gözlenen oran tam %20 olmaz. Test çıktısı gerçek deneme ve kayıp sayılarını yazar.

## Kalanlar ve bilinen sınırlar

- Dört fiziksel cihaz, Android PWA yaşam döngüsü, mobil arka plan kısıtlamaları, uzun süreli yük ve gerçek Cloudflare bölgesel kesinti testleri yapılmadı. Çok odalı kapasite/CPU/maliyet ölçümü yapılmadı.
- Onaylanmamış ve sunucuya hiç ulaşmamış komutlar tarayıcı aniden kapanırsa kaybolabilir. Kaydedildi bilgisi yalnızca sunucu onayına aittir. İstemci hareket tahmini son onaylı konumdan ileride olabilir.
- Bir karakteri aynı anda birden fazla sekmede yönetmek desteklenen akış değildir; nonce sırası çakışırsa tam eşitleme yapılır. Aynı isteğin çift gelmesi güvenlidir; ayrı sekmeler için lider kilidi henüz yoktur.
- Kayıt host'a bağlı **Cloudflare** kaydıdır; host'un diskindeki dosyayı sunan P2P değildir. Tam parti dosyasından geri yükleme, hesap kurtarma ve host devri yoktur. Çerez silinirse erişim kaybolur.
- 200 ortak çiftlik ve çiftlik başına 32 kalıcı profil / 4 eşzamanlı oyuncu sınırı vardır. Uzak profil temizleme/yönetim ekranı yoktur.
- Yalnızca ortak yüzey açıktır; konuklar host'un yakınında kalır. Online maden, bağımsız bölgeler, grup uyku oylaması ve kişisel kulübeler sonraki işlerdir. Tam oyunun online uyarlamasının bittiği iddia edilmez.
- Beklenmeyen 5xx hata kayıtları etkinleştirildi; alarm, dış log arşivi, otomatik kurtarma operasyonları ve dashboard üzerinden hata izleme doğrulaması henüz yoktur. Log ayarları için [Cloudflare Workers Logs belgesi](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) esas alındı.
