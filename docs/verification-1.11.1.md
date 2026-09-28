# 1.11.1 — Berrak Vadi

28 Eylül 2026. Temel: 1.11.0 / be14e15.

## Neden ve düzeltme

- Kare bütçesi menüdeki 100 ms zamanlayıcı aralıklarını yük sayabiliyordu.
  Ardışık düşük kalite kademeleri tuvali başlangıcın %45'ine indiriyordu.
  Artık otomatik kalite yalnız gölge/çevre efektlerini azaltıyor. Piksel oranı
  kullanıcının seçtiği kaliteyle sabit; yükleme, duraklatma, arka plan ve
  yeniden devam edilen ilk kare bütçe örneğine katılmıyor.
- Bina seçimi boş el koşuluna bağlıydı. İnşa yerleştirme modu dışında bütün
  araçlarla yapı yönetimi açılır; eldeki araç değiştirilmez. Hazır meyve ağacı
  boş elle hasat edilir, başka araçla yönetim ekranı açılır.
- Save biçimi, ekonomi, sunucu komutları ve hareket protokolü değişmedi.

## Doğrulama

- TypeScript, üretim build ve 173/173 test geçti. Menü/zamanlayıcı aralıkları,
  gerçek yük sonrası ayrıntıların geri gelmesi ve geçersiz ölçümler test edildi.
- Yerel üretim tarayıcısında balta ve kazma seçiliyken evin çatısına tıklama
  yapı yönetimini açtı. Araç seçimi korundu.
- 1280×720 görünümde tuval 1600×900 başladı ve beş ana menü aç/kapat sonrası
  1600×900 kaldı. 844×390 yatay mobil görünümde beş döngü öncesi/sonrası
  1055×487 korundu. Tarayıcı hata günlüğü boştu.
- Gerçek yerel Worker/D1/DO dört istemci test matrisi geçti: 50/100/200/300 ms,
  mesaj kaybı/jitter/reorder/duplicate, reconnect, host crash, Worker restart,
  cloud save çakışması ve ortak uyku. +300 ms gerçek istemci ölçümünde RTT
  310.48–310.99 ms; ilk ACK 404.73 ms, hareket tepkisi 62.79 ms.
- Statik toplam 2.69 MB; tahmini sıkıştırılmış aktarım 1.49 MB.

## Sınırlar

Mobil kontrol masaüstü viewport emülasyonu; fiziksel Android GPU/FPS testi değil.
Netliğin sabit tutulması eski %45 çözünürlük tabanından daha fazla GPU işi
gerektirebilir. Her cihaz için FPS garantisi verilmez. Co-op gecikme ve kayıp
testleri yerel mesaj simülasyonu, dört WAN cihazı testi değildir.
