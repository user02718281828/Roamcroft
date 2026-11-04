# CrazyGames co-op — güvenli yerel aday / 4 Kasım 2026

Durum: YEREL ADAY. Canlı multiplayer hazır veya portal kabulü geçmiş sayılmaz.
Dal codex/crazygames-readiness; taban8e31050. Ürün sürümü alpha.3 kalır.
Kullanıcı hesaplı Data Module, kayıt/yeniden açılış, misafir ayrımı ve boş QA
Warnings sonucunu gerçek güncel QA için bildirdi. Bunları yeniden geliştirmedik.

## Uygulanan sınır

- Portal kullanıcı SDK init sonrası kendi Data Module çiftliğiyle başlar.
  Yeni co-op seçimi yalnız kayıtlı çıkıştan sonra portal ana ekranındadır.
  Arkadaş daveti açık oyunda geldiğinde önce mevcut Game save/ACK ile çıkar;
  kaydetme başarısızsa oyunu/çiftliği terk etmez. Instant/invite açılışı mevcut
  SDK flag/params üzerinden doğrudan oda hazırlar. Normal açılış solo kalır.
- Co-op için getUserToken({signingKeyType:'IN_GAME_AUTH'}) gerekir. Misafirin
  token alamaması sunucu dünyası oluşturmaz; solo Data Module kullanılabilir.
  Token yalnız bellekte; HTTP Authorization ve WS subprotocol içindedir.
  Token URL, localStorage, davet parametresi veya log içine yazılmaz.
- lib/server/crazygames-auth.ts resmî sabit HTTPS JWKS adresinden yalnız
  ingame-auth/RS256 anahtarını alır. İmza, gameId, userId, username, iat/exp
  doğrulanır; legacy/alg-none/HS256/JWK URL seçimi kabul edilmez. Anahtar
  önbelleği/istek birleştirmesi ve sınırlı rotasyon/hata yeniden denemesi vardır.
- Yalnız /api/portal/{world,lobby,shared,realtime} erişimi eklenir. Varsayılan
  kapalıdır; tam HTTPS Origin allowlist ve bearer şarttır. CORS credential
  izni yoktur; cookie alınıp native hesaba bağlanmaz, Set-Cookie dışarı çıkmaz.
  Genel CSP/CORS ve normal aynı-origin Strict oturumu değiştirilmez.
- Doğrulanmış gameId+userId, kalıcı server secret ile ayrı HMAC namespace'ine
  çevrilir. Bu yalnız iç mevcut world cookie kimliğidir; tarayıcıya verilmez.
  Native hesap, kişisel cihaz ve Data Module farm'ı otomatik birleştirilmez.
  Yeni online kimlik mevcut freshWorld/ekonomi/kayıt kurallarıyla başlar.
  Yeni D1 tablosu, kayıt göçü veya DO migration yoktur; eski30 günlük world
  oturum/retention davranışı değiştirilmedi. Identity secret kaybı/rotasyonu
  farklı kimlik üretir: güvenli şekilde yedeklenmeli, rutin değiştirilmemeli.
- Gateway yalnız doğrulanmış istekten iç same-origin Request üretir. Cookie,
  X-Room-* ve token başlıklarını dış istemciden aktarmak yerine kimliği kurar;
  nonce/seq/protocol/üyelik/rate-limit/DO kayıt kuralları aynen uygulanır.
  Lobi adı imzalı username'den gelir; istemci adı sahiplik veya isim otoritesi
  değildir. WS token süresi dolunca mevcut bağlantı kapatılır; yeniden
  bağlantı SDK'nın güncel token'ını ve tekrar sunucu doğrulamasını kullanır.
- Mevcut ServerWorldClient/RealtimeClient yalnız isteğe bağlı transport alır;
  normal sitede önceki fetch/WebSocket yolu kalır. Runtime network alanları
  State'e kaydedilmez, SAVE_VERSION değişmez. Grafik/perf optimizasyonları ve
  Data Module quota/current/backup/hesap değişimi korumaları korunur.
- updateRoom/leftRoom, dolu odada isJoinable:false, inviteLink, başlangıç
  inviteParams ve addJoinRoomListener bağlandı. Davet oda kodu üyelik isteğidir;
  oyuncu kimliği değildir. Üst sınır4, oda süresi ve host kuralları aynı kalır.

## Backend hazırlığı — ayrı yayın onayı gerekir

Bu oturum hiçbir ortam değişkeni, secret, DNS veya canlı deployment ayarlamadı.
Normal backend build şu ayarlar olmadan portal isteklerini503 ile durdurur:

- CRAZYGAMES_ENABLED: "true" (varsayılan yok/kapalı).
- CRAZYGAMES_GAME_ID: yalnız bu oyunun beklenen token gameId değeri. Kullanıcının
  Developer Portal Game ID'si b3bd5e1e-2074-4162-829d-f325d38aaccb; gerçek imzalı
  claim eşleşmesi henüz denenmedi. Uyuşmazlıkta doğrulamayı gevşetme; doğru oyun
  tanımlayıcısını resmî panel/SDK ile teyit et. Token paylaşılmasını isteme.
