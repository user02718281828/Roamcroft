# 1.14.0-alpha.1 — tek seferlik bütünleşik yayın

30 Ekim 2026 kullanıcı açık onayı: A–D+dört patch+9-slot hotbar normal main
birleşimi/push/Workers Builds; fiziksel Android kabulü bilinçli olarak yayın
sonrasına ertelendi. Sonraki Living Forest paketinin yayını yetkili değildir.

Taban03c37fa, hotbar1ce5367 cherry-pick899b9fe; belge conflict'leri güncel
kayıtlar korunarak çözüldü. Engine/save/server/coop/monitoring değişmedi.
E/F prototip kaynakları adayda yok; başka dallar ve bundle içinde korunur.
Sürüm1.14.0-alpha.1, tam1.14 ekipman/stack/drag-drop değildir.
Kayıt formatı/SAVE_VERSION1 ve legacy anahtarlar değişmedi. Hotbar bağları
roamcroft.hotbar.v1 UI tercihidir, miktar/sahiplik içermez.

Yerel son test/gerçek tarayıcı ve yayın sonrası sonuçlar bu belgeye eklenir.
Kalan audit20 (0 kritik/8 yüksek/11 orta/1 düşük), mevcut sınıflandırma
security-audit-2026-10-30.md; yeni dependency yükseltmesi yok.

Rollback referansı1.13.1/a182541045dfab06cef39a42e20954c085cecd23:
yalnız onaylı uygulama sürümü/source revert ile normal ileri commit;
D1/DO geri alma/sıfırlama, reset/force/DNS/origin göçü yok.

## Yayın öncesi son kabul

Node22.13.0/npm10.9.2; temiz ci584/585, typecheck, **227/227 test**
(0 hata/atlanan,16.63s), build ve dört oyunculu yerel runtime çıkış0.
227=222 A–D/güvenlik +5 hotbar testi; eski234 içinde7 izole E/F testi vardı.
Statik2,956,277 bayt/tahmini1,560,935;3MB bütçe değişmedi. Worker dry-run
2461.15KiB/gzip768.53KiB, yerel paketleme başarılı, doğrudan deploy yapılmadı.
HTTP/SEO/robots/sitemap/marka/nonce/CSP,4WS,50–300ms gecikme/kayıp/tekrar,
restart/reconnect,atomik stok,D1 çakışması ve ortak uyku geçti.

Gerçek Game localhost8950: Yeni oyun→Go back, eski180 altın/2 ekmek korundu;
çanta→ekmek→yuva9 atama/seçim2 bıraktı; E ile2→1. Kayıtlı çıkış/reload/Continue
sonrası180 altın/1 ekmek ve bağ korundu. Seçili9 ile1280×720→390×844 daralma:
x325–373,48×48 hedef, tamamen görünür. Mobil33 menü döngüsü (390×844,
844×390,320×568); X/alt Kapat/Back/Escape/gecikmiş Back +hızlı açma ve
kayıt payload eşitliği geçti. Depo fixture25/0→18/7→21/4, toplam25.
Bunlar fiziksel Android değildir. Görsel screenshots/alpha-hotbar-local-mobile.jpg.
Loglar Git dışı work/alpha-{ci,typecheck,test,build,runtime,dryrun}.log.

Birleşmiş oyun kodu önceki doğrulanmış hotbar+güvenlik checkpoint'i a09f7eb
ile aynıdır; yalnız sürüm/docs değişir, E/F kaynakları çıkarılmıştır. Son test
turundan sonra uygulama kodu değiştirilmedi. Canlı kabul yayın sonrası ayrı
checkpoint'te kaydedilecek; bu belgenin ön kabulü canlı başarı iddiası değildir.
