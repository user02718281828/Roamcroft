# Emergency Quality Recovery — 1.14.0-alpha.3 / yerel yayın adayı

30 Ekim 2026. Tek ilerleyen dal `codex/quality-recovery`; önceki
`codex/mobile-hud-recovery` geçmişi korunarak devam edildi. Kod: CPU/orman
`3130162`, GPU/rüzgâr `0eeb521`, HUD/yerleşim `81b79f4`.
Canlı main/origin/main `914bde9360078576eee0a51bf70295e4de3f45b7` / alpha.2;
bu oturumdaki fetch ve GitHub kontrolünde verify/Workers Builds success.
Main ve önceki alpha.3 checkpoint `804780b` bu adayın atasıdır; paralel ürün yok.
Push/deploy yapılmadı. Non-main otomatik deploy politikası hâlâ bilinmiyor;
production için yeni kullanıcı onayı gerekir.

## Tamamlanan düzeltmeler

- Ağaçlarda mevsim/tür başına paylaşılan renkli geometri, bölge sınırıyla
  hiyerarşik frustum eleme ve bütçeli habitat taraması. Türler, kaynak kareleri,
  seçim/çarpışma, mevsim renkleri ve yaprak rüzgârı korunur. Yeni içerik yok.
- Sıfır yüksekliğe indirilmiş 3.600 ot örneği yerine yalnız canlı örnekler
  GPU'ya gönderilir; streaming/modulo yuva kimliği ve temizleme korunur.
- Oyun HUD yerleşimi tek `hud.css` kaynağında; eski çakışan kurallar kaldırıldı.
  Küçük bildirimler, altın/vitaller ve üç yardımcı kontrol; gizli minimap çizilmez.
  Dar ekranda gerçek dokuz yuvalı 3×3 palet, geniş yatayda dokuz yuva birlikte.
  Çantada filtre/sıralama iki yerel kontrol, yatayda ayrıntılar ayrı sütunda.
- 320px inşa/ekim çubuğunun aşırı genişliği ve küçük yatay ekranın yanlış
  dikey yerleşimde kalması düzeltildi. İnşa döndür/köşe/iptal 44×44, gerçek
  hit-test başarılı. Tohum adları ve seçili durum ekran okuyucusuna açık.
  Tehdit göstergesi aynı kılıç/odak eylemiyle başlıkta; dinlenme kontrolü
  doğru adı/durumu gösterir. Rehber ve tam ekran ana menüden erişilebilir.

## Karşılaştırılabilir performans kanıtı

[Ham kayıtlar](quality-recovery-measurements.json): aynı AMD Radeon/ANGLE,
seed84621, 1280×720, DPR1, dengeli kalite, başlangıç kamera, gündüz/kuru hava,
çiftlik hayvanı0/vahşi aktör8, gerçek Game'de iki 30 saniyelik kayıt.
Önce: `804780b` orman kodu (canlı alpha.2 ile aynı). Sonra: bu adayın çizim kodu;
son bağlamsal HUD/ARIA düzeltmeleri ölçümden sonra yapıldı, çizim değişmedi.
Saat ve animasyon fazları birebir kilitli değil; tek geçiş, garanti değil.

| Ölçüm | Önce | Sonra |
| --- | ---: | ---: |
| CPU RAF p95 | 2,70 ms | 1,00 ms |
| GPU p95 | 3,46 ms | 2,21 ms |
| Sahne eşitleme p95 | 2,90 ms | 1,20 ms |
| Üçgen | 334.464 | 278.842 |
| Draw call | 68 | 70 |
| Ortalama FPS | 143,23 | 143,73 |
| Kare aralığı p95 | 7,30 ms | 7,10 ms |

Yaklaşık144Hz sınırı nedeniyle ortalama FPS anlamlı artmadı; CPU/GPU yükü
azaldı. Fiziksel telefon FPS'i ölçülmedi. Ayrı Node sahne/culling deneyi
1.13.1/önce/sonra içerir; GPU/FPS veya bütün oyun süresi olarak yorumlanmaz.