- CRAZYGAMES_ORIGINS: gerçek oyun iframe'inin tam HTTPS Origin'i; virgülle ayrı
  kesin allowlist. Parent www.crazygames.com adresi veya özel QA URL'si değildir.
  Önceki gözlenen frame roamcroft.game-files.crazygames.com idi; güncel frame
  Origin'i etkinleştirmeden önce yeniden teyit edilmeli. Wildcard yoktur.
- CRAZYGAMES_IDENTITY_SECRET: sunucuda güvenle oluşturulup saklanan64–128 hex
  karakterli kalıcı secret; kaynak koda/ZIP'e konmaz. Bu dosya secret içermez.

HTML5 adayı varsayılan https://roamcroft.com backend'ini hedefler; isteğe bağlı
VITE_CRAZYGAMES_MULTIPLAYER_BACKEND yalnız public HTTPS origin'ini değiştirebilir.
Yeni onaylı staging backend sağlanırsa paket bu origin ile yeniden üretilir.
Staging testinde ayrı DB/DO kullanılmalı; üretim kopyalanmamalı/sıfırlanmamalı.
Bu ZIP tek başına şu anki canlı backend'e co-op yetkisi kazandırmaz.

## Kanıt ve kalan kabul

Node22.13.0/npm10.9.2:257/258 test, typecheck, normal build/finalize/budget ve
HTML5 build geçti. Domain workers_dev/preview_urls false kaldı.
Yeni testlerde gerçek RSA imzalı TEST token'ları + geçici SQLite kullanıldı:
yanlış imza/key/algorithm/game/expiry, forged subject/origin ve disabled gate;
cookie sızmaması; aynı hesap yeniden açılışı; dört kimlikle mevcut lobi/shared
world, beşinci oyuncu reddi, isim enjeksiyonu, çıkış; client host/join/link/full
room/leave, misafir, token isteği sırasında dispose, WS protokolünde tokenın
URL'ye girmemesi ve iç isteğe kimlik başlıklarının aktarılmaması geçti.

Mevcut gerçek yerel Worker/D1/DO4WS runtime de geçti: reconnect/duplicate,
host kopması, cold D1, kayıp ACK, özel çantalar,300ms gecikme/hata enjeksiyonu,
external D1 conflict'te503 ve payload korunması, ortak uyku/tek gün doğumu.
Bunlar gerçek internet veya yeni portal handshake testi DEĞİLDİR.

Henüz yapılmayanlar: gerçek SDK token/JWKS ile backend auth ve gameId eşleşmesi,
gerçek iframe CORS/WS101+subprotocol echo, dört CrazyGames hesabı/iki tarayıcı,
SDK arkadaş bildirimi/link ve oyundayken oda geçişi, Instant Multiplayer,
host henüz yüklenirken join, tam oda/host kopması,1 saat token yenileme/WS
expiry, logout/account switch ve tekrar solo cloud save. Portalın eski özel
Preview build'inde yeni backend kodu yoktur; yeni aday yüklenmedi. Kullanıcı
oturumuna erişilmiş veya bu kabul geçmiş gibi raporlanmaz.

Sonraki panel adımı: ayrı yetkili backend staging hazırlığı ve yukarıdaki kabul
sonrasında bu ZIP'i yeni ÖZEL QA build olarak yüklemek; Data Module seçimini
korumak, lobby size4 ayarını doğrulamak ve Instant/Invite senaryolarını denemek.
Şimdilik herkese açık Multiplayer/Friends uygunluğu veya Submit yapılmaz.

Kaynaklar (4 Kasım kontrol edildi):
- https://docs.crazygames.com/sdk/user/ — IN_GAME_AUTH token/JWKS.
- https://docs.crazygames.com/sdk/game/ — room/Instant/invite/join listener.
- https://docs.crazygames.com/requirements/multiplayer/ — Friends ve lobby4.

## Paket / son kontrol

Son hedefli13 test (auth/transport/Data Module), typecheck ve HTML5 rebuild de
başarılı. Solo→online→solo dönüşünde son başarılı Data Module saveStored kök
nesnesi kullanılır; reddedilen cloud yazısı bu dönüş noktasını değiştirmez.
Boş/ilgisiz SDK inviteParams solo açılışını engellemez; geçerli davet Instant
create işleminden önce gelir. Bu başlangıç kararları test edildi.

Paket: dist/Roamcroft-CrazyGames-Multiplayer-Candidate.zip;14 dosya,
2.361.127 bayt açık /1.194.393 bayt ZIP. Yalnız root index.html ve
assets/art/textures doğrulandı. Backend doğrulama/HMAC secret kodu istemci
paketine girmedi; önceki ZIP'ler korunur. SHA256:
810C5A030E72C6F2F37E2D08DEE1E4E22B6254D5E087F81EC922C1E29A72A5E7.
