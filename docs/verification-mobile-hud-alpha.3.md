# Mobile HUD & Game UX Recovery — 1.14.0-alpha.3

30 Ekim; dal `codex/mobile-hud-recovery`, taban canlı alpha.2/main914bde9.
Yalnız yerel geliştirme. Bu paket için production/main push izni yok;
non-main Cloudflare politikası bilinmediği için dal push edilmez.

## Uygulanan dar paket

- `lib/ui/notices.ts` sunum sırası: aynı anda tek bildirim, en fazla iki bekleyen;
  tekrarlar ×N sayacıyla birleşir, süre uzamaz. Normal 1.8s, uyarı2.4s,
  kutlama3.2s; altı saniyeden eski bekleyen mesaj atılır. Yeni uyarı mevcut
  mesajın ardından öncelik kazanır. Görsel en fazla iki satır, pointer-events:none;
  tam metin ARIA status içinde kalır. Engine olayları/ses/partiküller korunur.
- Büyük Keşfet/Hotbar bindings mobil alt satırı kaldırıldı. Keşfet44×44 el
  düğmesinde; bağlama Çanta → seçili eşya → Hotbar bindings içindedir.
  Çanta simgesi eski yerinde ve44px. Masaüstü bağlama/kullanma kısayolu korunur.
- Yan panel kontrolü mobilde44×44 kitap+ok; aria-expanded ve aç/kapat etiketi
  korunur. Dokuz gerçek referans48px masaüstü/44px mobil, kontrollü yatay kaydırma;
  seçili yuva ResizeObserver ile görünür tutulur. Yeni mekanik/şema yok.
- Mobil menü başlığı48px, çanta en fazla540px; eşya58px, detay/bağlama yan yana,
  depo stok listesi sınırlı kaydırma. X48px, alternatif Kapat104×44 korunur.
  Back/history serialization, inputBlocked ve TouchAction değiştirilmedi.

## Gerçek tarayıcı kanıtı

Yerel üretim Worker8952, Three.js Game ve mevcut Panels/CSS kullanıldı.
390×844 gerçek çantadan ekmek yuva9'a bağlandı; seçim miktarı değiştirmedi;
mevcut Kullan ile3→2. Kayıtlı çıkış tamamlandı; fixture parametresi olmadan
normal cihaz kaydı tekrar açılınca180 altın/2 ekmek ve yuva9 bağı korundu.
Türkçe ve İngilizce HUD/bildirim/bağlama yolu görüldü. Test origin'i yereldir.

320×568,390×844,844×390: dokuz yuva44×44; seçili9 bar içinde görünür,
Keşfet44×44; sayfa yatay taşması yok; hotbar/joystick/eylem kutuları kesişmiyor.
320: hotbar330–394y, joystick412–540y, eylem404–540y.
390: hotbar606–670y, joystick688–816y, eylem680–816y.
844: hotbar227–617x/312–376y, joystick24–152x, eylem756–820x.
Masaüstü1280×800 gerçek sahne/1–9/Keşfet/bağlama çalıştı.

`check-menu-touch.mjs` gerçek Base UI hit-testing + sentetik touch/pointer
ile her boyutta11, toplam33 döngü PASS: X merkez/köşe hedefleri, açılan
navigasyon, alternatif Close, Back, Escape, depo keşfi, yiyecek seçimi ve
350ms geciken Back ardından hızlı yeniden açma. Engine save payload değişmedi.
Sentetik dokunma fiziksel Android kabulü değildir. Kullanıcının alpha.1 fiziksel
X/girdi/depo kabulü geçerlidir; bu yeni HUD için telefon kabulü bekliyor.

Görseller `docs/screenshots/hud-recovery-*`: before-mobile canlı alpha.2;
after/notice/bag/320/landscape/desktop yerel alpha.3 gerçek oyun görüntüleridir.
Yerel test sahnesinin saati/hareketli NPC konumu farklıdır; mockup değildir.

## Otomatik doğrulama

Node22.13.0/npm10.9.2. İlk yeni test, serialize savedAt zamanını karşılaştırdığı
icin hata verdi; payload eşitliğiyle düzeltildi. Kayıt kodu değiştirilmedi.
Son typecheck236/236 test ve build başarılı; statik2,968,615 bayt,
3,000,000 sınırı değişmedi. Dört WS yerel runtime çıkış0: HTTP/nonce/CSP/SEO,
stok atomikliği/sahiplik,50–300ms hata enjeksiyonu/reconnect/Worker restart,
D1 çatışması ve ortak uyku geçti. Loglar work/hud-{typecheck,tests,build,runtime}.log.
Build ilk tekrarında açık Wrangler önizlemesi dist/client'i kilitledi (EBUSY);
önizleme kapatılıp aynı build başarılı tekrarlandı. Kontroller gevşetilmedi.
Bağımlılık sürümleri değişmedi; package/lock yalnız uygulama alpha.3 sürümü.

Açık: fiziksel Android portre/yatay, iOS/PWA/dinamik adres çubuğu/safe area,
uzun oturum ve gerçek WAN. Inventory2.0 stack/drag-drop/equipment yapılmadı;
yeni büyük UI sanat paketi veya vahşi yaşam genişlemesi bu yamaya dahil değil.
