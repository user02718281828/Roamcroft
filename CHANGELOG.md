# Değişiklikler

## 1.3.1 — 15 Eylül 2026

- Kameraya yapışan opak bulut modelleri, dünya koordinatlarına bağlı seyrek ve şeffaf bir sis katmanıyla değiştirildi. Kenarlar yumuşak; gölge ve derinlik yazımı yok; tek çizim çağrısı.
- Worker yanıtlarına altı güvenlik başlığı, HTML scriptlerine her istekte yeni nonce eklendi. Statik dosyalar da başlıklarla korunur. Üretim HTTP/CSP kontrolü CI'a eklendi.
- Drizzle Kit 0.31.10 korunarak @esbuild-kit/core-utils altındaki esbuild 0.25.12'ye sabitlendi. Dört moderate audit bulgusu giderildi; geçici klasörde SQL şema üretimi doğrulandı.
- Kayıt yükleme hatası ana menüde kalıcı kırmızı mesajla görünür; bozuk dosya mevcut çiftliği değiştirmez.
- Kullanıcının bulut, güvenlik, PageSpeed, kayıt/CORS ve gelecekteki egress maddeleri gelişim planına eklendi.

## 1.3.0 — 14 Eylül 2026

- Mobil yön tuşları yerine 360° analog joystick eklendi; merkez uzaklığı hızı belirler, bırakma/odak kaybı hareketi sıfırlar. Yatay/dikey araç çubuğu ayrıldı, dokunma alanları büyütüldü.
- İki parmakla yakınlaştırma ve hareket sonrasında yanlış tıklamayı önleyen dokunma takibi eklendi.
- Ana ekrana ekleme, tam ekran, uygulama simgeleri ve çevrimdışı uygulama önbelleği eklendi.
- D1 kimliği tek yapılandırmadan alınır; her derlemenin çıktısı otomatik doğrulanır ve düzeltilir.

- Nehir yüzeyini örten taban geometrisi düzeltildi; mavi su, yansıma ve kıyı köpüğü iyileştirildi.
- Hayvanlara eklemli bacak hareketi, kamp ateşine alev hareketi, bitkilere hafif rüzgar eklendi. Hasatta gölge haritası yenilenir.
- Hayvanlara bağımsız kafa ve nefes hareketi, karaktere yumuşak animasyon geçişleri eklendi. Kış yağışı kar olarak çizilir; hava efektleri keşif kamerasını izler.
- Dört mevsime özgü özgün müzik dizileri, maden teması ve konuma bağlı gece böcek sesleri eklendi. Aktif eylem parçacıkları 42 ile sınırlandı.
- Küçük bitkiler geçilebilir; ağaç çarpışması gövdeyle sınırlıdır. 1–8 araç kısayolları geri getirildi.
- Adım ve malzemeye özgü eylem sesleri, rüzgar, akarsu, kuşlar ve gündüz/gece müziği; üç ayrı ses ayarı.
- Görseller WebP oldu (14.02 → 0.92 MB). Menü ihtiyaç anında yüklenir; Three.js paketleri ayrıldı. Gerçek yükleme ilerlemesi ve 3 MB derleme bütçesi eklendi.
- Hazır olmayan co-op girişi menülerden kaldırıldı, bağımsız yayında uç nokta kapatıldı. Gelecek çevrimiçi aşamalar belgelendi.
- Node 22.13 test uyumluluğu, GitHub doğrulama iş akışı, OG meta ve kayıt geçişi kontrolleri eklendi.

## 1.2.0

- Birleşik menü, A* yol bulma, ortak depo, NPC rutinleri ve Host-Join altyapısı.
