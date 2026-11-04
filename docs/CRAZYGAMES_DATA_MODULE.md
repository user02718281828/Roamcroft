# CrazyGames Data Module — yerel aday / 4 Kasım 2026

Son kaynak: codex/crazygames-readiness; Aşama1 paketi/commit'leri korunur.
Resmî SDK: https://docs.crazygames.com/sdk/data/ ve
https://docs.crazygames.com/sdk/user/. Özel QA bağlantısı veya build/game
kimliği koda, bu belgeye veya üretim ayarına sabitlenmez.

## Uygulama

Yalnız portal Vite hedefi, Game'in save/storage importlarını portal adaptörüne
yönlendirir. Roamcroft.com IndexedDB/localStorage ve D1/DO/WS kodu değişmedi.
SDK v3 init + kimlik + Data Module okuması tamamlanmadan Game mount edilmez.
SDK yok, init hata veya dataModuleDisabled durumda hata/retry gösterilir;
yerel çiftlikten sessiz fallback yoktur. Bu aşama önceki no-SDK offline
fallback'inin yerine Data Module yükleme kapısı getirir; resmî site etkilenmez.

Yetkili farm kaydı SDK data içindeki roamcroft.farm.v1 anahtarıdır. Mevcut
serialize/deserialize/SAVE_VERSION/checksum zarfı kayıpsız gzip-base64 ile taşınır.
Tek setItem kaydı current ve bir önceki backup'ı içerir; backup iç içe büyümez.
Yeni dünya yalnız başarılı null okumasından sonra oluşur. Bozuk kayıt yükleme
engeli yaratır; boş dünya/yerel yedek onu ezmez. Backup korunur; otomatik
backup kurtarma/bozuk kayıt onarımı uygulanmadı, ayrıca incelenmelidir.

Her async yazma öncesi SDK kullanıcısı yeniden kontrol edilir; Auth Listener
oturumu hemen geçersiz kılar, eski Game unmount olur. SDK ayrıca Data Module
login/logout akışında reload yönetir. Okunan ham kayıttan farklı bulut içeriği
görülürse yazma reddedilir (başka sekme/oturum ezilmez). Yerel unload yazısı
kapalıdır; unload sırasında eski hesabın snapshot'ı yeni hesabı kirletmez.
Kimlik guard'ı yalnız SDK-scoped cihaz/bulut verisi içindir; sunucuda JWT
doğrulaması veya multiplayer yetkisi olarak kullanılmaz.

SDK'nın kendi guest/account saklama ve senkronizasyon kapsamı kullanılır;
uygulama hesapları elle birleştirmez. Eski Aşama1 tarayıcı çiftliği okunup
otomatik buluta taşınmaz veya silinmez. Cloud boş ama eski portal anahtarı
varsa uyarı gösterilir. Önce eski build'de JSON dışa aktar; yeni sürümde
doğru hesap/yedekler doğrulandıktan sonra normal içe aktarma kullanılabilir.
Resmî site origin'inden otomatik göç yoktur.

## Boyut / hata ve gerçek güvence sınırı

Resmî üst sınır1048576 bayttır; JSON.stringify({key:value}) UTF-8 boyutu,
current+backup dahil yazmadan önce kontrol edilir. Diğer SDK anahtarları da
kotayı tüketebilir; SDK limit hatası ayrıca yakalanır. Kesme/silme yapılmaz.
Limit/hata önceki SDK kaydını korur ve görünür uyarı verir; Game'deki JSON
dışa aktarma yolu hâlâ kullanılabilir. Gzip açılımı32MB'de sınırlandırılır.

setItem/getItem senkron olduğundan başarılı dönüş yalnız SDK kabulü/okuma
doğrulamasıdır, uzak sunucu ACK'si değildir. SDK cloud debounce1–30sn olabilir.
Son autosave sonrası değişikliklerin ani kapanışta veya çevrimdışı/ağ hatasında
buluta ulaştığı garanti edilmez; mevcut15sn autosave ritmi korunur. Unload
başarısı iddia edilmez; önemli oturum sonunda Kaydet ile SDK'ya iletip
yeniden açılış QA'sını yapın. Eski kayıtları yedekleyin.

## Doğrulama

Node22.13.0/npm10.9.2 typecheck,10 hedefli test ve portal build geçti.
Testler: load-before-write, guest/account tekrar açılış, checksum'lı kayıt
roundtrip, backup, iki SDK hesap kapsamının izolasyonu, eski oturum yazısının
reddi, değişmiş cloud kaydını ezmeme, bozuk/disabled modül ve sıkıştırılamayan
1MB üstü veri reddi. SDK lifecycle/mute ve mevcut SEO/domain testleri dahil.
Loglar work/cg-data-*.log. Bunlar mock SDK ve gerçek serialize/deserialize ile
yerel testlerdir; gerçek cloud/çok cihaz/account-switch kabulü değildir.

Verilen eski QA Preview erişilebildi; gerçek 3D sahne ve o açılışta2,2MB /
0,9MB /2sn panel değeri görüldü. Kullanıcının önceki0,5MB/5,9sn ölçümü ayrı
gözlemdir; genel hız garantisi değildir. Araç iframe koordinat ve ardından
günlük tıklamasında başarısız olduğundan init/event/mute/get/set/konsol veya
hesap değiştirme başarılı sayılmadı. Eski QA build yeni Data Module kodunu
içermediği için yeni kayıt akışı orada test edilmiş değildir.

## Teslim / kullanıcı adımı

Yeni paket: dist/crazygames; ayrı ZIP dist/Roamcroft-CrazyGames-DataModule.zip.
14 dosya, ZIP1.192.470 bayt; yalnız index/assets/art/textures doğrulandı.
SHA2564A29EB9CE26D8A28E5492B32B76BC3370A6AEC779E2F7B1A5DACC968E707D36B.
Önceki Aşama1 ZIP korunur. Push/main/deploy/Submit yapılmaz.

Önce eski QA çiftliğini JSON yedekleyin. Developer Portal'da Progress Save
seçimini Yes, using the Data Module from the CrazyGames SDK yapın; bu ZIP'i
yeni özel QA build olarak yükleyin. Misafir ve giriş yapmış hesapla değişiklik→
kaydet→bekle→yeniden aç, farklı hesap/çıkış/iki cihaz, quota/SDK kapalı ve
mute/lifecycle olaylarını QA Log/Warnings ile test edin. Submit/public launch yok.
