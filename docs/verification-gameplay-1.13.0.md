# 1.13.0 — Gameplay Foundation doğrulaması

29 Ekim 2026, `C:\Users\devbu\Roamcroft`, dal `codex/gameplay-foundation-1-13`.
Kullanıcı 29 Ekim 2026'da 1.13.0 için başarılı birleşim sonrası kontroller
koşuluyla normal main push ve Cloudflare yayınına açık onay verdi. Yayın
sonucu GitHub Workers Builds ve canlı sürüm ile ayrıca eşlenir.

## Taban ve gerçek canlı sürüm

GitHub main ve UI dalı `6aa0e7407640e848a3e8c5b7b1e39515f938a669` olarak
kontrol edildi. Aynı SHA için GitHub verify ve Cloudflare Workers Builds başarılı;
Cloudflare sürümü `1fa63630-edbe-4220-9709-b9c124cc6af0`. Canlı ana sayfa HTTP
200, 1.12.0 ve Sentry CSP izni yeniden doğrulandı. Yerel yeni dalda ilk araştırma
checkpoint'i `9124e06`. 1.13.0 için gereken ayrı yayın onayı artık alınmıştır.
Uygulama/test checkpoint'i `a1f7c80`; belge/görüntü teslimi ayrı commit'tir.
Geliştirme dalının son SHA'sı Git günlüğü/GitHub dalından okunur. Geliştirme
dalına yedek push, main yayın izni sayılmaz; Cloudflare sürüm oluşturması da
tek başına aktif üretimin değiştiğini kanıtlamaz.

## Uygulanan sınırlı paket

- Mevcut el kitabında TR/EN İlk Adımlar; yedi earned stats/claimed tabanlı
  hedef ve seçilebilir açıklama. Hareket anlatılır; tarihsel hareket/sulama
  sayacı olmadığı için bunların tamamlandığı uydurulmaz. Ekim adımı yalnız
  plant sayar; sulama açıklaması ve ayrı sulama aracı seçimi vardır.
- Araç seçme yalnız seçimi değiştirir; üretim/satış/inşa düğmesi ilgili menüyü
  açar. Yeni ödül, görev kilidi, otomatik alışveriş/üretim veya yol eylemi yok.
- HUD düğmesi isteğe bağlıdır; `roamcroft.guidance.v1` tercih anahtarı save
  payload'ından ayrıdır. Kapalı tercih yenilemede kalır; Ayarlar'dan rehber
  yeniden açılır. Eski claimed görevler eksik sayaç yüzünden yeniden istenmez.
- Altı araç için mevcut enerji, güç/hasar ve kullanım notları; tier/yetenek
  faydaları salt okunur. Engine'in onaylı olayındaki mevcut kazanım mesajına
  ikon/vurgu eklenir. İstemci tıklamasına optimistik ganimet/hasar efekti eklenmez.
- Mobil adım seçiminde açıklama başlığına odak; Tab eylem düğmesine ilerler.
  Panel geçişi yalnız opaklıktır; yön değişiminde konum tween'i paneli kısa
  süre ekran dışına taşımaz. Mevcut ses/parçacık/oyuncu animasyonu korunur.

## Otomatik doğrulama

Windows taşınabilir Node **22.13.0**, npm **10.9.2**. Sistem kurulumu yapılmadı.

| Kontrol | Sonuç |
| --- | --- |
| npm ci | Başarılı; 584 paket kuruldu, 585 tarandı. |
| typecheck | Başarılı, tsc --noEmit, exit 0. |
| npm test | **205/205**, 0 başarısız/atlanan; son koşu yaklaşık 15,70 saniye. |
| build/finalize/bütçe | Başarılı; 2.950.066 ham bayt; 1.587.422 sıkıştırılmış tahmin; bütçe 3.000.000 bayt. |
| i18n eşliği | 1.375 anahtar, yer tutucu/tip/manifest denetimi başarılı. |
| Karşılaştırmalı ilk oturum | 3 seed × 2 profil tamamlandı; gerçek Engine, mevcut ödül ve atomiklik kuralları. |

Yedi yeni test: başlangıç stoklarının earned sayaç sayılmaması ve sıra dışı
ilerleme; rehber açılışının eski kayıt payload/checksum/upgrades'i koruması;
tüm vigor ve tier kademelerinde enerji/güç ve toplam kaynak korunumu; mevcut
kılıç hasarı/enerji; ACK almamış guest eyleminde sıfır ilerleme/receipt; tercih
depolama arızası; iki seed'de iki profil/geri yükleme/replay sonrası ödül tekliği.

