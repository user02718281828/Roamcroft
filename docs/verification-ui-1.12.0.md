# Roamcroft 1.12.0 — UI temel paketi doğrulaması

29 Ekim 2026, Windows; Node **22.13.0**, npm **10.9.2** taşınabilir araç zinciri.
Çalışma alanı `C:\Users\devbu\Roamcroft`, dal `codex/roamcroft-2-ui`.
Bu belge tüm Roamcroft 2.0 hedeflerinin tamamlandığını iddia etmez.

## Kurtarılan çalışma ve kapsam

- i18n GitHub yedeği `38b4f93` korunmuştur. Önceki 28 kaynak/belge değişikliği,
  Sentry'nin kullanıcı tarafından yerelde eklenen kopyası dahil, `fa20119`
  yerel kontrol noktasıyla korundu. Reset/clean/force kullanılmadı.
- `CampNavigation`, `InventoryPanel`, `ui-v2.css`, `lib/ui` yardımcıları,
  kompakt Game HUD'u, master plan, README/TR ve 4 UI testi korunup tamamlandı.
- Masaüstü modal 880×650 üst sınırında ortalanır; mobilde güvenli alanlara
  göre 6 piksel payla yerleşir. Sidebar grupları, mobil yerel seçici ve ayrı
  içerik kaydırması var. Eşya yuvaları seçim/ayrıntı gösterir; miktar ve kapasite
  değişmez. Filtre/sıralama yalnız görünümü değiştirir.
- Mobil görev başlığının dar yan sütunda harf harf görünmesi düzeltildi.
  Hayati değerler korunur; profil sayacı yalnız `?profile=1` ile görünür.
- Tab kapalı menüyü açar; açık menüde doğal odak dolaşımını korur. Esc kapatır;
  Q/E bölüm değiştirir. Form/select alanlarında oyun kısayolları çalışmaz.
- İlk ziyaret İngilizce, açıkça kaydedilmiş TR/EN önceliklidir. 1.333 anahtar,
  sözlük/yer tutucu eşliği; kalan bir istasyon `gerekli` etiketi de çevrildi.
- Engine, ekonomi, SAVE_VERSION=1 ve ağ protokolleri değiştirilmedi. Gerçek
  hotbar/equip/drag-drop uygulanmadı; veri ve göç tasarımı master plandadır.

## Otomatik kontroller

UI dalındaki kurulum başarılı: 584 paket, 585 taranan paket. Typecheck,
**198/198 test (0 başarısız/atlanan)**, build ve yerel runtime geçti.
Son birleşimden sonra aynı kontroller yeniden çalıştırılır; teslimdeki kesin
SHA ve CI durumu GitHub commit kontrolleri ile eşlenmelidir.

Runtime, gerçek yerel üretim Worker/D1/SQLite DO ve dört WebSocket istemcisiyle
HTTP başlık/HTML nonce/statik varlık/service worker/oturum/CORS, ekonomik
atomiklik, kayıp ACK/replay, gecikme/paket kaybı, host toleransı, Worker restart,
harici D1 revision çakışmasında durma ve ortak uyku oylamasını sınar.
Canlı oyuncu veritabanına fikstür yazılmaz. Yerel ölçüm gerçek WAN kanıtı değildir.

Yeni testler: saf çanta görünümü stok/checksum/aletleri değiştirmez; taşmış
bilinen eski stok korunur; geçersiz eşya ithali reddedilir; eylem önizlemesi
miktar üretmez; çevrimdışı/online gezinme; mahremiyet filtresinde veri sızıntısı.
CSP testi yalnız mevcut tek Sentry ingest origin'inin ek iznini doğrular.

## Görsel ve etkileşim kontrolleri

Yerel üretim Worker, ayrı `127.0.0.1` origin'leri ve gerçek tarayıcı kullanıldı.

