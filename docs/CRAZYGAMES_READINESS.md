# CrazyGames hazırlığı — 4 Kasım 2026

## A / uygulandı, yerel kabul sınırlı

Launcher Ayarlar artık Game importunu çağırmaz; bağımsız LauncherSettings açar.
Dil/TouchSettings/GuidanceSetting/AudioSettings yeniden kullanılır. Ses seviyesi
yardımcıları motor bağımlılığından ayrıldı; eski roamcroft.audio.v1 korunur.
Grafik/master ses tercihi roamcroft.presentation.v1 altında oyun kaydından
ayrıdır; Game bunları okur. Ses yalnız sonraki kullanıcı etkileşiminde açılır.
Oyun içi ayarlar, dünya/kayıt yönetimi ve mevcut kayıt anahtarları korunur.

Gerçek esbuild graph + server render kontrolünde Settings çıktısında Engine,
ValleyAudio, scene veya ServerWorldClient runtime kodu yok; canvas yok.
Tercih testi yeniden okuma, bozuk JSON ve oyun kaydı yaratılmamasını doğrular.
UI'nin gerçek tarayıcı Settings→Close→Play akışı henüz kabul edilmedi.

## B / ölçülmedi

Motoru başlatma maliyeti Ayarlar yolundan çıkarıldı; bunun tüm oyun FPS'ine
%10 artış getirdiği iddia edilmez. Yeni karşılaştırılabilir FPS/p95, menü
gecikmesi, heap ve fiziksel mobil ölçümü yapılmadı. Mevcut paused-render/throttle
optimizasyonu kaynakta zaten var; yeniden uygulanmadı, görseller azaltılmadı.

## C / seçilen yön ve kritik güvenlik kapısı

Tercih: ayrı statik Vite girişinde aynı Game/Engine; CrazyGames CDN istemcisi,
Cloudflare backend. Bu teknik olarak araştırılabilir; Vinext kullanımı tek
başına statik istemcinin imkânsız olduğuna kanıt değildir. Henüz HTML5 build
veya ZIP üretilmedi; alternatif yönlendirme/iframe launcher hazırlanmadı.

Mevcut backend doğrudan portal istemcisine uygun değil:
- lib/server/api.ts handleWorld yabancı Origin/cross-site isteği D1'den önce403
  reddediyor. Proxy DB ile gerçek fonksiyon çağrısında403/DB'ye sıfır erişim
  doğrulandı (work/crazygames-origin-gate.log).
- Sunucu çerezi HttpOnly/Secure/SameSite=Strict; üçüncü taraf CDN oturumu
  varsayılamaz. shared-api/lobby/WS üyelik ve origin sınırı korunmalıdır.
- worker/security.mjs frame-ancestors none ve X-Frame-Options DENY içerir;
  kendi alan adından doğrudan portal iframe'i de şu an çalışmaz.

Gerçek CrazyGames game ID/preview origin henüz sağlanmadı. SDK JWT'sini
sunucuda doğrulayan portal oturumu, güvenli misafir kimliği ve hesap değişimi
izolasyonu olmadan mevcut online sistemi CDN'de çalışıyor saymak güvenli değil.
Kullanıcının kritik güvenlik engelinde dur talimatı uyarınca bu kapı aşılmadan
SDK/ads/account/multiplayer entegrasyonu ve yüklenebilir paket tamamlandı sayılmaz.
Wildcard CORS, SameSite gevşetmesi, sahte SDK veya kimlik kabulü eklenmedi.

Resmî belgeler: https://docs.crazygames.com/requirements/account-integration/
(sunucuda getUserToken doğrulaması ve hesap değişimi),
https://docs.crazygames.com/sdk/intro/ ve
https://docs.crazygames.com/requirements/technical/ (250MB/1500 dosya,
ilk indirme50MB, mobil ana sayfa20MB). Bunlar portal kabulü veya ağ ölçümü değildir.

## Devam

Önce gerçek origin/game ID; sonra ayrı portal session tasarımı/kimlik doğrulama
ve misafir→hesap→çıkış→farklı hesap izolasyonu testleri. Ardından statik gerçek
Game build/SDK lifecycle/ses ve Basic reklam kapalı; ancak bundan sonra ZIP ve
portal preview kabulü. Portalda şu an yüklenmeye hazır paket yoktur.
Resmî site SEO/gallery/CSP/domain politikası ve DB/protokol değişmedi.
Push/production/nihai portal başvurusu yetkili değildir; yerel commit korunur.

## Test kaydı

Node22.13.0/npm10.9.2: typecheck,242 test,build ve dört WS/runtime başarılı.
Kayıt/ekonomi/özel çantalar, reconnect/Worker restart, D1 çakışması ve ortak
uyku/tek şafak yerel runtime'da geçti. Bunlar portalda dört oyuncu testi değildir.
Son küçük değişiklik sunum tercihinin render başına değil bir defa okunmasıdır;
sonrasında hedefli tercih testi/typecheck/build tekrarlandı; backend kodu değişmedi.
Loglar work/portal-settings-*.log. Engine/scene/audio/server istemcisi bulunmayan
Ayarlar bundle grafiği ve SSR kanıtı work/launcher-settings-module-check.json.
Gizli dosya, DB, sunucu kaynakları içeren ZIP veya sahte launcher üretilmedi.
