# 1.13.1 — Mobile Recovery doğrulama kaydı

Güncel yayın hazırlığı, izole yerel test komutu ve kullanıcının Android sonuç
tablosu: [1.13.1 son kabul](acceptance-mobile-1.13.1.md). Fiziksel kabul ve
main/Cloudflare onayı henüz alınmadı; aşağıdaki otomatik kanıtlar bunların yerini tutmaz.

29 Ekim 2026; çalışma alanı `C:\Users\devbu\Roamcroft`.
Kullanıcının ana devam talimatı bu oturumun kapsamıdır; Downloads altındaki
30 Ekim yapılacaklar listesi karşılaştırma/plan kaynağıdır. Diğer Sentry
worktree'si kullanılmadı. Gerçek Android ekran görüntüleri eklerde yoktu;
kullanıcının açık gözlemleri kabul girdisi alındı.

## Taban ve yayın sınırı

- Başlangıç dalı `codex/gameplay-foundation-1-13`, HEAD/origin/main `03d7d00095774134ee1f4c48452f434c13977672`.
- GitHub main CI `40793820458` ve geliştirme CI `40793820402` başarılı.
  Yerel eski `main` ref'i tarihsel `becf1b8`; bu eski yerel dal kullanılmadı.
- Yeni dal `codex/mobile-recovery-1-13-1`; kullanıcıya ait untracked `tatus -sb`
  okunmadan/değiştirilmeden bırakıldı ve commit'e alınmadı.
- `.github/workflows/check.yml`: main/feature/codex push'larında ci/typecheck/
  test/build/runtime. Cloudflare Workers Builds main üretim akışıdır;
  geliştirme dalında build/version oluşması aktif üretim değişikliği değildir.
- Bu paket için main push/deploy yetkisi **yok**. Veritabanı sıfırlama/silme,
  force/reset/clean, Wrangler deploy, domain/portal/SDK/mağaza işlemi yapılmadı.

## Kök nedenler ve uygulananlar

| Bulgu | Kaynak / çözüm ve sınır |
| --- | --- |
| Joystick kenara yakın | `mobile.css` 12px inset/104px alan kullanıyordu. Yeni safe-area + 20–40px yatay, 28px alt inset; 128/148px hit alanının dış 12px'i görsel halkadan bağımsız. Analog deadzone/clamp korunur; .8–1.2 hassasiyet ve sağ/sol düzeni ayrı `roamcroft.touch.v1` tercihidir. |
| Eylem ve saldırı karışıklığı | Eski iki 48px düğme yalnız 6px aralıkla aynı renkteydi; etkileşim her zaman el/bağlamsal hedef önceliğindeydi. Yeni altın 64px kullanım ve kırmızı 56px saldırı, 16px aralık; seçili araç adı/ikonu. Mobil balta/kazma/olta yalnız menzildeki uygun hedefi önerir, Engine yeniden doğrular. Masaüstü E davranışı korunur. |
| Dokunma iptali | Kontrolü durdurmak ile ağ simülasyonunu durdurmak ayrı tutuldu. Menü/ana menü/duraklama/blur/visibility/resize, joystick/press/kamera drag/pinch durumunu bırakır. UI parmağı canvas'a aktarılmaz; pointer kimliği/capture korunur. Basılı tutma tekrar üretmez, dışarı bırakma iptal, klavye Enter çalışır. |
| Native Section | `Panels` içindeki native select kaldırıldı. Ortak CampNavigation: gruplu büyük düğmeler, aktif bölüm, sınırlı ayrı scroll, kalıcı kapatma, aria-expanded/controls/current, Escape ile listeyi kapatıp odağı tetikleyiciye döndürme. Aynı URL history girişi Back ile paneli kapatır; OS/PWA kabulü ayrıca gerekir. |
| Yatay uzayan ikonlar | `.storage-list>div>span` ve `.bundle-item>span` kuralları ikon span'ını metin gibi esnetebiliyordu. Background sprite kutu oranıyla da esniyordu. Ortak `GameIcon` artık oranı koruyan SVG; iç SVG yalnız atlas hücresini kırpar. SVG kökü metin span kurallarına girmez; flex-grow/shrink koruması var. |
| Kopuk parçalar | 768×768/4×4 atlaslarda tohum/yem/ekmek hücresine alt sıradaki bina detayları; patatese alttaki un kepçesi taşıyordu. Yalnız sunumda bu hücreler 160/180px yüksekliğe kırpılır, oran korunur. Orijinal WebP'ler değiştirilmedi, büyük varlık veya bağımlılık eklenmedi. |
| Şüpheli -10 yem | Yerel gerçek State/erişilebilir etiket 10 gösterdi. Önceki yem ikonunun alt komşu parçacığı miktarın yanında eksiye benzeyebiliyor; kırpma ve sayının opak ayrı etiketi bunu kaldırır. Negatif içe aktarım zaten reddediliyor. Kullanıcının asıl ekranı/kaydı yok: her olayı aynı nedene bağlamak mümkün değil; üretim verisi düzeltilmedi. |
| Çanta/depo | Dar ekranda 56px+ yuva, 44px ikon, isteğe bağlı açılır seçili ayrıntı; boş dekor yuvaları telefonda gizli. Görsel seçim tüketmez. Depo eşya seç → yön/miktar → ayrı onay; fresh quote stok/kapasite değişimini reddeder, sync ref çift onayı keser; online ACK öncesi miktar değiştirilmez. |

