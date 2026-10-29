# Çok kareli yerleşim — izole teknik dilim / PROTOTİP

Taban `e0ef01c` World3 haritası. Üretim Building/State, çarpışma, inşa bedeli,
kayıt şeması ve sunucu değiştirilmedi. Bu gerçek oyunda büyük ev veya iç mekân
özelliği değildir; uygulama/göç onayı yerine geçmez.

`lib/experiments/footprint.ts`: genişlik/derinlik/4 yön, negatif koordinatta
normalize tüm hücreler ve bitişik dış giriş. Yerleşim her hücrede zemin/nesne/
çakışma, aday giriş ve önceki yapıların girişlerinin açık kalmasını kontrol
eder. Haritada5×4 ev veya3×3 atölye seçilir, döndürülür, yeşil/kırmızı önizleme
ile yalnız uygun yere konur. Yerel geri alma yalnız geçici prototip dizisidir.

Tekrar: `node --experimental-strip-types scripts/preview-world3.mjs --footprint`.
localhost8948, hiçbir kayıt/API/WS/DB/hesap bağlantısı yoktur. Regenerate yalnız
bu geçici yerleşimleri sıfırlar; oyun kaydını okumaz/yazmaz.

## Doğrulama

- Typecheck ve **229/229 test**, build başarılı. Dört yeni test:4 rotasyonda
  bütün20 hücre/dış giriş, anchor dışındaki engel, dolu alan/önceki girişin
  kapanması, boyut/koordinat sınırı. Üretim statik boyutu yaklaşık2.95MB;
  prototip üretim girişinden import edilmez.
- İlk typecheck DOM/Workers `HTMLSelectElement` tür çakışmasına takıldı.
  Yerel select için standart seçili-option sorgusu/change listener kullanıldı;
  test veya TS kuralı gevşetilmedi.
- Gerçek yerel tarayıcıda merkez göl seçimi `terrain` ile reddedildi.
  Seed7821,(-44,-44) çayırı `ready`;5×4 ev90° döndürülüp kondu; aynı konuma
  ikinci bina `occupied` ile reddedildi. Undo sonrası aynı alan tekrar `ready`.
  Görsel `screenshots/footprint-isolated-prototype.jpg`; gerçek üretim oyunu
  ekranı değildir. Rotasyon/giriş geometrisi bütün yönlerde Node testindedir.

**PLANLANDI:** gerçek izometrik kamera/3D ölçek, Engine yerleştirme/pathfinding
ve çarpışma uyarlaması, kapı/alan kimliği, çatı kesiti/iç sahne, mevcut eski
yapılarla çakışma politikası, göç/dupe/iki oyuncu kapı/reconnect testleri.
AOI/bölgesel kalıcılık, bağımsız keşif ve ortak maden ayrıca planlıdır;
20 kare sınırı değiştirilmez. Bu prototipte üretim göçü başlatılmaz.
