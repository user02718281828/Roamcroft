# Domain, SEO ve marka — geliştirme adayı / 29 Ekim 2026

Taban hotfix `c1dec4f`; dal `codex/mobile-menu-fix-1-13-2`. Main/canlı
`a182541` / 1.13.1 değişmedi. Bu paket üretime yayımlanmadı.

## Uygulama ve oyuncu etkisi

- `lib/site.ts` ve layout: resmî canonical/metadataBase/OG/Twitter
  `https://roamcroft.com`; gerçek WebSite/VideoGame JSON-LD, istek nonce'ı.
  Derecelendirme, oyuncu sayısı veya çıkış tarihi uydurulmadı.
- `/robots.txt`, iki gerçek URL içeren `/sitemap.xml`; uydurma lastmod ve
  sahte hreflang yok. `/how-to-play` gerçek SSR HTML içinde EN ve TR rehberdir:
  ilk gün, kontroller, sandık/depo, co-op sınırı ve origin/kayıt güvenliği.
  Ana ekranın görünür HTML'sinde açıklama/rehber/aktarım uyarısı vardır.
- API yanıtına `X-Robots-Tag:noindex, nofollow`; kimlik, CSP, Sentry, CORS ve
  yetkilendirme gevşetilmedi. Robots bir güvenlik sınırı olarak sunulmaz.
- Kullanıcının dokuz `assets/brand-candidates` dosyası kaynak olarak korunur;
  16/32/48 favicon, ICO, 192/512 PNG, güvenli alanlı maskable512,
  Apple180, OG1200×630 ve 900×507 WebP logo teslim kopyaları hazırlanır.
  Tekrar üretim: `node scripts/prepare-brand.mjs`. Marka illüstrasyonu oyun
  ekran görüntüsü değildir. `assets/og.svg` ve eski favicon.svg korunur.
- Manifest kimliği, scope ve start_url `/` kalır. İkon URL'leri sürümlenir;
  eski origin kapatılmaz/yönlendirilmez. API/WS göreli kalır. IndexedDB,
  localStorage ve __Host çerezi kendiliğinden taşınmaz. Yerel JSON yalnız
  cihaz çiftliği içindir; sunucu sahipliği otomatik göç ettirilmez.
- İkinci HTML rotası için SW navigasyonu URL yoluyla saklanır; rehber artık
  `/` oyun önbelleğini ezemez. API/RSC önbellek dışı kalır.
- 3MB bütçe artırılmadı; ICO da sayıma alındı. Dört mevcut atlas aynı
  768×768/hücre yerleşimiyle teslim için WebP55 kodlandı: 745,048 → 549,988
  bayt. Orijinaller `c1dec4f` Git geçmişinde ve yerel work yedeğinde bulunur.
  Marka kopyaları sonrası tüm build yaklaşık 2.93MB; kayıplı sıkıştırma
  ikon tasarımını/miktarı değiştirmez, küçük görüntüde görsel kabul ayrıca yapılır.

## Kontroller ve sınırlar

Son birleşik tur: typecheck, **215/215 Node testi**, build başarılı.
Build 2,932,731 bayt civarında (ICO dahil), tahmini aktarım 1.55MB.
İlk yeniden build açık yerel preview nedeniyle EBUSY aldı; preview durduruldu,
aynı build başarılı tamamlandı. Doğrulama gevşetilmedi.
Yerel dört oyunculu `check:runtime` başarılı: yeni rehber/canonical/JSON-LD
nonce/ikon MIME–200 kontrolleri, eski HTTP güvenlik, atomiklik, dört WS,
kayıp/tekrar/reconnect/restart, D1 çakışması ve ortak uyku. İlk canonical
assertion'ı Vinext'in kök URL son slash normalleştirmesine takıldı; artık
URL eşdeğerliği sınanır, canonical zorunluluğu korunur.

Canlı, veri değiştirmeyen kontroller: yeni kök HTTP200/1.13.1, www HTTP301
`https://roamcroft.com/`, eski Worker HTTP200/1.13.1. İlk DNS hatasından sonra
tekrar erişim başarılı. Tek curl isteğinde yeni kök TTFB 0.517s; kalıcı
performans sonucu değildir. DNS, TXT, Google ve Worker ayarı değiştirilmedi.

**DOĞRULAMA EKSİK:** yayımlanan yeni robots/sitemap/metadata/marka HTTP kabulü;
Google indeks/sıralama; Lighthouse/LCP/INP/CLS ve gerçek kullanıcı verisi;
fiziksel Android/iPhone/PWA kurulum/çevrimdışı/yükseltme, eski gerçek kullanıcı
kaydı ve yeni origin'de gerçek WAN. Canlıda yeni çiftlik/oda/oyuncu verisi
oluşturulmadı; dört oyuncu yalnız izole yerel D1/DO'da sınandı.

Search Console domain doğrulaması ve ilk indeks isteği kullanıcıca zaten
tamamlandı. Yayın/onay sonrası sitemap HTTP200 doğrulanıp Search Console'a
`https://roamcroft.com/sitemap.xml` gönderilir; tekrar mülk veya ana sayfa
indeks isteği açılmaz. [Google'ın sitemap belgesi](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
gönderimi indeks/sıralama garantisi olarak tanımlamaz.

## Yayın kapısı

A+B ayrı geri alınabilir commit'lerdir. Main'e push/Cloudflare için açık yeni
onay gerekir. Rollback tabanı `a182541045dfab06cef39a42e20954c085cecd23`;
yalnız kaynak/Worker sürümü geri alınır, üretim DB geri alınmaz/sıfırlanmaz.
Fiziksel X/Back ve kayıt kabulü eksikliği yayın kararında açıkça belirtilir.