İki geliştirme hatası düzeltildi: testin savedAt zamanını eşit beklemesi ve
testte tool union türünün power alanına erişim için daraltılmaması. Üretim
doğrulaması gevşetilmedi; son koşular başarılıdır.

`npm run check:runtime` **başarılı (exit 0)**: yerel üretim Worker/D1/DO,
HTTP HTML nonce/başlık/statik/service worker/404/oturum/CORS, dört gerçek WS
istemcisi, 50–300 ms enjekte gecikme ve paket kaybı, kayıp yanıt tekrarı,
üretim/malzeme atomikliği, 15 saniye host toleransı, Worker restart ve yeniden
bağlanma, harici D1 revision çakışmasında durma ve ortak uyku oylaması geçti.
Bu yerel sentetik WAN testidir; gerçek internet/çok fiziksel cihaz testi değildir.
Test verisi canlı D1/DO'ya yazılmadı. Loglar Git dışındaki work klasöründedir.

## Gerçek tarayıcı kontrolü

Yerel üretim Worker `127.0.0.1:8940/8941`; canlı çiftlikte test yapılmadı.

| Görünüm | Gözlem |
| --- | --- |
| 1440×900 | Ortalı rehber `[280,125,880,650]`, yatay taşma yok. |
| 390×844 | `[6,6,378,832]`, birincil araç düğmesi ve kapatma erişilebilir. |
| 320×568 | `[6,6,308,556]`, body clientWidth=scrollWidth=296. Son adım seçilince başlık odağı ve eylem görünürlüğü doğrulandı. |
| 844×390 | `[6,6,832,378]`, taşma yok; 44×44 kapatma ve kaydırarak/Tab ile sulama seçimine erişim. |

Rehberden balta seçimi öncesi/sonrası çanta aynı, altın 180 kaldı. Yerel
WebMCP üzerinden tek gerçek Engine toplama eyleminden sonra odun **25→28**, lif
**10→11**, mesaj **+3 Wood**, rehber **3/12** gözlendi. Rehber/menü zamanında
simülasyon durdu. HUD tercihi kapatılıp yenilendi; Ayarlar'da kapalı kaldı ve
yeniden açıldı. Açık panelde Türkçe diline geçildi, altı araç notu/enerji ve
kılıç 18 hasar metni görüldü. Form alanları ve 1.12.0 menü klavyesi korundu.
Tarayıcı hata kaydı boştu. Geçici sekmeler/viewport ve önizleme kapatıldı.

Görüntüler: `docs/screenshots/gameplay-1.13.0-desktop.jpg` ve `-mobile.jpg`.
Bunlar gerçek yerel geliştirme görüntüleridir; fiziksel iPhone/Android veya
1.13.0 canlı yayın kanıtı değildir. Gerçek oyuncu/WAN, joystick/pinch donanımı,
ekran klavyesi, çentik ve PWA yaşam döngüsü bu çalışmada doğrulanmadı.

## Ekonomi, güvenlik ve kalanlar

[Ekonomi raporu](gameplay-foundation-1.13.0.md): 94 eşya/180 altın mevcut
başlangıca karşı yalnız deneyde 34 eşya/60 altın. Otomatik ilk atölye rotası
4→9 kaynak vuruşu ve 17,7→21,0–22,6 simülasyon saniyesidir; insan oyuncu
süresi değildir. Erken görev ödülü 120 altın, iki seviye 75 altın ve enerji
yenilemesi sağlar. Salt stok azaltma dengeyi çözmüş sayılmaz; gerçek ekonomi
ve eski kayıtlar değiştirilmedi. Deney profili runtime tarafından import edilmez.

Audit yeniden **25**: 3 kritik/10 yüksek/11 orta/1 düşük. Paket/kilit diff'i
uygulama sürümü dışında bağımlılık değişikliği içermez. Kritik formatter ve
shadcn/MCP/Express yollarında yeni doğrudan Worker yolu saptanmadı; bu kapsamlı
istismar denetimi veya sıfır risk iddiası değildir. Sentry/CSP/mahremiyet filtresi,
Engine/save ve online kaynaklarında fark yoktur. Güvenlik düzeltmesi ayrı iştir.

[1.14.0 sözleşmesi](inventory-hotbar-1.14-design.md) yalnız tasarımdır.
Gerçek hotbar/ekipman/göç, başlangıç profili yayını, ekonomi yeniden dengesi,
Living World/Online 2.0 uygulanmadı. Önce TR/EN yeni oyuncu ölçümü ve onaylı
denge kararı, ardından ayrı görevle güvenli 1.14.0 geliştirmesi. Bu yayın
oturumunda yeni özellik veya 1.14.0 geliştirmesi yapılmaz.
