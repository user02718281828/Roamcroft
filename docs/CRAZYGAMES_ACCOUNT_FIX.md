# CrazyGames hesaplı açılış düzeltmesi — 4 Kasım 2026

Taban: codex/crazygames-readiness / 8a7104f. Ürün sürümü değişmez.

Kesin kod hatası: PortalGame identity() getUser() sonucu null değilken
user.userId zorunlu tutuyordu. SDK v3'ün belgelenen nesnesi username,
profilePictureUrl ve __dangerousUserId içerir; userId içermez. Bu nedenle
giriş yapan kullanıcı reddedilir, null misafir geçer. Yanlış TypeScript
sözleşmesi de bu hatayı gizliyordu. Kullanıcı QA logları bu akışla uyumlu;
özel kullanıcı nesnesi/token yakalanmadı veya günlüğe kopyalanmadı.

Data Module için getUser/getUserToken/isUserAccountAvailable sorguları
kaldırıldı. Token daha önce de çağrılmıyordu. __dangerousUserId yerine
geçilmedi; istemci kimliği backend doğrulaması olarak kullanılmaz.
SDK init tamamlandıktan sonra aynı SDK data anahtarı okunur; kendi hesabını
SDK seçer. Mevcut bulut verisi yerine yerel çiftlik aktarma/fallback yoktur.

Auth listener okumadan önce kaydedilir. Gerçek auth bildirimi store'u anında
geçersiz kılar, gameplay'i durdurur ve eski Game'i kaldırır; gecikmiş load
oyunu tekrar açamaz. Sıkıştırma sırasında geçersiz kılınmış store yazamaz.
Dispose da eski store'u kapatır. User Module/listener kullanılamıyorsa Data
Module çalışabilir; hesap değişiminde SDK'nın belgelenmiş otomatik yeniden
yüklemesi kullanılır (login ve logout). Uygulama kullanıcıya hesap bağlamaz,
hesap kovası seçmez veya kayıt taşımaz. Reload sonrası yeni SDK verisi okunur.

Read-before-write, CAS/readback, bozuk kayıt reddi, current/backup, 1MB kotası,
SAVE_VERSION, D1/DO/online/CSP ve önceki performans değişiklikleri korunur.

Doğrulama: Node22.13.0/npm10.9.2;251/251 test, typecheck ve portal HTML5 build
başarılı. Testler SDK-scoped misafir/hesap kovalarını, tekrar açılışı, SDK
reload/dispose ve auth-event geçersiz kılmasını; User API hatası/modül yokluğu;
yükleme/sıkıştırma yarışı, conflict/corruption/kota ve eski regresyonları kapsar.
Gerçek kullanıcı hesabına girilmedi, yeni build QA'ya yüklenmedi. Gerçek QA
kabulü: misafir → kayıt/yeniden aç; giriş → cloud kayıt/yeniden aç; çıkış ve
başka hesap → önceki oturum yazmaz, SDK seçtiği kayıt açılır. Gizli QA URL'si
koda/belgeye sabitlenmedi. Push/main/deploy/Submit yapılmadı.

Yeni çıktı: dist/crazygames ve dist/Roamcroft-CrazyGames-AccountFix.zip.
Önceki ZIP'ler ayrı adlarıyla korunur. Yalnız portal build kullanıldı;
normal site yeniden yayımlanmadı.

Kaynaklar (4 Kasım kontrol edildi):
- https://docs.crazygames.com/sdk/user/ — user şekli ve auth/reload sözleşmesi.
- https://docs.crazygames.com/sdk/data/ — SDK init, misafir/hesap kaydı ve
  tamamen Data Module'a dayanma gerekliliği.

ZIP doğrulaması:14 dosya, root index.html, yalnız assets/art/textures;
1.192.475 bayt. SHA256:
ECF0E19F17A5916C350035E359305CB5BB8E0F447959AF6C7533BB82D3FB2A9F.
