# 1.11.0 — Aynı Sabah

28 Eylül 2026. Temel: 1.10.1 / 94ebed5.

## Değişiklikler

- Başlangıca dönüş sekmeyi kapatmaya çalışmaz. Yerel kayıt veya sunucu
  ACK'i beklendikten sonra Game kaldırılır; tuval, ses, hareket ve ağ bağlantısı
  temizlenir. Çıkış sırasında yinelenen dokunuş/klavye komutları engellenir.
  Kayıt hatasında kullanıcı oyunda kalır. Ortak ev sahibinin bilinçli çıkışı
  lobiyi kapatır; misafirin çıkışı sadece kendi üyeliğini kaldırır.
- Ortak uyku evin üç kare çevresinde ve akşam/gece mümkündür. Bağlı üyelerin
  tamamının oyu gerekir. Sunucu oyuncuları, zamanı, düşman/akın durumunu
  doğrular. Bağlantı kopması, yeni WS oturumu, üyelik değişimi, evden uzaklaşma,
  gün değişimi, 90 saniye süre aşımı ve Worker yeniden kurulumu oyları siler.
  Bir kişinin ayrılması kendiliğinden günü atlatmaz; kalanlar yeniden onaylar.
- Son oy mevcut uyku simülasyonunu bir kez çalıştırır. Üretim doğru oyuncunun
  çantasına gider; oyuncu sağlığı/enerjisi ve ortak sabah birlikte yenilenir.
  Onaylar günlük kaydın ödülü değildir ve yeniden bağlantıda korunmaz.
- Mevcut köy dönüm noktalarına bağlı altı özgün kısa hikâye bölümü, geçmiş
  bölümler ve üç NPC için aşamaya özgü diyaloglar. Yeni ödül/grind veya kayıt
  şeması eklenmedi; eski kayıtlarda mevcut ilerleme okunur.

## Test sonuçları

- `npm test`: 172/172 geçti. `npm run typecheck`, üretim build ve bütçe geçti.
- CI'nin Node 22.13.0 sürümünde sekiz ilgili test ayrıca geçti.
- Ortak uyku çekirdek testleri: dört oyuncu, gece üretiminin misafire teslimi,
  tüm oyuncuların iyileşmesi, duplicate/ACK kaybı, save/load, uzaklaşma,
  gündüz/akın engeli, iptal, süre aşımı, reconnect ve oda yeniden kurulumu.
- Gerçek yerel Worker/D1/DO ve dört kimlik doğrulanmış WebSocket ile gece
  senaryosu geçti. Soket kopması oylamayı iptal etti; yeniden bağlanan oyuncu
  eski oyları canlandırmadı; son istek tekrarında yalnızca bir sabah oluştu.
  Son oy HTTP yanıtı 53.76 ms (ayrı ön koşu: 54.45 ms). Gece başlangıcı
  yalnız izole test D1 verisinde hazırlandı; üretimde zaman/konum değiştiren
  debug endpoint yoktur.
- Mevcut 50/100/200/300 ms, uygulama mesaj kaybı/jitter/reorder/duplicate,
  host crash, WS reconnect, Worker restart ve harici cloud save çakışması
  matrisi başarılı. +300 ms gerçek istemci koşusunda RTT 310.27–310.78 ms,
  hareket tepkisi 62.64 ms, ilk ACK 450.88 ms, buffer 256.82–258.70 ms.
- Tarayıcıda 844×390 yatay görünümde çıkış düğmesi 44 px yüksekliğinde,
  ekran içindeydi. İki çıkış/giriş döngüsü tamamlandı; başlangıçta canvas
  sayısı sıfır, yeniden girişte 2. gün, sandık ve 2 kereste korundu.
  Hikâyenin ilk bölümü mobil günlükte doğrulandı.
- Tarayıcıda sunucu dünyasından lobi açılıp ortak çiftliğe girildi. Ev sahibi
  olarak kayıtlı çıkış başlangıç ekranına döndü; canvas sayısı sıfır ve
  tarayıcı hata günlüğü boştu.
- Statik toplam 2.69 MB; bütçe aracının tahmini sıkıştırılmış aktarımı 1.49 MB.

## Açık işler ve sınırlar

- Ortak maden, uzak bölgelerde bağımsız co-op keşif, çok günlük ekonomi
  dengesi ve gerçek Android/PWA performansı tamamlanmadı.
- Ortak uyku testleri yerel ağda; dört fiziksel WAN cihazı testi değil.
  Gecikme/loss matrisi mesaj seviyesinde simülasyon, gerçek TCP/IP kaybı değil.
- Mobil ölçüler masaüstü tarayıcı emülasyonu. Sistem geri tuşu, Android
  uygulama yaşam döngüsü ve düşük donanımda uzun oturum testi açık.
- Kayıt onayı alınamıyorsa başlangıca dönüş durur; kaydedilmiş gibi gösterilmez.
- Uyku mevcut yüklü ortak bölgeyi ilerletir; bağımsız bölge simülasyonu değildir.
