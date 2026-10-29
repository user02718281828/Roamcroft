# 1.13.1 — güvenli fiziksel Android kabulü

29 Ekim 2026. Uygulama dalı `codex/mobile-recovery-1-13-1`, kaynak
`35932d12aef7fab1e50b1a3a52bf34c36f465705`. **Fiziksel kabul EKSİK; kullanıcı 29 Ekim 2026'da bunu bilerek yayın onayı verdi.**

## Tekrar kullanılan kanıt ve bu oturumun kontrolü

- Remote dal/HEAD `35932d1`, main `03d7d00`; repo PUBLIC. Kullanıcıya ait
  `tatus -sb` korunur. Oyun/bağımlılık/kayıt/SDK/CSP/online kodunda yeni fark yok.
- [CI 40856024278](https://github.com/user02718281828/Roamcroft/actions/runs/40856024278)
  aynı SHA: npm ci, typecheck, **212 test**, build ve HTTP/dört WS/runtime başarılı.
  Önceki Windows son koşusu da 212/212; build 2.967.962 ham bayt. Tam paket
  aynı kod için gereksiz tekrarlanmadı; yayın öncesi/birleşim sonrası yeniden gerekir.
- Bu oturumda `mobile-recovery`, `joystick`, `mobile`, `monitoring` dosyalarıyla
  **13/13** hedefli test yeniden geçti: araç/menzil, pointer/iptal, tercih,
  depo/kapasite/çift aktarım, eski kayıt ve negatif stok reddi; 47 ikonun gerçek
  SVG/raster oran/kırpma regresyonu; Sentry mahremiyet filtreleri. Yem araştırması
  baştan açılmadı; mevcut düzeltme ve stok sınırları doğrulandı.
- Hafif sır taraması: **331 takip edilen dosya, 306 metin**; .env/özel anahtar
  dosya adları ve yaygın token/özel anahtar/parolalı URL/literal sır kalıplarında
  eşleşme yok. Tam geçmiş/gizli tarama garantisi değildir. Public Sentry DSN,
  kaynak/dağıtım kimlikleri sır sayılmaz; hiçbir gerçek sır değeri raporlanmadı.
- Yeni `npm audit --json`: **25 — 3 kritik/11 yüksek/10 orta/1 düşük**.
  Bağımlılıklar değişmedi; [önceki erişilebilirlik ayrımı](security-mobile-recovery-audit.md)
  geçerlidir. Bu dar kontrolde yeni istismar edilebilir kritik Worker yolu
  saptanmadı; açıkları kapandı/sıfır risk sayma. Ayrı güvenlik işi sürer.

## Önizleme kararı ve veri izolasyonu

Cloudflare'da başarılı branch build/version vardır (`ed440c09-060e-4016-a2d5-36314bb4b5ae`),
ama ayrı staging D1/DO kanıtı yok. Mevcut dağıtımın üretim DB ve RealtimeRoom
bağlantılarını kullanan bir version URL'si **izole test ortamı sayılmaz**.
Buraya test oyuncusu bağlanmadı. Yeni bulut Worker/D1/DO, tünel, DNS veya erişim
yetkisi oluşturulmadı; bunlar ayrı açıklama/onay gerektirir.

Tercih edilen düşük maliyetli yol: **USB + Chrome DevTools port forwarding**.
HTTP localhost yalnız USB üzerinden bilgisayarın loopback sunucusuna ulaşır;
Wi-Fi/LAN/internet portu açılmaz. Bu HTTPS staging değildir. Android Chrome,
USB bağlantısı ve kullanıcının kendi cihazında uzak hata ayıklama kurulumu
gerekir. iOS/PWA kabulü bu yolla otomatik tamamlanmaz.

Yerel yapılandırma hazır: `work/mobile-acceptance-35932d1/wrangler.json`.
Bu Git dışı dosya mevcut dist yapılandırmasının yerel kopyasıdır; dist ve
üretim ayarları değiştirilmedi. D1 adı test adına ve üretim olmayan placeholder
UUID'ye çevrildi, `remote:false`; DO başka script'e yönlenmez; ayrı Worker adı,
`vars:{}` ve ayrı state dizini var. Üretim database_id bulunmadığı doğrulandı.
İstemci HTTP yolları göreli; WebSocket URL'si location'dan türetilir. CSP canlı
oyun API origin'ine izin vermez; mevcut dar Sentry hata adresi korunur ve
mahremiyet filtresi ham oyuncu/kayıt/istek bilgisini dışlar.

Yerel sunucuyu kalıcı arka plan süreci olarak başlatma girişimi otomatik onay
denetiminde engellendi; araç ayrıntılı gerekçe vermedi. Bu yüzden **sunucu bu
oturumda başlatılmadı**, önizleme HTTP smoke'u ve USB uçtan uca bağlantısı
çalıştırılmış sayılmaz. İzin/firewall/sistem güvenliği değiştirilmedi.

## Kullanıcı: başlat ve telefonda aç

Bilgisayarda bu çalışma alanında PowerShell aç; aşağıdakini çalıştır, pencereyi
açık tut. Komut yalnız yereldir; `--remote`, deploy veya tunnel kullanma.
8943 zaten kullanımdaysa yeni bir süreç başlatmadan önce durumu bildir.

```powershell
Set-Location 'C:\Users\devbu\Roamcroft'
$env:PATH=(Join-Path (Get-Location) 'work/toolchains/node-v22.13.0-win-x64')+[IO.Path]::PathSeparator+$env:PATH
$env:CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV='false'
$env:CLOUDFLARE_INCLUDE_PROCESS_ENV='false'
$env:WRANGLER_SEND_METRICS='false'
& .\work\toolchains\node-v22.13.0-win-x64\node.exe .\node_modules\wrangler\bin\wrangler.js dev --config .\work\mobile-acceptance-35932d1\wrangler.json --local --ip 127.0.0.1 --port 8943 --inspector-ip 127.0.0.1 --persist-to .\work\mobile-acceptance-35932d1\state
```

1. Çıktıda D1/ROOMS **local** ve `Ready` gör; bilgisayarda
   `http://localhost:8943/` açılışının **1.13.1** olduğunu kontrol et. Hata/remote
   görürsen ilerleme. İlk cihaz çiftliği boş test kaydıdır; gerçek kayıt yükleme.
2. Android'i veri USB kablosuyla bağla. Chrome'un [resmî uzak hata ayıklama/
   port forwarding rehberini](https://developer.chrome.com/docs/devtools/remote-debugging/local-server/)
   kullan. Cihaz izinlerini kullanıcı kendisi onaylar.
3. Bilgisayar Chrome'unda `chrome://inspect/#devices` → Discover USB devices →
   Port forwarding → **8943 → localhost:8943**, Enable port forwarding → Done.
4. Telefonda Chrome ile **http://localhost:8943/** aç. Bu adres yönlendirme ve
   açık yerel sunucu olmadan çalışmaz. Test bitince sunucuda Ctrl+C; USB port
   yönlendirmesini kapat. Test state dizinini silme; aynı dizin sonraki testte kalır.

Yeni origin/cihaz IndexedDB ve güvenli oturumu ayrıdır; canlı çiftliğin burada
görünmemesi silindiği anlamına gelmez. Canlı JSON/çerez/sır kopyalama. Yeniden
giriş için aynı telefon, `localhost`, port ve state dizini kullanılmalı.
USB yoksa bu yöntem kullanılamaz; ayrı HTTPS staging için yeni Worker + ayrı
D1/DO/oturum/origin tasarımı ve onay gerekir. Üretim preview URL'sine geçilmez.

## Kullanıcı kabul sonucu — henüz alınmadı

Telefon modeli/Android/Chrome sürümü ve dikey-yatay yönüyle birlikte her satıra
Geçti / Kaldı / Denenmedi yaz. Sorunda adım ve beklenen/gerçek sonucu belirt.

| # | Android Chrome kabul adımı | Sonuç |
| --- | --- | --- |
| 1 | Joystick ile rahat yürü; normal/büyük, sağ/sol ve hassasiyeti dene. | Bekliyor |
| 2 | Baltayı seç, yakındaki ağaca kullanım düğmesiyle vur; seçmek tek başına tüketmesin. | Bekliyor |
| 3 | Kullanım/saldırı ayrımı; kısa/uzun/hızlı basma ve dışarı bırakma iptali. | Bekliyor |
| 4 | Yürürken ikinci parmakla kamera; pinch, parmak kaldırma ve menü açılınca takılı girdi olmaması. | Bekliyor |
| 5 | Bölüm düğmesi/gezinti/scroll, Back ve Close; çanta/üretim/pazar/ayarlar; TR/EN. | Bekliyor |
| 6 | Test çiftliğinde depo inşa et; eşya seç/yön/onay, çift basış, koy/geri al ve toplam stok. | Bekliyor |
| 7 | Odun/taş/lif/kömür/bakır/yem/tohum/ekmek/patates ve diğer ikonlar; miktar etiketi. | Bekliyor |
| 8 | Döndürme, adres/OS gezinme çubuğu, safe-area ve ekran klavyesinde taşma/örtüşme olmaması. | Bekliyor |
| 9 | Aynı origin'de yeniden gir; test kaydı ve kontrol/dil tercihleri sürsün; arka plana git/dön. | Bekliyor |
| 10 | Mümkünse uzun oturum: FPS/kare zamanı, ısınma/pil ve dokunma gecikmesi; cihaz/kaliteyi yaz. | Bekliyor |

Fiziksel Android, iPhone Safari ve kurulu PWA kabulü **EKSİK**; önceki viewport
kanıtı bunların yerine geçmez. USB testi gerçek WAN/dört fiziksel cihaz kanıtı değildir.

## Yayın kararı

**Güncel karar: kullanıcı yayın onayı verdi; fiziksel kabul yayın sonrasında.**
Bu açık onay yalnız 1.13.1 içindir. Git/merge, güncel typecheck/212 test/build/runtime/
HTTP/dört oyuncu/CI, normal push, Workers Builds ve canlı sürüm/kayıt/Sentry/CSP
kontrolü gerekir. Başarısızlıkta yayın durur; geri dönüş üretim verisini silerek
yapılmaz. Sonraki geliştirme: kabul engeli varsa dar düzeltme; yoksa ayrı
karşılama/örnek envanter sanat paketi. 1.14/dünya/online işleri başlatılmadı.
