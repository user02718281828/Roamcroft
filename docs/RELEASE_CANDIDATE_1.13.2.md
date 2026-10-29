# Roamcroft 1.13.2 — tek yayın adayı kaydı

30 Ekim 2026. **YEREL ADAY / ÜRETİME YAYIMLANMADI. Fiziksel Android kabulü eksik.**

Önerilen kapsam **A–D + dört kontrollü güvenlik yaması**.
Kesin uygulama kodu `449d3dec89f6640c23298ff57fb39f13ef7a41ee`,
`codex/release-candidate-1-13-2-secure`. Bu dalın sonraki belge checkpoint'i
aynı uygulama kodunu taşır; yayın onayında son teslimdeki tam uç SHA kullanılmalı.
Orijinal A–D referansı `19f9ba3abc5c77da7e8b94130be6d4772e4f7cec` korunur.
Main/origin-main/canlı1.13.1: `a182541045dfab06cef39a42e20954c085cecd23`.

| Paket | Commit ve oyuncuya etkisi |
| --- | --- |
| A | `c1dec4f` — şeffaf navigasyon X'i örtmez;48px X,44px alt Kapat, Back/Escape |
| B | `ff938c7` — logo/favicon/OG görseller, resmî domain, canonical/JSON-LD/robots/sitemap, TR/EN rehber |
| C | `f87fadd` — karşılama ekranı/çanta, görünür depo, Yeni oyun onayı, hızlı yeniden açma güvenliği |
| D | `19f9ba3` —1/10/100/Tümü/özel depo miktarı, yön ve güncel teklif onayı |
| Güvenlik | `449d3de` —Tinypool2.1.2,proxy-addr2.0.8,source-map-js1.2.2,Sharp0.35.5 |

Commit sırası yukarıdaki gibidir; ilk4 art arda main tabanından gelir.
Güvenlik commit'i ayrı dalda doğrulanıp cherry-pick edildi, conflict yok.
**Hariç:** gerçek9-slot hotbar, E biyom/F footprint kaynakları, yeni ekonomi,
kayıt göçü, ekipman/stack, ortak maden. Bu adayda `lib/experiments` ve yeni
Hotbar bileşenleri yok. Prototipler ayrı dallarda/bundle'da korunur.

Hotbar kodu `1ce53670958df914a6e27138eb91c3c0834c5a04`, güvenlikle birlikte
`a09f7eb75a5dfeee5d6fa711d1c2deb3dcfe92c7`, ayrı kontrollü özellik paketidir.
Sonraki sürüm önerisi1.14.0-alpha kabulüdür; tam1.14/ekipman/stack tamamlandı
anlamına gelmez,1.13.2 numarasına sıkıştırılmaz.

## Doğrulama ve sınırlar

A–D geçmiş kabulü222 test, sonraki izole deneylerle229 testti. Hotbar+güvenlik
ayrı dalı taze ci/typecheck/234 test/build/4WS runtime geçti; bu234 sonucu
bu hotbar içermeyen adaya mal edilmez. Bu kesin adayın yeni tur sonucu aşağıya
kaydedilir. Node22.13.0/npm10.9.2; aynı kilit dosyasıyla temiz ci584/585 geçti.

Geçmiş tarayıcı kabulü320×568/390×844/844×390'da33 aç/kapat döngüsü;
hit-testing, X/alt Kapat/Back/Escape, gecikmiş Back/hızlı açma, depo keşfi,
seçimde serialize payload eşitliği; depo7 koy/3 al/iptal/çift tık/0 reddi.
Yeni güvenlik kilidiyle son menü/aktarım kontrolü ayrıca aşağıda verilir.

Engine/save/storage/world generation2/server/coop/Sentry/dağıtım yapılandırması
main tabanına göre değişmedi. Worker güvenliğine yalnız API noindex eklendi;
CSP nonce/script izinleri gevşemedi. PWA rehber navigasyonu `/` kaydını ezmez;
API/RSC cache dışı, manifest/SW no-cache. Fiziksel PWA güncelleme/çevrimdışı
yaşam döngüsü, Sentry panelinde gerçek olay alımı ve WAN kabulü eksiktir.

[30 Ekim güvenlik raporu](security-audit-2026-10-30.md): taze audit25→20,
**0 kritik/8 yüksek/11 orta/1 düşük**; bu sonuç canlı1.13.1'e uygulanmadı.
Kalan kritik/yüksek canlı istismar yolu bu sınırlı incelemede kanıtlanmadı;
araç zinciri açıkları ve framework inceleme sınırı açıkça raporlandı. Sıfır
risk iddiası yok. DB/şema/veri veya oturum sahipliği değişmedi.

## Yayın kapıları ve geri dönüş

