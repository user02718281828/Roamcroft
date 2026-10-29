# Gerçek9-slot hotbar — şemasız ilk dikey dilim

30 Ekim güncellemesi: bu kod1.14.0-alpha.1 bütünleşik adaya899b9fe ile alındı.
Önceki 'ayrı/yayımlanmadı' ifadeleri aşağıdaki ilk geliştirme kabulüne aittir;
son canlı durum [bütünleşik yayın kaydındadır](verification-release-1.14.0-alpha.1.md).

Dal `codex/hotbar-nine-slice`; ayrı geliştirme işi. A–D1.13.2 yayın adayı
`19f9ba3` bu kodu içermez. Üretime gönderilmedi; tam Inventory/Hotbar2.0 değildir.

## Çalışan davranış

- Dokuz gerçek bağ: `null | {kind:'tool'|'item',id}`. Çantada eşya seç → Hızlı
  çubuğa ata → yuva; mevcut araç veya boşaltma da seçilebilir.1–9 ve dokunma
  aynı bağı seçer. Atama/seçim tüketmez, tarif veya keyfî komut çalıştırmaz.
- Eşya sayısı her çizimde tek gerçek `State.inventory` defterinden okunur;
  iki yuva aynı stoğa bakar.0 stokta bağ korunur, kullanım engellenir. Kaynak
  bağlanabilir fakat doğrudan kullanılamaz; çanta/üretim akışı sürer.
- Yiyecek açık E/eylem/dünya tıklamasıyla mevcut `Engine.eat`; tohum/gübre/
  fidan/fıskiye mevcut seed/build/act yoluna çözülür. Sunucu yeniden doğrular;
  konuk sayıları ACK'den önce azaltılmaz. Yeni komut/protokol/sunucu metodu eklenmedi.
- İlk sekiz varsayılan eski araç sırasıdır; dokuzuncu boş başlar. Araçlar mevcut
  ücretsiz/intrinsic araç kimlikleridir; yeni sahiplik/instance/level verilmez.
  Her zaman El ve çantadan araç atama erişimi var; mevcut upgrades korunur.
- Düzen değişince aktif seçim güvenli El'e döner; eski tuşa yeni eşya sessizce
  etkinleşmez. Menü açıkken hotbar kısayolları/eşya kullanımı engellenir.
- `roamcroft.hotbar.v1` yalnız cihaz/origin UI tercihidir; adet/tier/altın
  saklamaz. SAVE_VERSION1, eski JSON/IndexedDB/anahtarlar değişmez. Bozuk/çok
  büyük tercih, bilinmeyen kimlik ve command/tier/quantity alanları kabul
  edilmez. localStorage hata verirse oturum düzeni kullanılabilir kalır.
- Mobil yatay kayan en az44px yuvalar; ikon/miktar/numara ve erişilebilir ad.
  Dokunma düğmesinde kısa görünür metin, tam eşya adı aria-label'da kalır.

## Kanıt ve sınırlar

Node22.13.0/npm10.9.2. Typecheck, **234/234 test**, build ve dört oyunculu
yerel runtime başarılı (son tur çıkış0). Statik bütçe **2,956,191 bayt**,
tahmini aktarım **1,560,880 bayt**;3MB sınırı artırılmadı. Son test234/234,
0 hata/atlanan,16.31s. HTTP/SEO/nonce/CSP/CORS, dört WS, atomik stok,
kayıp/tekrar/reconnect/Worker restart, D1 çakışması ve ortak uyku geçti.
Loglar `work/hotbar-{typecheck,test,build,final-runtime}.log`. Beş yeni
test tercih izin listesi/sınırları, eski kayıt/1200 stok/tier3 korunması,
aynı stoğa iki referans ve tükenme, mevcut eylem eşlemesi, boş konuk çantası/
otorite bekleme örneklerini kapsar. Bağımlılık veya kilitli sürüm değişmedi.

Gerçek Panels/Editor/Hotbar bellekteki fixture ile390×844 Native tarayıcı
girdisinde:1 ekmek9. yuvaya bağlandı; atama/seçim1 bıraktı; açık kullanım1→0,
ikinci kullanım kapandı; axe tier3 korundu. Yeniden yükleme aynı bağı geri
okudu (fixture karakteri her yüklemede yenidir; bu oyun kaydı yükleme testi
olarak sunulmaz). Tekrar: build sonrası
`node scripts/check-menu-touch.mjs --hotbar`.

Hotbar eklenmiş Panels ile390×844/844×390/320×568'de11'er menü döngüsü geçti:
X, açık navigasyon, alt Kapat, Back/Escape, gecikmiş Back/hızlı açma, depo,
yiyecek seçimi ve serialize payload eşitliği. Bunlar fiziksel Android değildir.
Gerçek Game localhost8950'de3 ekmek9. yuvaya atandı;9 ile seçim3 bıraktı,
E ile tüketim3→2. Kayıtlı çıkış/yeniden yükleme sonrası bağ ve2 stok/180 altın
korundu. Masaüstü1280×720, mobil390×844'te9 adet48px hedef ve sayfa yatay
taşmaması doğrulandı. Ekran daralınca seçili yuvanın görünür kalması için
yalnız barı kaydıran ResizeObserver eklendi. 30 Ekim son gerçek Game kabulü:
1280×720'de9 seçimi →390×844 daralma; yuva9 x325–373,48×48,
bar x12–378 içinde tamamen görünür, sayfa yatay taşması yok. Yatay844×390
kontrolü de yapıldı. Görsel `screenshots/hotbar-nine-local-mobile.jpg` yerel
önizlemedendir; canlı sürüm veya fiziksel cihaz görüntüsü değildir.

**DOĞRULAMA EKSİK:** fiziksel Android/iPhone/PWA/OS Back, gerçek WAN ve oyuncu
kabulü. **PLANLANDI:** drag/drop, ekipman/araç instance sahipliği, gerçek stack
bölme/taşıma, cihazlar arası hotbar senkronu. Bunları uygulanmış sayma; kalıcı
şema/ekonomi/protokol geçişi ayrı onay gerektirir. E/F prototipleri üretime
bağlanmadı. Main/Cloudflare ve güvenliği belirsiz geliştirme push'u yapılmadı.

30 Ekim kurtarma checkpoint: `1ce53670958df914a6e27138eb91c3c0834c5a04`.
Dikey390×844 ve yatay844×390 son seçili9 görünürlüğü geçti. Yerel, yayında değil.
