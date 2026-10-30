# How to Play — belge kaydırma düzeltmesi / alpha.3

Yerel codex/mobile-hud-recovery; canlı alpha.2'ye henüz yayımlanmadı.
Bu bağımsız CSS düzeltmesi HUD kodundan ayrı commit'tir.

## Kök neden / çözüm

app/globals.css oyun için html/body height:100% ve overflow:hidden tanımlar;
root layout aynı CSS'i /how-to-play'a da yükler. Canlı masaüstü örneğinde
2613px body,720px kilitli root ve scrollY0 görüldü. İçerik SSR HTML'de mevcut,
ancak normal kullanıcı kaydıramıyordu. Sorun eksik rehber metni değildi.

app/how-to-play/guide.css yalnız .field-guide varken html/body'yi height:auto,
min-height100%, overflow-y:auto ve doğal pan-y/pinch-zoom ile açar.
Arka plan da aynı koşula bağlandı. Yeni global listener veya JS scroller yok.
Oyun rotasına dönünce :has artık eşleşmez; önceki viewport/input kuralları
geçerli kalır. Field-guide sınıfı yalnız rehber rotasında bulunur.
CSP/nonce/SEO metadata/canonical/içerik/PWA cache koduna dokunulmadı.

## Gerçek tarayıcı kabulü

Yerel üretim Worker8952'nin son build'i; gerçek route DOM ve native scroll.
Masaüstü1280×800: başlangıç scrollY0; PageDown/tekerlek ile1500; Ctrl+End ile
1812.8. Son bağlantı y692.2–736.2,800px ekran içinde. Ctrl+Home başa döndürdü.

Üç mobil viewport'ta baştan aşağı gerçek sayfa kaydırması sonrası son bağlantı:

| Boyut | Son scrollY | Son bağlantı y aralığı | Yatay taşma |
|---|---:|---:|---|
|320×568|4746.4|446.4–504.2|Yok|
|390×844|3460.8|735.7–779.7|Yok|
|844×390|2222.4|282.6–326.6|Yok|

Son bağlantıya gerçekten basıldı; oyun başlangıcı açıldı, html/body overflow-y
hidden ve scrollY0 geri geldi. Gizli rehber kilidi oyun rotasına taşınmadı.
Game/world touch-action:none ve panel inputBlocked kodu değiştirilmedi;
HUD paketinin33 hit-test/Back döngüsü ve dört WS runtime kanıtı korunur.
Görseller: screenshots/guide-scroll-{320,mobile,landscape,desktop}.jpg.

Typecheck236/236 test, build ve HTTP doğrulaması başarılı. Statik2,968,790 bayt;
3MB bütçe korunur. Son test17.18s. Loglar work/final-hud-guide-*.log,
work/guide-{build,http}.log. Dört WS runtime aynı Game/Engine/sunucu kodu için
HUD commit'inde geçti; bu sonraki fark yalnız route CSS'i ve belgelerdir.
Bağımlılık/şema/ekonomi/üretim verisi değişmedi. Fiziksel Android/iOS parmakla
kaydırma ve PWA dinamik viewport kabulü henüz yapılmadı; masaüstü viewport
kanıtı fiziksel cihaz testi sayılmaz.

Kod checkpoint'i `07760aa67e437bf2af8c0902e18f48e0fcdc1e39`.