- **Bu belge yayın onayı değildir.** Main merge/push/production deploy yapılmadı.
- Cloudflare CLI oturumu kapalı; non-main otomatik build/deploy ve preview veri
  bağları salt-okunur doğrulanamadı. Bu nedenle geliştirme dalı da push edilmedi.
  Cloudflare ayarı değiştirilmedi. Yerel commit için GitHub CI sonucu yok.
- Main `a182541` için GitHub verify ve Workers Builds success salt-okunur
  doğrulandı. Bu eski main başarısı yeni adayın uzaktaki CI başarısı değildir.
- 30 Ekim normal resolver ile roamcroft.com ve eski workers.dev HTTP200 ve
  1.13.1 döndü. WWW yönlendirme sonucu son kontrol notunda verilir. Origin'ler
  farklıdır; IndexedDB/__Host oturum otomatik taşınmaz. Eski adres açık kalır;
  301 veya doğrulanmamış oyuncu sahipliği göçü eklenmez.
- **Telefon kabulü eksik:** dikey/yatay X/alt Kapat/OS Back ve hızlı yeniden
  açma; kapanış sonrası joystick/balta/saldırı/pinch; sandığı bulma, miktar
  koy/al/iptal; kayıtlı çıkış/Continue/Yeni oyun iptali; PWA/klavye/safe-area.
- Öneri: önce bu1.13.2 A–D+güvenlik adayına açık kullanıcı onayı ve fiziksel
  kabul (veya kullanıcının açık erteleme kararı), sonra normal main birleşimi,
  güncel kontroller/CI, yetkili push, Workers Builds ve canlı sürüm/asset/online
  doğrulaması. Geçmeyen kontrolde yayın yok.
- Güvenli geri dönüş kaynağı **1.13.1/a182541045dfab06cef39a42e20954c085cecd23**.
  Onaylı işlemde source revert ile normal ileri commit veya doğrulanmış önceki
  Worker sürümüne uygulama rollback'i; force/reset yok. D1/DO snapshot/schema
  geri alınmaz, üretim kayıtları sıfırlanmaz. Bu oturumda rollback yapılmadı.
- Yayın sonrası Search Console'a `https://roamcroft.com/sitemap.xml` gönderilir;
  ana sayfa ve rehber canlı URL testi/indeks isteği kontrol edilir. Sahiplik
  zaten kullanıcıca tamamlandı; indeks/sıralama garanti edilmez. Gönderim bu
  oturumda yapılmadı.

## 30 Ekim — kesin adayın yeni kabul kaydı

Kod `449d3de`; bu kayıt sonrasında yalnız belgeler/görseller güncellendi.

| Kontrol | Yeni sonuç |
| --- | --- |
| Typecheck | Başarılı, çıkış0 |
| Tam test | 222/222,0 hata/atlanan,15.60s |
| Build | Başarılı; finalize/güvenlik ve yerel3,000,000 bayt bütçe geçti |
| Statik çıktı | 2,947,276 bayt; tahmini aktarım1,558,380 bayt |
| Workers yerel dry-run | Başarılı; uncompressed2450.95KiB, gzip765.05KiB; upload/deploy yok |
| Dört oyunculu runtime | Başarılı; HTTP/SEO/nonce/CSP/CORS,4WS,stok/replay/reconnect/restart,D1 çakışması,ortak uyku |
| Mobil menü | Yeni güvenlik kilidiyle390×844/844×390/320×568,11'er=33 döngü PASS; kayıt payload değişmedi |
| Depo | 25/0→7 koy→18/7→3 al→21/4; toplam25,iptal değişiklik yok,0 reddi; yerel fixture |
| Gerçek Game | Eski yerel test kaydı açıldı;180 altın/2 ekmek korundu. Yeni logo ve kamp SVG tam yüklendi |
| Canlı salt-okunur | root200/1.13.1,eski Worker200/1.13.1,www301→root |
| GitHub ana dalı | `a182541`: verify success, Workers Builds success; yeni aday henüz uzakta değil |

Cloudflare'ın [güncel Worker boyut sınırı](https://developers.cloudflare.com/workers/platform/limits/#worker-size)
64MiB uncompressed olarak belgelenir; bu dry-run çıktısı altındadır.
Projedeki3MB statik bütçe farklı bir yerel performans politikasıdır. Hesabın
özel kotaları/startup/gerçek production kabulü erişim ve yayın sonrası doğrulanır.

Loglar Git dışı `work/rc-secure-{typecheck,test,build,runtime,dryrun}.log`.
Yeni karşılama kanıtı `screenshots/rc-1-13-2-local-welcome.jpg`; gerçek yerel
önizleme, canlı veya fiziksel cihaz görüntüsü değildir. Fiziksel telefon, PWA
yaşam döngüsü, gerçek WAN, Sentry olay alımı ve yeni adayın uzak CI/build/deploy
sonucu **DOĞRULAMA EKSİK**. Üretim DB/kayıt/oturum verisine test yazılmadı.
