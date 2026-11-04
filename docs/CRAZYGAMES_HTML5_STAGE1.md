# CrazyGames HTML5 — Aşama 1 / 4 Kasım 2026

Yerel taban b97e099; da6f97b/9ab1074 checkpoint'leri atadır ve korunur.
Dal codex/crazygames-readiness; main/push/deploy/submission yapılmaz.

## Gerçek istemci

`npm run build:crazygames` → `dist/crazygames/index.html`.
`npm run preview:crazygames` → http://127.0.0.1:8973/game/ (yalnız localhost).
Portalın ayrı React/Vite girişi aynı Game/Engine/ValleyScene'i yükler; sunucu
veya roamcroft.com iframe/yönlendirmesi yoktur. SDK dışındaki oyun dosyaları
yereldir. Art/texture yolları göreli; alt dizinde gerçek tarla çizimi doğrulandı.
Orijinal Vinext/site hedefi, SEO/gallery/Workers ayarları değiştirilmedi.
Normal site build'i ayrıca başarılı; SDK yalnız portal girişinde yüklenir.

Portal yalnız cihaz çiftliğidir. Game serverMode=false, offline campGroups ile
online giriş yoktur; sunucu oturumu veya portal kimliği kabul edilmez. PWA/SW,
kurulum ve kendi fullscreen düğmeleri portal build alias'ında devre dışıdır;
resmî sitedeki özellikler korunur. SAVE_VERSION/IndexedDB anahtarları aynıdır;
bu kayıtlar portal origin'ine aittir, resmî siteden otomatik taşınmaz.
Platform hesabı/cloud save entegrasyonu ve hesaplar arası izolasyon bu aşama
değildir; portal paketi yerel misafir çiftliğidir. SDK init kullanıcı oturumu
veya doğrulanmış kimlik yerine kullanılmaz. Reklam API'si/düğmesi yoktur.

## SDK v3

https://sdk.crazygames.com/crazygames-sdk-v3.js yalnız portalda async yüklenir.
CrazyGamesBridge init tamamlanmadan API çağırmaz; loadingStart/Stop ve gerçek
ready/pause/main-menu/panel geçişleri gameplayStart/Stop'a bağlanır ve tekrarlar
birleşir. Focus değişimi için ek gameplay bildirimi gönderilmez (portal yönetir).
İlk state init'ten önce değişse de sırayla bildirilir. SDK yok/hata/başarısız
çağrıda Game çalışır. muteAudio ayarı ve değişim dinleyicisi, oyun içi açma ve
gesture resume'dan önceliklidir; kullanıcının saklı ses tercihini ezmez.
SDK/User/Data/ads/invite API'leri uygulanmış sayılmaz; resmi portal testi yoktur.
Kaynaklar: https://docs.crazygames.com/sdk/intro/ ve
https://docs.crazygames.com/sdk/game/ (v3 init, yaşam döngüsü, muteAudio).

## Ölçüm / paket

14 dosya;2.353.280 bayt toplam; ZIP1.191.319 bayt.
ZIP: `dist/Roamcroft-CrazyGames-HTML5.zip`, root index.html.
SHA256 `9264337EBE0A0F4784431BA645D2566E756883C66C0060D2A481EF54539CBCA7`.
Arşiv yalnız index.html/assets/art/textures; .env/SQL/DB/server/worker/TS/map
bulunmadığı ZipFile ile doğrulandı. SDK dosyası harici resmî kaynaktan yüklenir.
Tekrar ZIP üretmek için build sonrası dist/crazygames içeriğini index kökte
kalacak biçimde arşivle; mevcut ZIP yedeğini otomatik ezme.

Yerel statik HTTP sunucusu ilk doküman→oynanabilir ekim aracı aralığında13
istek/2.253.267 bayt gövde ölçtü. Sıkıştırma yok; SDK dış isteği dahil değil.
Bu internet/CDN aktarımı,20s hedefi veya fiziksel mobil kabulü değildir.
Teknik sınırlar https://docs.crazygames.com/requirements/technical/:
250MB/1500 dosya; ilk50MB, mobil ana sayfa20MB. Boyutlar uygundur; platform
onayı veya mobil destek ilanı bu ölçümlerden çıkarılamaz.

## Kabul

Node22.13.0/npm10.9.2 typecheck,7 ilgili test, normal site build'i ve bağımsız
HTML5 build başarılı. SDK init/hata/yok/geç init/tekrar/mute/dispose testleri,
sunum tercihleri, domain SEO ve Worker kapatma regresyonları dahil.
Eklenen Game platform etkileri opsiyoneldir; mevcut backend kodu değişmedi.

Gerçek yerel tarayıcı /game/: Three.js sahne, yürüme; Engine/WebMCP üzerinden
18,19 çapalama/ekim/sulama, tohum12→11, water~100 ve oyuncu17,18 doğrulandı.
Settings üzerinden TR seçildi; save+yeniden açılışta TR/180altın/11tohum korundu.
Son portal girişindeki save/exit Engine'i unmount edip Devam et ekranına döndü.
Görsel work/crazygames-local-game.jpg; loglar work/cg-*.log ve
work/crazygames-local-load.json. Yerel iframe/portal testi yapılmadı.

## Kullanıcının ilk portal adımı / sonraki kapı

Developer Portal'da Roamcroft için HTML5 taslak oluşturup bu ZIP'i yalnız özel
önizlemeye yükle; resmî v3 SDK ve gerçek gameplay/mute/kayıt/alt-dizin varlıklarını
orada dene. Public submission/launch yapma. Gerçek preview URL/origin ve game ID
ile portal kabul kaydı aç; değer veya kimlik uydurulmadı.
Multiplayer kapalı: ayrı allowlist/session protokolü, resmî JWT'nin sunucuda
doğrulanması, misafir/hesap değişimi/çıkış/cihazlar arası sahiplik ve WS
doğrulaması gerekir. Mevcut Strict cookie/CSP/CORS genel olarak gevşetilemez.