## Gerçek çalıştırmalar

Windows taşınabilir Node **22.13.0**, npm **10.9.2**. Başlangıçta 205/205 ve
typecheck geçti. Temiz kurulum sonrası son paket kontrolleri yeniden çalıştırıldı;
loglar Git dışındaki `work/mobile-final-*.log` ve `work/mobile-ci.log` altındadır.

| Kontrol | Sonuç |
| --- | --- |
| npm ci | Başarılı; 584 paket kuruldu, 585 tarandı; yaklaşık 1 dakika. |
| typecheck | Başarılı. |
| npm test | **212/212**, 0 başarısız/atlanan (205 taban + 7 regresyon); 16.69 saniye. |
| build/finalize/bütçe | Başarılı; **2.967.962 ham bayt**, **1.591.529 tahmini sıkıştırılmış bayt**; 3.000.000 bütçesi. Gerçek ağ aktarımı değildir. |
| check:runtime | Başarılı, exit 0; yerel üretim Worker/D1/DO, HTTP/CSP/nonce/statik/oturum/CORS, dört WS, 50–300ms gecikme/kayıp, reconnect/restart/host toleransı, ACK replay ve üretim/malzeme atomikliği, D1 çakışmasında durma, ortak uyku. |
| Audit | **25: 3 kritik/11 yüksek/10 orta/1 düşük**; omit=dev 19. [Ayrıntı](security-mobile-recovery-audit.md). Bağımlılık yükseltilmedi. |

Yeni regresyonlar: uygun/menzilde araç hedefi ve sıfır mutasyon; pointer
sahipliği/tek bırakma/iptal/ayrı joystick-pinch; tüm capture'ları bırakma;
bozuk/engelli tercih depolama; eski yem=10/negatif reddi/dolu çanta/depo/tekrar
transferi; stale quote ve ACK öncesi çanta eşitliği; **47** eşya için gerçek
React SVG çıktısı ve atlas ikonlarının geniş/dar kutuda raster harf kutulaması.
Test, var olan Sharp ile yalnız bellekte PNG/SVG doğrular; yeni varlık yazmaz.
`work/mobile-art-review.html` yalnız etiketli yerel görsel regresyon fikstürüdür.

İlk test geliştirmesinde geçersiz bina konumu/alanı/nextId ve Sharp'ın Vinext
ambient tip gölgelemesi düzeltildi; üretim/save doğrulaması gevşetilmedi.
Raster testi, kök SVG'nin letterbox bölgesinde komşu atlası gösterebildiğini
yakaladı: ikinci kırpma sınırı gerçek bileşene eklendi. 47 öğe galerisinde
tohum/patatesteki ek küçük parçalar da saptanıp kırpıldı.

Tam tekrar koşusunda mevcut `shared-resilience` testi bir kez host freeze
görüntüsünde yarışa düştü; ham hata Git dışı `work/mobile-failed-resilience-test.log`
altında korundu. Değiştirilmemiş test tek başına geçti. İlk global idle denemesi,
sürekli yeni sorgu yüzünden sıfır beklerken zaman aşımına uğradı. Test düzeneği
artık sadece freeze baseline alınırken yeni mock HTTP pulse'larını bariyerde
bekletir; önceki istekler biter, snapshot alınır, 16 saniyelik saat atlaması
sonrasında bekleyen istekler devam eder. Aynı tam kayıt eşitliği, altın/çanta,
15 saniye ve kapanış kontrolleri korunur. Üretim istemci/sunucu kodu değişmedi;
bu test senkronizasyonu düzeltmesinden sonra tam 212 test geçti.

## Tarayıcı kanıtı ve sınırı

