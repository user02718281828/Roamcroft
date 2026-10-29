# 1.13.2 — acil mobil menü adayı / 29 Ekim 2026

Dal: `codex/mobile-menu-fix-1-13-2`. Taban ve değişmeyen canlı main:
`a182541045dfab06cef39a42e20954c085cecd23` (1.13.1). Main push/yayın yetkisi yok.
Kullanıcının Android sonucu: hareket, balta/saldırı ve pinch geçti; çanta X'i
dikey/yatay kapanmadı. Depo erişimi anlaşılmadığı için aktarım denenemedi.

## Kök neden ve düzeltme

390×844 tarayıcıda X 44×44 görünürken merkezindeki `elementFromPoint`, X
yerine `.camp-menu` döndürdü. Tam genişlikteki şeffaf navigasyon kapsayıcısı
`z-index:2` ile X'in (`auto`) hit alanını örttü. Sağdaki görsel boşluk gerçek
bir hit boşluğu değildi. Base UI Close/state, safe-area veya kamera olayı
kök neden değildi; olay düğmeye ulaşmıyordu.

Kapsayıcı `pointer-events:none`, gerçek navigasyon kontrolleri `auto` oldu.
X üst katmanda 48×48 CSS px; mobilde altta ikinci 44px Kapat kontrolü var.
Mevcut aynı-URL Back geçmişi ve Escape korunur. Panel yüksekliği 720px ile
sınırlanır, filtre/sıralama tek satırdır; kapsamlı envanter tasarımı değildir.

## Doğrulama

Node 22.13.0 / npm 10.9.2, mevcut kilitli kurulum; bağımlılık değişmedi.

| Kontrol | Sonuç |
| --- | --- |
| Typecheck | Başarılı (son fixture metni sonrası yeniden çalıştırıldı) |
| Tam Node testleri | 212/212, 0 hata/atlanan; 20.31s |
| Build | Başarılı; 2,969,139 bayt, 3MB bütçe geçti |
| Mobil tarayıcı | 390×844, 844×390, 320×568: her birinde 7 aç/kapat/yeniden aç döngüsü |

Tarayıcı fixture'ı gerçek Panels/Base UI ve derlenmiş CSS kullanır. Hedefin
merkezi/dört köşesi hit-test edilir; dokunma pointer/touch ve uyumluluk click
olayları gerçek hit öğesine gönderilir. X×3, açık navigasyonda X, alt Kapat,
Back ve Escape sınanır. Menü eylemleri serialize edilmiş oyun verisini
değiştirmedi. Bu 21 döngü Node test sayısına eklenmez; güvenilir fiziksel
dokunma/Android OS kabulü değildir.

Tekrar: build sonrasında `node scripts/check-menu-touch.mjs`, localhost:8947,
mobil viewport ve “Run touch regressions”. Fixture bellektedir; kayıt/API/WS
istemcisi yoktur. Ekran kanıtları `work/hotfix1132-*.jpg` altındadır.

`check:runtime` başarılı (çıkış 0): HTTP nonce/CSP/CORS/oturum, dört WS,
50–300ms gecikme/kayıp/yeniden bağlanma, Worker restart, atomik malzeme,
tekrar isteği, dış D1 çakışması ve ortak uyku geçti. Tam log yerel
`work/hotfix1132-runtime.log`. Son manuel koordinat tıklaması da X'i kapattı.

## Korunan sınırlar ve kalan kabul

Engine, ekonomi, kayıt sürümü/anahtarları, sunucu/coop, D1/DO, Sentry ve CSP
kaynakları değiştirilmedi. Yerel runtime üretim verisi kullanmaz. Audit'teki
25 açık bulgu bu yamada düzeltilmedi.

**DOĞRULAMA EKSİK:** gerçek Android dikey/yatay X, navigasyon açık X, alt
Kapat, OS Back, yeniden açma/döndürme ve kapanış sonrası joystick. iPhone/PWA
da ayrı kabul. Büyük çanta/web paneli hissi ve depo keşfedilebilirliği master
planda P1'dir; hotfix bunların tamamını çözdüğü iddiasında bulunmaz.
