# CrazyGames akıcılık — 4 Kasım 2026

Durum: küçük yerel optimizasyon adayı; bildirilen genel donmanın kök nedeni
henüz doğrulanmadı. Push/main/deploy/Submit yapılmadı. Ürün sürümü değişmedi.
Taban codex/crazygames-readiness / 5fb7e0d, Data Module ce04b6b korunur.

## Gerçek QA ölçümü (değişiklik öncesi)

Kullanıcının bu oturumda verdiği GÜNCEL build üzerinde, misafir oturumunda
`profile=1` tanılaması ve klavye ile 30 saniye kayıt alındı. Özel Preview URL'si
buraya sabitlenmez. AMD Radeon/ANGLE D3D11, Balanced, DPR1, 892×458;
4305 kare: ortalama143,47 FPS, p95 7,10ms, p99 7,10ms, maksimum83,30ms,
%1 düşük103,12 FPS. Bu masaüstünde sürekli düşük FPS tekrarlanmadı.

CPU RAF p95 1,90ms; GPU p95 3,28ms; render submit p95 1,40ms;
sahne sync p95 1,80ms; simülasyon p95 0,10ms; React function p95 0,20ms.
70 draw call,247518 üçgen,43 geometri,6 texture,21 program,3600 tile.
İki saveWallTime örneği13,4/14,2ms: ASENKRON toplam süre, ana thread donması
olarak yorumlanamaz. En kötü83,3ms karenin nedeni bu kayıtla eşleştirilemedi.
Portal kabuğunda reklam/FedCM/hydration hataları gözlendi; bunların oyundaki
tek takılmanın nedeni olduğu kanıtlanmadı. Oturum misafir; hesap kabulü değildir.

## Küçük düzeltmeler / yerel CPU karşılaştırması

- serialize artık checksum için ürettiği payload baytlarını zarf içine tekrar
  kullanır; çift tam JSON taraması kalkar. Format/checksum/SAVE_VERSION aynıdır.
- Scene sync her250ms'de3600 koordinat anahtarını yeniden üretmek yerine
  görsel entry anahtarını kullanır. Pencere kayınca indeks yeniden kurulur.
- Profilde saveSerializeCpu / saveCompressionWallTime / sdkSetItemCpu ayrıldı;
  böylece yeni QA kaydı gerçek CPU ile asenkron beklemeyi ayırabilir.

Node22.13.0/npm10.9.2, seed84621,100 kayıt örneği:232484 byte aynı;
serileştirme medyan1,4299→1,0237ms; p95 1,9301→1,8484ms. Bu FPS değildir.
Aynı seed/1280×720 kamera ile sırayla3 eski+3 yeni CPU sync koşusu:
medyanların medyanı0,6027→0,5096ms. p95 aralıkları eski0,923–1,499ms,
yeni0,619–1,125ms; gürültülüdür, sabit p95 iyileşmesi garantisi yoktur.
129428 dünya üçgeni /2423 görünür instance her koşuda aynı kaldı.
Balanced/Detailed, DPR, gölge ve model yoğunluğu düşürülmedi.

Gerçek QA ile roamcroft.com aynı kayıt/viewport koşulunda karşılaştırılmadı.
Yerel dev sahnesinin3D açılışı görsel doğrulandı; bunu production veya FPS
karşılaştırması saymıyoruz. Yeni aday henüz QA'ya yüklenmedi: önce/sonra
portal FPS/p95 ve fiziksel cihaz kazanımı doğrulanmış DEĞİLDİR.

## Sonraki kabul

Yeni ZIP özel QA build olarak yüklenmeli; aynı cihaz/kayıt/kamera/kalite ve
viewport'ta30sn profil, ayrıca yürüyüş/toplama/inşa/menü ve en az2 otomatik
kayıt içeren daha uzun oturum yapılmalı. Düşük FPS bildirilen gerçek cihazda
Balanced/Detailed ayrı ölçülmeli. Donma tekrarında JSON profili alınmalı;
Data Module misafir/hesap yeniden açılışı ve hesap geçişi kabulü korunmalı.
D1/DO, CSP, SDK sahiplik/kota guard'ları ve online protokoller değiştirilmedi.

## Doğrulama / çıktı

249/249 test, typecheck, normal build (finalize/budget dahil) ve son portal
build başarılı. Ek hedefli testler Unicode/checksum/tek snapshot, değişen
pencere/negatif koordinatlar, chunk bütçesi, iki kalite modu, Data Module
kota/account/conflict ve IndexedDB snapshot rotasyonunu kapsar.
Three.js scene chunk >500kB uyarısı sürer; başarısız build değildir.

Yeni ZIP: `dist/Roamcroft-CrazyGames-Performance.zip`,14 dosya,
2356341 byte açık içerik /1192529 byte ZIP. SHA256:
850308B7E3013CE29DD3AFFF43CDB6F027E97E777F183F029F09CA989A01F07B.
Root index.html ve yalnız assets/art/textures doğrulandı. Gizli dosya yok.
Normal build dist temizliğinde önceki üretilmiş ZIP'ler kalktığından eski
HTML5/DataModule paketleri c1a6c80/5fb7e0d kaynaklarından ayrı work dizininde
tekrar derlenip eski adlarıyla geri üretildi. Bunlar bayt özeti aynı arşiv
iddiası değildir; kaynak checkpoint'leri değişmedi. Yeni paketi yükleyin.
