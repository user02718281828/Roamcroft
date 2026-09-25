# 1.9.0 doğrulama — 25 Eylül 2026

## Teslim edilen online akış

Başlangıç ekranı → **Arkadaşlarla oyna · Beta** → **Online**. Ev sahibi lobi açar ve ortak çiftliğe girer. Konuk aynı menüde davet koduyla katılır, ardından ortak çiftliğe girer. En fazla dört eşzamanlı oyuncu vardır. IP veya port ayarı gerekmez.

`/api/shared` sunucu oturumu ve lobi üyeliğinden host kimliğini türetir. İlk açılış host'un kişisel sunucu çiftliğini kopyalar. Sonraki ortak kayıtlar D1 `shared_farms` tablosunda host'a bağlı ayrı tutulur. Host lobiyi kapatınca oyuncuların kişisel çiftlikleri geri yüklenir. Ortak çiftlik silinmez; yeni lobi açıldığında geri gelir.

- Kişisel: karakter kimliği/konumu, can, enerji, açlık, çanta, bekleyen teslimat, balıkçılık ve eylem bekleme süresi.
- Ortak: dünya, zaman, hava, ekinler, yapılar, hayvanlar, sandık, altın, görevler, yetenekler ve ilerleme.
- Üretim: iş ve makineyi başlatanın opak oyuncu kimliği kaydedilir. Tamamlanan ürün ve otomatik tekrar girdileri aynı oyuncunun çantasına yönlendirilir. Oyuncu lobiden ayrılsa da ürün kaybolmaz.
- Konuklar boş çantayla başlar; yeniden girerek başlangıç malzemesi çoğaltamaz. Kalıcı çantaları lobi kodu değişince de korunur. Sandıklarla eşya aktarılır. Her çiftlik en fazla 32 farklı kalıcı oyuncu profili tutar; bunun dördü aynı anda oynayabilir.
- Host 15 saniye ortak dünyaya ulaşamazsa konuk komutları 423 ile bekletilir; bu süre bağlantı kesintisi toleransıdır. Lobi 5 dakika host kalp atışı almazsa kapanır. Menü yalnızca ilgili oyuncunun hareketini durdurur. Herkes durakladığında dünya zamanı da durur.

## Doğrulama

- TypeScript ve **151 test** başarılı. Yeni testler gerçek API işleyicilerini SQLite D1 taklidiyle ve iki gerçek `ServerWorldClient` örneğiyle çalıştırır.
- Dört oyuncu sınırı, yanlış kaynak/çerez/komut/nonce reddi, eşzamanlı hasat ve inşa, ortak sandıktaki son ürün için yarış, çantaların ayrılığı, kalıcı konuk kaydı, host kesintisi ve yeni davet koduyla yeniden açma doğrulandı.
- Sunucu işlemi kaydettikten sonra HTTP yanıtı düşürülür; istemci aynı istekle tekrar bağlandığında satış ikinci kez uygulanmaz. Dünya saati oyuncu sayısıyla hızlanmaz. Hızlı/uzak konum isteği sunucu hareket sınırını aşamaz.
- Konuğun üretim kuyruğu ve makine ürünü, konuk ayrıldıktan sonra doğru çantaya teslim edilir. Makinenin tekrarı konuk malzemesini kullanır. Host balıkçılık sayacı her yanıtta eski değere dönmez.
- Yerel gerçek Worker + D1 HTTP testi dört bağımsız çerezli oturumla oluşturma, katılma, host'tan önce girişin bekletilmesi, ortak işlem, özel çanta, aynı isteği tekrar gönderme ve host kapatmasını doğruladı. Dört eşzamanlı ekonomik işlem 300 ms ek RTT ile gönderildi; bir yanıt kasıtlı kaybedildi, dört istek de tekrarlandı ve eşyalar yalnızca birer kez alındı. CI'nin Node **22.13.0** sürümünde yeni/boş D1 diziniyle de geçti.
- Tarayıcıda `127.0.0.1` ve `localhost` üzerinden ayrı çerezli iki oyuncu aynı haritada görüldü. Konuk buğday topladı: kendi çantasına 3 buğday + 1 tohum geldi; host'un çantası değişmedi ve aynı ekin host ekranından kalktı. Sayfa yenilenip online oyuna dönünce konuk çantası korundu. Host lobi kapatma akışı çalıştı.
- Tarayıcı testinde yakalanan native `fetch` bağlama hatası düzeltildi ve regresyon testi eklendi. Yeni kaynak ve test dosyalarında hedefli lint, `git diff --check` başarılı. Repo genelinin eski lint sorunlarının çözüldüğü iddia edilmiyor.
- Üretim derlemesi başarılı: statik dosyalar **2.67 MB**, tahmini sıkıştırılmış aktarım **1.48 MB**. Bu rakamlar Lighthouse skoru veya mobil yükleme süresi değildir.
- Online menü 844 × 390 ve 390 × 844 tarayıcı boyutlarında incelendi; kaydırma ve kapatma kullanılabilir. Fiziksel Android/PWA, yüksek gecikmeli mobil ağ ve uzun süreli çok oyunculu yük testi yapılmadı.

## Mimari ve güvenlik sınırı

Sunucu 500 ms aralıklarla komut/güncelleme alır; istemci konum tahmini ve diğer karakterlerin görsel interpolasyonunu yapar. D1 revizyonuna bağlı atomik yazma, nonce/sıra ve istek özetiyle tekrar koruması, oturum başına kota, sınırlı istek gövdesi ve aynı kaynak şartı vardır. İç kimlik hash'leri ve diğer oyuncuların çantaları yanıtlanmaz. Son 24 fark güncellemesi sınırlı boyutta tutulur; geçmiş kaçırıldığında tam durum gönderilir. Eski `/api/coop` açılmadı.

Bu, **ortak yüzey çiftliği betasıdır**. Konuklar host'un yaklaşık 20 karelik çevresinde hareket eder; ortak dünya penceresini host taşır. Bağımsız bölgeler, online maden/kat geçişleri, grup uyku oylaması, kişisel kulübeler, hesap kurtarma, host devri ve indirilebilir tam parti kaydından geri yükleme henüz uygulanmadı. Sunucu ana kaydı Cloudflare'dadır; host bilgisayarında çalışan P2P sunucusu değildir. Steam/GOG, doğrudan UDP ve LAN keşfi yoktur.

Kimlik mevcut güvenli oturum çerezine bağlıdır; tarayıcı verisini silmek erişimi kaybettirir. Kişisel sunucu oturumları 30 gün geçerlidir; yeni oturum açılışı süreyi uzatır. Mevcut sunucu kapasite sınırı 200 ortak çiftliktir. Bu model sınırsız ölçekli veya her ağda kusursuz co-op olarak sunulmamalıdır. Mutlak güvenlik, sıfır gecikme veya her cihazda 30 FPS garantisi verilmez.
