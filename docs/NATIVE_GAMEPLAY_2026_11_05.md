# Native geliştirmeye dönüş — 5 Kasım 2026

Kullanıcının on hedefi geliştirme kapsamıdır; bu kayıt hepsinin tamamlandığını
iddia etmez. Tam kaynak belge [native yol haritası](NATIVE_ROADMAP_2026_11_05.md)
olarak değiştirilmeden kopyalandı. Belgedeki eski sayılar tarihsel araştırma
sonuçlarıdır, bu pakette yeniden sayılmadı. Belge tek başına yayın izni değildir.
CrazyGames çalışmaları korunur; yeni portal işi bu paketin kapsamı değildir.

## Tamamlanan ilk kod dilimi

- Mevcut 20 göreve iki kısa hedef eklendi: bir üretim işini gerçekten bitir,
  bir ürün sat. Başlangıç stoğu, altın veya sıraya alınan iş tamamlanma sayılmaz.
- Üretim ödülü 4 havuç tohumu + 20 XP; satış ödülü 6 odun + 4 taş + 20 XP.
  Ek altın verilmez. Ödüller mevcut Engine.claim üzerinden açıkça alınır;
  eski kayıtta kazanılmış craft/sell sayaçları da geçerlidir. Eski uzun üretim
  ve satış görevleri, ödülleri ve serbest tamamlama sırası korunur.
- İlk depo hâlâ 12 odun + 4 taş ister; bu ödül odunun yalnız bir bölümüdür.
- Görev kartlarında tüm eşya ödülleri görünür. Yeni görevlerde üretime/pazara
  doğrudan geçiş var; ödül satırı dar ekranda sarılır. TR/EN metinleri eklendi.
- Ödüller mevcut kapasite/depo/teslimat yolunu kullanır; dolu çantada silinmez.
  Sunucu yeni görev için de yetkili sayaç ve tek seferlik claim kontrolü yapar.

Bu küçük paket 30 dakika eğlence/tutundurma kabulü değildir. Gerçek yeni oyuncu
gözlemi olmadan daha eğlenceli veya daha hızlı ilerleme kanıtlandı denemez.

## Kayıt ve yayın sınırı

SAVE_VERSION=1, State alanları, başlangıç malzemeleri, araç yükseltmeleri,
fiyatlar, dünya generation=2, D1/DO şeması ve portal auth değiştirilmedi.
Yeni kod eski kayıtları okur. Yeni görev kimlikleri claimed listesine girdikten
sonra eski kodun görev allowlist'i bu kaydı reddedebilir: eski build'e geri
dönüş uyumluluğu yoktur. Yayından önce yedek/rollback politikası ayrıca kabul
edilmeli; claimed kimliklerini sessizce silen bir dönüştürücü eklenmedi.
Yerel kayıt gerçek kullanıcı origin'inden alınmadı veya değiştirilmedi.

## On alanın devam sırası ve kabul kapıları

