# Roamcroft — uluslararası portal yol haritası

Uzun vadeli ana iş sırası ve durumlar: [Roamcroft 2.0 Master Plan](ROAMCROFT_2_0_MASTER_PLAN.md).
Bu belge portal yayın kapılarını ayrıntılandırır. Yeni kullanıcı talimatıyla
ilk açılış İngilizce olacaktır; yalnız açıkça saklanmış TR/EN tercihi önceliklidir.

Bu plan 28 Ekim 2026 tarihindeki 1.11.5 tabanını esas alır. Oyun kuralları,
kayıt sürümü ve ortak oyun otoritesi korunur. Her aşamanın çıkış koşulu
sağlanmadan ona bağlı yayın aşamasına geçilmez. Commit, push, canlı dağıtım ve
bağımlılık yükseltmesi ayrıca kullanıcı talimatı gerektirir.

| Öncelik | Aşama | Kapsam ve çıkış koşulu |
| --- | --- | --- |
| P0 / 1 | Türkçe ve İngilizce | Merkezi tip güvenli sözlükler; arayüz, içerik, olay ve hata metinleri; ayarlarda kalıcı dil; ilk açılış İngilizce, yalnız saklanmış kullanıcı tercihi öncelikli. Dil değişimi motoru veya bağlantıyı yeniden başlatmamalı; kayıtlar ve ağ protokolü değişmemeli. Sözlük eşliği, yer tutucular ve uyumluluk testleri; typecheck, test ve build. |
| P0 / paralel yayın engeli | Bağımlılık güvenliği | Aşağıdaki 23 bulgunun onaylı ayrı işte giderilmesi; temiz kurulum ve yeniden audit; üretim Worker ve portal paketinin ayrı değerlendirilmesi. Bu i18n işi bağımlılıkları güncellemez. |
| P0 / 2 | Kayıt güvenliği ve portal yaşam döngüsü | Mevcut çift yedek, atomiklik ve kayıt ACK davranışını koru. iframe/origin/depolama kısıtları, üçüncü taraf çerezleri, gizlenme/yeniden açılma, çevrimdışı ve depolama kotası testi. Bulut kaydı gerekiyorsa sunucu kimliği, sahiplik ve çakışma politikası tasarla; yerel JSON'u güvenilir sunucu kaydı sayma. Silinen çerez için kurtarma kısıtını oyuncuya açıkla. Eski kayıtlarla geri yükleme testi çıkış koşuludur. |
| P1 / 3 | Onboarding | Her iki dilde kısa, atlanabilir ve tekrar açılabilir ilk oturum rehberi; hareket, tarım, enerji, kayıt ve online farkı. Mobil/dokunma ve klavye yolları; ilk anlamlı hasada kadar kullanılabilirlik testi. Ekonomi ve mevcut ilerleme ödülleri değiştirilmez. |
| P1 / 4 | Portal SDK uyarlayıcısı | Önce hedef portalın güncel resmi teknik ve ticari şartlarını doğrula. SDK'yı motorun dışındaki bir adaptöre al: hazır/yükleniyor/oyun başladı/durdu, tam ekran, görünürlük, ses ve kullanıcı izni. SDK yokken bağımsız oyun çalışmalı. iframe, CSP, izinler, yeniden bağlantı ve ortak odanın duraklama kuralları test edilir. Portal seçilmeden özel SDK varsayılmaz. |
| P1 / 5 | Mahremiyet odaklı analitik | Portal şartları ve gerekli rıza belirlendikten sonra oturum/yükleme, onboarding adımları, performans ve hata ölçümleri. Ham kayıt, çanta, sohbet, davet kodu veya oturum sırrı gönderilmez. Olay şeması, saklama süresi ve kapatma yolu tanımlanır; analitik hatası oyunu engellemez. |
| P1 / 6 | Reklam | SDK ve kayıt güvenliği sonrasında. Önce portal kuralları ve yaş/mahremiyet şartları; doğal duraklarda gösterim. Ödüllü reklam isteğe bağlı olmalı; ödül sunucu otoritesinde, tek seferlik işlem kimliğiyle, ACK ve kopma durumlarıyla doğrulanmalı. Reklam iptalinde veya hatasında oyuncu kaybetmemeli. Ortak dünya otomatik durdurulmaz; mevcut ekonomi kullanıcı onayı olmadan değiştirilmez. |
| P1 / 7 | Yayın | Önce yerel üretim Worker/D1/DO ve dört istemcili runtime kontrolü; sonra hedef portalın test ortamı, gerçek WAN/çok cihaz ve fiziksel Android/PWA. Dil, iframe, ilk yükleme bütçesi, kayıt kurtarma, reklam/SDK hata senaryoları ve erişilebilirlik kontrolü. Sınırlı test yayını → ölçüm → düzeltme → kullanıcı onayıyla genel yayın. Üretim sırları ve geri dönüş planı ayrı tutulur. |
| P2 / 8 | Prestij | Portal yayını için zorunlu ön koşul değildir. Önce çok günlük ekonomi ve oyuncu geri bildirimi. Kalıcı ilerleme/sıfırlama kapsamı, geri alma/yedekleme, ortak çiftlik sahipliği ve yeni kayıt göçü ayrı tasarım ve onay gerektirir. Mevcut kayıtları kendiliğinden sıfırlama. |