| Görünüm | Gözlenen sonuç |
| --- | --- |
| 1440×900 | Modal `[280,125,880,650]`; gruplu nav ve çanta ayrıntısı. |
| 390×844 | Modal `[6,6,378,832]`; ekran içi kapatma/bölüm/eylem. |
| 844×390 | Modal `[6,6,832,378]`; içerik kaydırmasıyla Use düğmesine erişildi. HUD görev başlığı kısa şeritte. |
| 320×568 | Modal `[6,6,308,556]`; 11 menü tarandı. Ayarlar switch dokunma alanının 1 px taşması düzeltildi; tekrar ölçüm clientWidth=scrollWidth=296. |

Ekmek yuvası seçildikten sonra miktar **3**, çanta **94** kaldı. Yalnız Use
düğmesiyle miktar **2**, toplam **93** oldu. İsim alanında Ctrl+A ile 5/5
karakter seçildi; `user-select:text`. Dil Türkçeye çevrilip sayfa yenilendiğinde
Türkçe korundu. Tab odağı Bag → Production taşıdı, menü kapanmadı; E ile
Production bölümü, Esc ile dünyaya dönüş doğrulandı. Tarayıcı hata kaydı boştu.

Gerçek yerel görüntüler `docs/screenshots/ui-1.12.0-*.jpg` altındadır. Eski
1.3 görüntüleri tarihsel diye etiketlendi. Mobil viewport, iPhone Safari veya
fiziksel Android testi değildir. Çentik, ekran klavyesi, PWA yaşam döngüsü,
joystick/pinch ve gerçek cihaz tam ekranı ayrıca doğrulanmalıdır. Kullanıcının
BrowserStack iPhone 15 Pro testi önceki canlı sürüme aittir.

## Sentry ve güvenlik

Güncel main `1e302c3`: mevcut Sentry 11.10.0 bağımlılığı ve tek ingest CSP izni
korunur. main'e göre lockfile farkı yalnız uygulama sürümüdür; bağımlılık
yükseltilmedi. Browser hata filtresi izin verilen alanları yeniden kurar:
hata türü, sürüm ve statik kod dosyası/satır/sütun. Serbest hata mesajı,
kullanıcı, request, URL query/hash, breadcrumb, extra/context, yerel değişken
ve ekler çıkarılır. Replay/tracing kapalı; otomatik oturum/breadcrumb/console
entegrasyonları kapalı. Ayrıntıları gizlemek tanılamanın hassasiyetini azaltır;
oyuncu verisini göndermekten kaçınmak için bilinçli tercihtir.

Tarihsel audit **23**; güncel `npm audit --json` **25 paket bulgusu**:
**3 kritik / 10 yüksek / 11 orta / 1 düşük**. Düzeltilmedi. Araç zinciri ile
canlı Worker erişilebilirliği ayrı incelenmelidir; bu sonuç güvenlik garantisi
veya portal yayını onayı değildir. `audit fix`, major yükseltme ve CSP gevşetme yok.

## Teslim ve kalanlar

Geliştirme dalı yedeği → güncel main/Sentry birleşimi → tekrar typecheck/test/
build/runtime → GitHub CI → yalnız başarılı paketin normal main push'u sırası
uygulanır. Güncel kullanıcı talimatı bu doğrulanmış paket için otomatik yayına
izin verir. Canlı sürüm kanıtı, yalnız ana sayfa HTTP 200 değil; GitHub Workers
Builds SHA'sı, 1.12.0 açılışı ve gerçek oyun ekranıdır. Test belgesi tek başına
üretime çıkış kanıtı değildir; kesin yayın sonucu teslim raporunda belirtilir.

Eksikler: fiziksel iOS/Android ve PWA, gerçek WAN/çok cihaz, uzun oturum,
tam editoryal İngilizce, sosyal paylaşım JPG'si, 25 güvenlik bulgusu ve tüm
gerçek hotbar/ekonomi/köy/savaş/Online 2.0/portal/gelir hedefleri. Sonraki somut
iş: ilk 30 dakika yeni oyuncu ölçümü ve yalnız yeni dünyalar için başlangıç
ekonomisi/araç hissi tasarımı. CodeScene bakım işi ayrı planlandı.