Yerel üretim Worker `127.0.0.1:8940`; gerçek tarayıcı etkileşimleri, fiziksel
telefon değildir. 320×568, 390×844, 844×390 ve 1440×900 ayrı kontrol edilir.
320px panel `[6,6,308,556]`, içerik genişliği=scrollWidth **296px**; Close 44px.
1440×900 panel `[280,125,880,650]`, içerik genişliği=scrollWidth **722px**.
Yatay varsayılanda joystick `[24,238,128,128]`, kullanım `[756,230,64,64]`,
saldırı `[760,310,56,56]`, hotbar x=227–617; alanlar ayrıdır.
Sağ/sol ve büyük tercih, TR/EN ve
yenileme kontrolü yapıldı. Joystick gerçek tarayıcı mouse-pointer sürüklemesi
oyuncuyu hareket ettirdi; bıraktıktan sonra hareket tutunmadı. Donanım
çoklu-dokunma/aynı anda pinch testi yapılmış sayılmaz.

İzole `127.0.0.1:8942` fikstürü gerçek `StoragePanel`/Engine/TouchAction
bileşenlerini bellekte çalıştırır; save/backend bağlantısı yoktur. Çift eşya
seçimi çağrı=0; yem 10 depola teklifinde miktar değişmedi; çift Confirm sonrası
çağrı=1, çanta0/depo10; geri al sonrası çağrı=2, çanta10/depo0. 320px ikonlar
32×32 ve yatay taşma yok. Eyleme 1000ms mouse basış tek çağrı; Enter ikinci;
dışarı sürükleyip bırakmak çağrıyı artırmadı. Bu sentetik tarayıcı testi,
gerçek Android dokunmatik gecikmesi değildir.

Son tarayıcı hata kaydı boştu. Gerçek yerel ekran görüntüleri:
`screenshots/mobile-1.13.1-pack.jpg`, `-navigation.jpg`, `-controls.jpg`,
`-desktop.jpg`. `-item-fixture.jpg` 47 ikonun **etiketli test fikstürüdür**;
oyun içi veya fiziksel Android görüntüsü diye sunulmaz. Tarayıcı override'ı
ve geçici yerel sekmeler/sunucular doğrulama sonrası kapatılır.

## Kullanıcının fiziksel kabul listesi — EKSİK

1. Android Chrome dikey/yatay: normal/büyük joystick, sağ/sol düzeni,
   hassasiyet; sistem gezinme/çentik güvenli alanı, başparmak rahatlığı.
2. Balta/kazma/çapa/sulama/olta: seçmek tüketmez; kullanım tek vuruş, saldırı
   ayrı; hedef menzil dışında ürün yok. Hızlı/uzun basma ve dışarı iptal.
3. Joystick tutulurken ikinci parmakla kamera sürükleme ve iki parmak pinch;
   parmak bırakma/iptal/düşük FPS sırasında kamera sıçraması veya takılı yürüme yok.
4. Hareket sırasında menü/ana menü, arka plan/geri dönüş, ekran döndürme ve
   adres çubuğu aç/kapa. Klavye açılınca kapatma/kritik eylem erişilebilir.
5. Bölüm düğmesi, kaydırma, bütün kategoriler, aktif bölüm, donanım/gesture
   Back ve Close; tarayıcı geçmişine yanlış çıkma veya odak kaybı yok.
6. Çanta/depo/üretim/emanet/pazar/tooltip ikonları, özellikle yem/tohum/ekmek/
   patates; gerçek miktar ve depo kapasiteleri, dolu durum ve hızlı çift basış.
7. Kurulu PWA/Android Chrome ve iPhone Safari: yaşam döngüsü, tekrar açılış,
   safe-area, ekran klavyesi, ses izni. Mümkünse dört gerçek cihaz/WAN.
8. Uzun oturumda FPS/kare zamanı, pil/ısınma/bellek/girdi gecikmesi ölçümü.
   Tarayıcı ölçüsünden fiziksel sonuç üretilmez.

## Korunanlar ve sıradaki paket

Engine ekonomi, save/storage/SAVE_VERSION=1, sunucu/coop/protokol/D1/DO,
Sentry/privacy/CSP kaynaklarında fark yok. `scene.ts` yalnız girdi etkinliği,
iptal ve listener temizliği değiştirildi; model/geometri/kurallar refactoring'i yok.
Gerçek hotbar/şema göçü, ekonomi dengesi, tüm sanat ekranları, hesap/Online2,
portal SDK/reklam/domain/APK bu pakette uygulanmadı.

Yerel/CI başarısı yayın onayı değildir. Önce fiziksel mobil kabul ve gerekirse
dar düzeltme; ardından ayrı karşılama/örnek envanter sanat paketi. Güvenlik
yamaları bağımsız kontrollü P0 olarak sürer. Main/aktif canlı 1.13.0 korunur.