## Güvenlik yayın engeli: mevcut 23 paket bulgusu

Önceki kurulum/audit incelemesindeki dağılım: **3 kritik, 10 yüksek, 9 orta,
1 düşük**. Bunlar paket kayıtlarıdır; aynı danışmanlık birden fazla üst pakette
raporlanabilir. `--omit=dev` sonucu tek başına canlı Worker'a erişilebilirlik
kanıtı değildir. Yeni bir audit sonucuyla yeniden doğrulanmadan giderilmiş
sayılmazlar.

| Derece | Paketler ve güvenli çözüm yönü (ayrı onaylı iş) |
| --- | --- |
| Kritik (3) | `oxfmt` → `tinypool`: araç zincirini uyumlu sürümlerle yükselt, `tinypool >=2.1.2`; `proxy-addr`: `>=2.0.8`, shadcn/MCP/Express zincirini kontrol et. Araçların güvenilmeyen girdilerle çalıştırılmasını ayrıca değerlendir. |
| Yüksek (10) | `@modelcontextprotocol/sdk >=1.32.0`; `body-parser >=2.4.0`; `brace-expansion >=5.0.12`; `miniflare` (Sharp/Undici zinciri); `shadcn` (SDK/Zod zinciri); `sharp >=0.35.5` ve kök override; `source-map-js >=1.2.2`; tüm `undici` kopyaları `>=7.30.1`; `vite >=8.2.4`; `zod >=4.6.6` için tüketiciyle birlikte kontrollü ana sürüm geçişi. Bunlar önceki audit anındaki düzeltme alt sınırlarıdır; uygulama günü yeniden doğrulanır. |
| Orta (9) | `@cloudflare/vite-plugin`, `wrangler`, `fast-uri >=3.1.9`, `hono >=4.13.11`, `ip-address >=10.7.4`, `qs >=6.16.1`, `satori`, `@vercel/og`, `vinext`. Cloudflare üçlüsü ve OG/framework zincirleri birlikte uyumluluk denetimi ister. React eş sürüm şartlarını kontrol et; audit'in önerdiği ana sürüme körlemesine geçme. |
| Düşük (1) | `deepmerge`: önceki incelemede yayımlanmış yamalı sürüm yoktu. Üst bağımlılık/CLI ayrıştırma veya upstream çözümünü takip et; kullanılmayan bileşeni kaldırma ayrı karardır. |

Önerilen düzeltme sırası: (1) Vite ve formatter/tinypool, (2) shadcn ve
MCP/Express/Zod zinciri, (3) Cloudflare eklentisi/Wrangler/Miniflare ve
Sharp/Undici, (4) kalan geçişli bağımlılıklar, (5) OG/Vinext zinciri ve
deepmerge için çözüm. Her grup sonrası kilit dosyasını gözden geçir, temiz
kurulum, typecheck, test, build ve ilgili runtime kontrollerini çalıştır.
Mevcut CSS üretimini, güvenlik başlıklarını ve kayıtları koru; otomatik
`npm audit fix --force` kullanma.

## Henüz doğrulanmamış konular

Hedef portal, SDK sürümü, reklam sağlayıcısı, gelir modeli, yaş grubu ve hukuki
gereksinimler belirlenmedi. Gerçek portal iframe'i, üçüncü taraf çerezleri,
fiziksel Android, uzun oturum, WAN ve ölçek/maliyet sonuçları bu planla
doğrulanmış sayılmaz. Mevcut açık işler arasında hesap/kurtarma, ortak maden,
uzak bağımsız ortak keşif ve çok günlük ekonomi testi vardır.

## İlk aşamanın uygulama durumu

Türkçe/İngilizce altyapısı ve 1.310 girdilik iki sözlük uygulandı. Başlangıç
ekranı ve ayarlarda kalıcı seçim; tarayıcı algılama; arayüz, katalog, konuşma,
olay/hata ve sahne etiketleri çevirisi vardır. Kayıt ve sunucu metinleri önceki
kanonik biçimlerini korur; görüntüleme dili her istemcide ayrıdır.

Typecheck, 193 test (185 mevcut + 8 yeni), build ve yerel dört istemcili
Worker/D1/DO/WebSocket kontrolü geçti. Statik çıktı 2.820.762 bayttır; 3 MB
bütçesi korunur. Tarayıcıda otomatik Türkçe, İngilizce seçim, yenilemede tercih
korunması ve açık ayar panelinde dil değiştirme kontrol edildi.

Bu sonuç portal yayını onayı değildir. 23 güvenlik bulgusu hâlâ açık;
bağımlılıklar değiştirilmedi. Yeni onboarding, portal SDK, reklam, analitik ve
prestij uygulanmadı. Mevcut `og-image.jpg` üzerindeki Türkçe pazarlama yazıları
için dil bazlı sosyal kartlar ve portal görselleri hazırlanmalı; oyun açılışında
metni canlı çevrilen SVG kullanılır. Fiziksel Android, hedef portal iframe'i,
gerçek WAN ve uzun oturum testleri bekliyor. Ayrıntılar: [i18n rehberi](i18n.md)
ve [doğrulama raporu](verification-portal-i18n.md).