| Sıra | Alan / mevcut durum | Sonraki tamamlanabilir iş ve kabul |
| --- | --- | --- |
| P1 | İlk 30 dakika: bu pakette iki kısa görev; bütün denge işi kısmi | Yeni, deneyimli ve yönlendirmeyi atlayan oyuncu akışlarını gözle; tohum/enerji/üretim/satış/depo döngüsünü ölç. Enflasyon ve sonsuz ödül olmamalı. |
| P1 | 5×4 büyük yapılar: tarihsel footprint prototipi, oyuna entegre değil | Prototip codex/mobile-menu-fix-1-13-2 geçmişinde 7374026; yalnız ilgili kaynağı incele. Dört dönüş, tüm kaplanan hücreler, kapı dış erişimi, sınırlar, pathfinding ve online yetkiyi birlikte uygula. Eski 1 hücreli yapılar yerinde kalmalı; şema/geri dönüş kapısı çözülmeden üretime bağlama. |
| P1 | World Generation 3: izole prototip, üretim generation=2 | e0ef01c geçmişini koru. Yeni dünya için sürümlü/isteğe bağlı üretim; eski seed/edits değişmez. Biyom/nehir/göl/bataklık/dağ geçişleri, chunk dikişleri ve ulaşılabilirlik testi. |
| P2 | İç mekân/dekor: yapılmadı | Büyük yapı kapısı ve koordinat modeli sonrası tek ev, güvenli gir/çık ve yatak/sandık dilimi; zemin/duvar/dekor verisini sahiplik ve kayıt testleriyle genişlet. |
| P2 | Keşif/macera: temel maden/keşif noktaları mevcut | Bir özgün keşif zinciri; gizli mağara/harabe/hazine/nadir kaynak ve bölge açılışları tekrar ödül üretmemeli, eski dünyayı ezmemeli. |
| P2 | Yaşayan köy: mevcut 3 NPC/rutin/dostluk; derinlik eksik | Tek özgün dallanan görev ve NPC tepkisi; sonra festival. Dil, kayıt, gün sınırı ve tek ödül kabulü. |
| P2 | Çiftçilik/hayvancılık: çekirdek zincirler mevcut | Mevcut sulama/hayvan bakımını ilk oturumla ölç; tek anlamlı zincir genişletmesi, ardından yeni hayvanlar. Dolu çanta, çevrimdışı ve makine girdi iadesi korunmalı. |
| P2 | Savaş/maden/balıkçılık: temel sistemler mevcut | Önce düşman zorluğunu ölç; sonra kaçınma/telegraph/ganimet ve tek balıkçılık mini oyunu. Ortak boss için sunucu kabulü ayrıca gerekli. |
| P2 | Inventory 2.0: gerçek 9 slot referans hotbar mevcut; ekipman/yığın/DnD eksik | inventory-hotbar-1.14-design.md sözleşmesini kodla karşılaştır; veri geçişi, ekipman ve dokunmatik atamayı ayrı dilimle uygula. Aynı eşyayı çoğaltma/tüketme veya yükseltme kaybı olmamalı. |
| P2 | Ortak dünya: 4 oyuncu yüzey co-op mevcut; uzak keşif/ortak maden eksik | AOI ve sunucu çok-bölge mimarisi; iki ayrı bölge, ortak maden/asansör/boss ve kalıcı çiftlik kabulü. D1/DO otoritesi, kişi envanteri ve ortak ekonomi korunmalı. |

Her alanın ayrıntılı alt işleri kaynak yol haritasında korunur. Sayısal içerik
kotaları sessizce silinmez veya tamamlandı sayılmaz. Büyük binalar ile World3
aynı anda eski dünyaya uygulanmayacak; önce küçük güvenli entegrasyon kapısı.

## Doğrulama

Node 22.13.0 / npm 10.9.2; typecheck ve 263/263 test geçti. Yeni beş regresyon:
tamamlanmış üretim, gerçek satış, eski ilerleme/dolu çanta, TR/EN ve sunucu
yetkisi/tekrar ödül engeli. İlk hedefli çalıştırmada testteki savedAt sabitliği
ve sıfır miktarlı anahtar beklentileri düzeltildi; oyun kodu bunlar için değişmedi.

Normal build/finalize/bütçe geçti: oyun statik varlıkları 2.98 MB; galeri ayrı
0.47 MB. Önceden var olan üç CrazyGames ZIP'i build temizliğinden önce yedeklendi
ve byte değişmeden geri konuldu; bunlar bu yeni native paketi içermez.
Yerel Worker runtime: dört gerçek WS bağlantısı, replay/reconnect, özel çanta,
D1 çatışma koruması ve ortak uyku geçti. Bunlar canlı WAN veya dört insan değildir.

Yerel tarayıcıda gerçek 3D açılış; görev→üretim→tahta tamamlanması→ödül,
görev→pazar→tek odun satışı→ödül; menü kapat/yeniden aç ve cihaz kaydını
yeniden yüklemede her iki tamamlanmış görev doğrulandı. TR/EN değişimi geçti.
713×615, dar 320×640 ve yatay 740×360 viewport kullanıldı; 22 ödül satırında
yatay taşma görülmedi. Bu masaüstü tarayıcı kabulüdür, fiziksel dokunma değildir.
Kanıt ekranı: work/native-gameplay-320.png (yerel, Git dışında).
Üretim yardım metni bu kabulden sonra dünyaya dönme adımını açıklaştırdı;
metin değişikliği sonrası 14/14 görev+i18n testi ve son build de geçti.
Son build önce açık önizleme nedeniyle EBUSY aldı; yalnız bu oturumun yerel
önizlemesi kapatılıp aynı build yeniden başarılı çalıştırıldı. Üretilmiş Wrangler
yapılandırmasında workers_dev=false ve preview_urls=false korundu.

Fiziksel Android, insanlı ilk 30 dakika, gerçek WAN ve canlı yayın doğrulanmadı.
Push/main/deploy yetkisi yok; ürün sürümü alpha.3 olarak korunur.
Çalışma dalı codex/native-gameplay-foundation, taban 55ad765. Kullanıcı bu yeni
oturumda commit talimatı vermediği için değişiklikler yerel çalışma ağacındadır;
commit/push/deploy yapılmadı. Kullanıcının iki eski untracked dosyası korundu.