## Son kabul ve doğrulama

Node22.13.0/npm10.9.2; final typecheck, **239/239 test**, build ve i18n
1436 anahtar/parametre kontrolü başarılı. Statik2.959.920 bayt <3.000.000.
Ot gizleme/streaming, döndürülmüş frustum sınırı, model paylaşımı/dispose,
eski kayıt/üretim/depo/online testleri dahil. Bağımlılıklar güncellenmedi.
Yerel loglar: `work/quality-final-{typecheck,tests,build,runtime}.log`.

Final `check:runtime` çıkış0: HTTP/CSP/nonce/CORS/SW, dört yetkili WS,
50–300ms gecikme/kayıp/tekrar/reconnect, host toleransı ve Worker restart;
DO ekonomik atomikliği, özel çantalar/sahiplik, D1 dış revision koruması,
soğuk D1 eşzamanlı yazma ve ortak uyku/tek şafak başarılı. Gerçek WAN değildir.

Gerçek üretim build'i/yerel Game: masaüstü1280×720, mobil tarayıcı
320×568,568×320,844×390 görüntüleri ve inşa/ekim geçişleri kontrol edildi.
Karakter/joystick/eylem açık; tohum seçimi, döndürme0→90, düz→L köşe,
iptal ve çantadan inşaya dönüş çalıştı. Eski alpha.3 yerel kayıt tekrar
açıldı:180 altın,16 odun,14 taş,2 ekmek,1.200 depo kapasitesi ve yuva9 bağı.
Gerçek kayıt ACK'siyle başlangıca dönüş de geçti.

Devam eden aynı kabul oturumunda: native WASD/uzak koordinata yürüme,
ağaç toplama25→28 odun, normal maliyetle sandık13,17, depoya10 koy/al,
yuva9 ekmek3→2 kullanım, Narin sohbeti ve dünya penceresi kayması doğrulandı.
Bunlar yalnız yerel QA çiftliğinde; üretim verisi kullanılmadı.

Final CSS ile gerçek Panels/hit-testing ve sentetik touch/pointer:
320×568,390×844,844×390'da toplam33 menü döngüsü PASS (X/köşeleri,
alternatif Close, Back/Escape, navigasyon/depo/yiyecek, gecikmiş Back + hızlı
yeniden açma). Yeni hotbar regresyonu320×568/390×844/568×320'de dokuz
44px hedef, stok tüketmeden seçim, Back/Escape/dışarı/resize kapatma PASS;
native Tab palet içindeki ilk yuvaya odaklandı. Save payload değişmedi.

Görseller `screenshots/quality-recovery-*`: gerçek yerel alpha.3 ekranlarıdır;
gece sahnesi dahil, profil/debug kapalı. Mockup veya fiziksel Android değildir.
Motor/kayıt şeması, ekonomi, sunucu protokolleri, D1/DO, Sentry ve CSP
değişmedi. `SAVE_VERSION=1` ve eski kayıt anahtarları korunur.

## Yayın kapısı / sonraki oturum

Teknik yerel aday tamamlandı; yeni özellik başlatılmasın. **Eksik:** fiziksel
Android portre/yatay inşa/ekim/palet/X/Back, joystick/pinch ve kayıt dönüşü;
orman performansı/ısı/uzun oturum, dinamik adres çubuğu/safe-area, iOS/PWA ve
gerçek WAN/çok cihaz. Önce cihaz kabulü, ardından ayrı main/Cloudflare onayı.
Yayın olmadığından yeni GitHub CI/Cloudflare sonucu yoktur. Geri alma yapılmadı;
çalışan canlı referans alpha.2/914bde9, eski uygulama referansı alpha.1/3331e6a.
Üretim veritabanı hiçbir rollback kapsamında sıfırlanmaz.
