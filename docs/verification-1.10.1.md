# 1.10.1 — Depodan Tezgâha

28 Eylül 2026. Başlangıç noktası: canlı 1.10.0 / a95abfb.

## Oyuncu akışında saptanan sorun

Canlı oyunda üretim menüsü denendi. Depo stoku tariflerde görünmüyor,
eksik girdiyle kapalı düğme yalnızca “Üret” diyordu. Depodan elle alma
bütün stoğu çantaya doldurabiliyordu. Çiftçilik → depo → işleme → NPC
siparişi bağlantısını geliştirmek için bu mevcut akış düzeltildi.

- Tarif, makine ve günlük siparişlerde eksik miktar, ortak depo ve kişisel
  teslimat sandığı stoğu; mevcut oyun verilerinden malzeme kaynağı.
- İhtiyaç kadar hazırlama: tek sunucu komutu, bütün girdiler ve kapasite
  kontrol edildikten sonra atomik aktarım. Üretim/teslimat ayrı oyuncu kararı.
- Makinede değişen tarif ve günü geçen sipariş reddedilir. Kuyruktaki
  ekipman yükseltmeleri gerçek maliyete katılır. İstemci miktar belirleyemez.
- Kayıt şeması, fiyatlar ve hareket algoritması değişmedi. Yeni görsel varlık yok.

## Doğrulama

- `npm test`: 167/167 başarılı. Beş yeni test: stok korunumu, save/load,
  kapasite ve çoklu girdi atomikliği, geçersiz hedefler, dört oyuncunun ortak
  stoğa erişimi, tekrar istek ve oda yeniden kurulumu.
- `npm run typecheck`, `npm run build`: başarılı. Statik dosyalar 2.68 MB;
  bütçe aracının tahmini sıkıştırılmış aktarımı 1.49 MB (gerçek mobil indirme ölçümü değil).
- `npm run check:runtime`: gerçek yerel Worker/D1/DO/WS üzerinde başarılı.
  Yeni hazırlama komutu dört eşzamanlı istemci ve +300 ms yapay RTT ile
  yürütüldü; aynı istekler tekrarlandı, toplam stok korunumu doğrulandı.
- Mevcut 4 istemcili 50/100/200/300 ms test matrisi, uygulama mesajı kaybı,
  jitter, sıra değişimi, duplicate, reconnect, host bağlantısının ani kesilmesi,
  Worker yeniden başlatma, harici D1 kayıt çakışması kontrolleri geçti.
- Tarayıcıda normal oyun eylemleriyle sandık kuruldu; 13 odun depoya kondu,
  tariften yalnızca 3 odun çekildi, dünyaya dönünce 2 kereste tamamlandı.
  Konsol hata kaydı boştu. 844×390 yatay görünümde menü sınırları
  x=6–838 / y=6–384, içerik genişliği 830 px; yatay taşma yoktu.
  Bu responsive kontrol gerçek telefon performans testi değildir.

Son yerel koşunun ölçümleri:

| Koşul | RTT p50 | RTT p95 |
| --- | ---: | ---: |
| Ek gecikme yok | 1.92 ms | 2.13 ms |
| +50 ms, temiz | 63.57 ms | 63.93 ms |
| +100 ms, temiz | 125.52 ms | 127.04 ms |
| +200 ms, temiz | 219.30 ms | 220.00 ms |
| +300 ms, temiz | 313.02 ms | 316.20 ms |
| +300 ms, mesaj hataları | 356.94 ms | 529.48 ms |

Gerçek RealtimeClient ile +300 ms testinde yerel hareket tepkisi 77.68 ms,
ilk ACK 436.75 ms; RTT 311.03–311.33 ms, jitter 1.29–2.15 ms,
adaptif buffer 258.11–259.95 ms. Kısa yürüyüşte en büyük düzeltme 0 kare.
Bu sonuçlar WAN veya bütün haritalar için sıfır rubberband garantisi değildir.

## Bilinen sınırlar ve sonraki öncelikler

- Gerçek Android Chrome/PWA ve dört fiziksel cihazda WAN testi yapılmadı.
  Paket hataları uygulama mesajları seviyesinde; gerçek TCP/IP kaybı değildir.
- Paylaşılan dünyada 20 kare ortak hareket alanı, ortak maden/uyku sınırları
  devam ediyor. Ayrı bölgelerde bağımsız keşif daha büyük mimari çalışma gerektiriyor.
- Uzun vadeli ekonomi ve mevsimler arası ilerleme için çok günlük oynanış
  testi gerekli; kısa testlerden bütün ekonominin dengeli olduğu sonucu çıkarılmadı.
- Depodan hazırlama bütün eksiklerin hazır olmasını gerektirir; kısmi veya
  otomatik tüketim yapmaz. Mevcut tek ürün depo düğmeleri korunur.
