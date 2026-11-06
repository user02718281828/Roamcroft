6 Kasım güncellemesi: Gerçek 5×4 dış yapıdan sonra öncelik [oynanabilir ev iç mekânıdır](NATIVE_INTERIORS_2026_11_06.md). Cihaz çiftliği dilimi uygulanmıştır; co-op iç mekân ve World3 ayrı kabul kapılarıdır. [Tüm yerel dalların/prototiplerin GitHub yedeği](GITHUB_BACKUP_2026_11_06.md) doğrulandı. Eski tabloda prototip/yayın yok ifadeleri ilgili tarihsel aşamayı anlatır; hiçbir backlog maddesi silinmedi.

# Roamcroft — TAM GELİŞTİRME YOL HARİTASI (5 Kasım 2026)

> **Kapsam:** Yalnızca özgün, resmî `https://roamcroft.com` oyunu. CrazyGames geliştirmeleri **beklemede**. Bu belge kaynak kodu değiştirmez, çalışma dalını taşımaz ve canlıya dağıtım yetkisi vermez.

## Kaynak ve kesinlik sınırı

- Esas kaynak: Codex'in `C:\Users\devbu\Roamcroft` yerel projesinde **65 Markdown / 5.874 satır** ve ilgili kodları tarayarak ürettiği **5 Kasım 2026 salt okunur rapor**. Rapor 213 maddelik envanter içeriyor.
- Bu dosyada **134 açık/kısmi/prototip/belirsiz native + uzun vadeli madde** yeniden önceliklendirilmiştir. **56 tamamlanmış native madde** ek korunacaklar listesinde; **20 portal maddesi + 3 portal-özel madde** dondurulmuştur.
- **Raporun durum sembolleri değişmeden aktarılmıştır:** `Y` yapılmadı, `K` kısmen, `PR` ayrı prototip, `B` belirsiz. `T` tamamlandı; aktif yapılacaklara yeniden eklenmez.
- Aşağıdaki **0–7 aşama sırası bizim önerdiğimiz yeni iş sırasıdır**; Codex'in raporundaki P0–P3 sınıfları birebir taşınmamıştır. Her maddenin orijinal kodu, statüsü, eski önceliği ve kaynak işareti korunur.
- Çok kareli prototipte **5×4 ev** (90° döndürülünce **4×5**) ve **3×3 atölye** vardır. **Gerçek oyuna entegre değildir.** Ayrı doğrulama: `docs/verification-footprint-prototype.md`.
- Dünya örnekleyicisi ve footprint prototipi aktif çalışma dalında değil, başka yerel geliştirme dalında korunuyor; `git` geçmişi incelenmeden taşınmamalı.
- Çalışmalar için başlangıç kuralı: **tek küçük paket → test/typecheck/build + kayıt/online regresyon → kullanıcının onayı**. Production'a doğrudan yazma, canlı D1/DO'yu sıfırlama, kayıt göçünü otomatik çalıştırma yasak.

## Önerilen ilk üç teslim paketi

1. **Güvenli taban/ölçüm:** yerel Git yedeği doğrulama, production deploy kuralı, bağımlılık audit, fiziksel Android + düşük donanım uzun oturum, riskli kayıt akışlarının değerlendirilmesi. Kodsuz kontrol mümkünse önce o.
2. **İlk 30 dakika eğlence testi:** sıfırdan 2–3 farklı oyuncu profiliyle hedef/hasat/üretim/inşa/ödül akışını gözlemle; kaynak/enerji/ilk hedef ve araç geri bildiriminde yalnız ölçülen sorunları düzelt.
3. **Büyük ev + dünya prototipini ürünleştirme tasarımı:** gerçek motor/kayıt/kapı/iç mekân entegrasyonu için sürümlü plan; mevcut çiftlikler ve co-op bozulmadan 5×4 ev prototipini küçük test dalında entegre et. World3 ayrı ve opt-in yeni dünya olarak ilerlesin.

## Tam öncelik sıralaması — 134 açık madde

**Not:** Aynı aşama içinde aşağıdaki numaralar üstten alta tercih sırasıdır; bazı maddeler bağımlılıklarına göre birlikte uygulanabilir.

### Aşama 0 — Önce güvence: mevcut kayıtlar, altyapı ve cihaz kararlılığı

Önce koruma, ölçüm ve riskleri anlamak; körlemesine sürüm yükseltmek veya canlıya otomatik yayın yapmak yok.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 1 | `A11` | `B` | P1 | Downloads’ta anlatılan taşınabilir Git bundle yedeğinin güncel varlığı ve başka diskte korunması. Proje klasöründen kesinleşmiyor. | [Teslim kaydı](C:/Users/devbu/Roamcroft/docs/continuation-2026-10-29-delivery.md) |
| 2 | `A03` | `B` | P0 | Cloudflare non-main otomatik deploy politikasını kesinleştirme. Eski belirsizlik çözülmüş görünmüyor. | R, M |
| 3 | `A08` | `K` | P0 | Eski origin kayıtlarını güvenli kurtarma. Prosedür var; genel otomatik kurtarma/taşıma uygulanmış değil. | R |
| 4 | `A09` | `Y` | P0 | Native sunucu hesabının çerez kaybından sonra sahiplik doğrulamalı kurtarılması. | V, O, M |
| 5 | `B02` | `B` | P0 | Güncel audit ve erişilebilirlik incelemesi. Son kayıt 20; bugünkü advisory durumu yeniden ölçülmedi. | S |
| 6 | `B03` | `Y` | P0 | Vite/dev güvenlik düzeltmeleri ve framework/plugin uyumu. | S |
| 7 | `B04` | `Y` | P0 | MCP SDK, body-parser, brace-expansion, systeminformation ve shadcn/Zod uyumlu düzeltme grubu. | S |
| 8 | `B05` | `Y` | P0 | Cloudflare plugin/Wrangler/Miniflare ve bütün Undici kopyalarının kontrollü düzeltilmesi. | S |
| 9 | `B06` | `Y` | P0 | Hono/node-server, fast-uri, ip-address, qs gibi kalan geçişli paketlerin düzeltmeleri. | S |
| 10 | `B07` | `Y` | P0 | Vinext/OG/Satori uyum paketi ve deepmerge çözümü. Kör override veya major geçiş uygulanmamış. | S |
| 11 | `L05` | `K` | P0 | Streaming/sahne eşitleme sıçramalarının tamamen giderilmesi. Tarihsel yaklaşık 49 ms sorununun bütünüyle kapandığı kanıtlanmış değil. | [Performans denetimi](C:/Users/devbu/Roamcroft/docs/performance-audit-2026-10-01.md), Q |
| 12 | `L06` | `Y` | P0 | Yeni alpha.3 HUD/orman/inşa/ekim için fiziksel Android portre/yatay kabulü. Alpha.1’de geçen eski kontrol testi bunun yerine geçmez. | Q, U |
| 13 | `L07` | `Y` | P0 | Düşük donanımda uzun oturum; FPS, bellek, GC, ısı, pil ve dokunma gecikmesi. | M §20, Q |
| 14 | `L11` | `Y` | P0 | Dört fiziksel cihazla gerçek WAN ve mobil ağ kesinti testi. | O, M §16 |
| 15 | `B12` | `Y` | P1 | WAF/Turnstile, kota/CPU/maliyet alarmları ve bağımsız sızma testi. | V |
| 16 | `B13` | `Y` | P1 | Haricî log arşivi, alarm ve otomatik kurtarma operasyonları. Temel redakte hata logları mevcut. | O |
| 17 | `M04` | `B` | P0 | Preview endpoint’inin ve Dashboard’ın güncel durumu. | R |
| 18 | `N15` | `Y` | P2 | EULA, gizlilik/yaş gereksinimleri ve telif/varlık kökeni çalışmalarının tamamlanması. | V, P, A |
| 19 | `N16` | `B` | P2 | Depodaki MIT lisansının ticari sahiplik vizyonuyla birlikte değerlendirilmesi. Lisans mevcut; başlığı hâlâ “Ocak Vadisi contributors”. Otomatik değiştirilmemeli. | [LICENSE](C:/Users/devbu/Roamcroft/LICENSE), M |

### Aşama 1 — İlk 30 dakika: oyuncuyu oyuna bağlamak

Üretmeden önce yeni oyuncu gözlemleri; her pakette anlaşılır hedef, anlamlı tercih ve görünür ödül.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 20 | `C03` | `Y` | P1 | TR/EN yeni oyuncularla gerçek ilk 30 dakika testi; yardım, yanlış araç, terk ve enerji gözlemleri. | F |
| 21 | `C04` | `PR` | P1 | Daha sade başlangıç ekonomisi. Scriptte karşılaştırmalı deney var; gerçek başlangıca uygulanmadı. | F |
| 22 | `C05` | `Y` | P1 | Başlangıç kaynakları, erken görev ödülleri ve seviye enerji yenilenmesini birlikte dengeleme. | F, M §6 |
| 23 | `C06` | `Y` | P1 | Sıfırdan çiftlik kurma seçeneği / anlamlı yeni başlangıç profili. | M §1 |
| 24 | `C07` | `K` | P1 | Çok günlük ekonomi dengesi. Fiyat/işleme ve sabit parti hesapları var; tam bakım/emek/oyuncu döngüsü yok. | G, F, [ekonomi tabanı](C:/Users/devbu/Roamcroft/docs/economy-baseline-1.7.0.md) |
| 25 | `C10` | `K` | P1 | Araç başına tatmin edici darbe/çalışma animasyonu, ses ve kazanım geri bildirimi. Temel var; oyuncu hissi kabulü ve bütün paket yok. | M §2, A |
| 26 | `C11` | `K` | P1 | Yükseltmenin gerçek faydasını görünür anlatma. Kart/notlar var; yeni oyuncuyla anlaşılabilirlik ölçümü yok. | F |
| 27 | `D13` | `K` | P1 | Envanterin web paneli hissini giderme ve deponun yeni oyuncu tarafından yardımsız bulunması. UI iyileştirildi; yeni oyuncu kanıtı eksik. | M §4, A |
| 28 | `F06` | `Y` | P2 | Görevleri para/malzeme/kendi üretimi gibi farklı yollarla çözme; sonucun köyde görünmesi. | G |
| 29 | `F05` | `Y` | P2 | İki çözüm yolu olan NPC işbirliği görevleri ve kalıcı karar sonuçları. | G |
| 30 | `F04` | `K` | P2 | Unutulmaz kişilikler, daha çok diyalog ve uzun ilişki döngüleri. Mevcut aşama diyalogları başlangıç sağlıyor. | M §8, G |
| 31 | `F07` | `K` | P2 | Yardım panosu/uzun sipariş/zamana bağlı sosyal içerik. Günlük sipariş ve görevler var; uzun sipariş, yıldönümü ve sosyal takvim paketi yok. | E §5 |
| 32 | `C12` | `Y` | P2 | İlerlemeyi farklı oynama biçimlerine dönüştüren geri alınabilir tercihler; düşük yakıt/yüksek hız gibi seçenekler. | G |
| 33 | `K07` | `K` | P1 | Sıcak sanat dilinin bütün üretim/inşa/çiftlik/günlük/dostlar/online/maden/ayar menülerine yayılması. | A |
| 34 | `K09` | `K` | P1 | Klavye, ARIA, ekran okuyucu, %200 metin ve azaltılmış hareket kabulünün tamamı. Kod desteği var; tam insan/cihaz kabulü yok. | A, I, U |
| 35 | `K11` | `B` | P1 | Bağımsız Launcher Settings→Close→Play akışının gerçek tarayıcı kabulü. Module graph/SSR kanıtı var; belgede UI kabulü eksik. | Aynı hazırlık belgesi |

### Aşama 2 — Roamcroft’u dönüştürecek büyük yapılar ve dünya

Prototipler gerçek oyuna bağlı değil. 5×4 ev (dönüşle 4×5), 3×3 atölye örnekleri; önce sürümlü veri ve eski çiftlik çakışma politikası.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 36 | `G10` | `PR` | P2 | Çok kareli footprint; dört rotasyon, tüm hücrelerde engel ve dış kapı koruması. Ayrı dalda. | [Footprint doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-footprint-prototype.md) |
| 37 | `G11` | `Y` | P2 | Gerçek Engine inşasında büyük ev/ahır/kümes/sera/atölye footprint’leri ve eski yapı çakışma politikası. | M §19 |
| 38 | `G12` | `Y` | P2 | Kapıdan girilen izometrik iç mekânlar; çatı kesiti, ev/atölye/dükkân/mağara/zindan alanları. | M §19 |
| 39 | `G13` | `Y` | P2 | İç mekânda mobilya/makine yerleşimi, iç-dış kayıt ve iki oyuncunun aynı kapıyı kullanma kabulü. | M §19 |
| 40 | `E14` | `Y` | P2 | Ev/çiftlik dekorasyonu, kişiselleştirme ve anlamlı yeni tarif/inşa döngüleri. | M §7, A |
| 41 | `G04` | `PR` | P2 | World Generation 3 örnekleyicisi: göl/nehir/çayır/orman/bataklık/yüksek alan ve harabe işareti. Ayrı dalda korunuyor. | [World3 doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-world3-prototype.md) |
| 42 | `G05` | `Y` | P2 | World3’ü gerçek kamera, arazi, çarpışma, geçilebilir spawn ve kaynak ekonomisine bağlama. | M §18 |
| 43 | `G06` | `Y` | P2 | Yeni generation için sürümlü/opt-in yeni dünya yolu ve eski kayıt koruması. | M §18 |
| 44 | `G07` | `K` | P2 | Daha doğal kesintisiz coğrafya, nehir/göl/dağ/bataklık çeşitliliği. Mevcut dünya ve prototip var; yeni üretim dünyası yok. | M §18 |
| 45 | `G08` | `Y` | P2 | Sincap, geyik, tilki, kurbağa, nadir canlılar ve biyoma özgü ek yaşam. Mevcut ortam balıkları/kelebekleri bunun tamamı değil. | LF, M |
| 46 | `G09` | `K` | P2 | Daha derin mevsim dağılımı, gece/yağmur rutinleri ve küçük çevre olayları. Temel atmosfer var. | LF |
| 47 | `G14` | `K` | P1 | Sanat rehberinin tüm menü/dünya öğelerine tutarlı uygulanması ve kaynak/lisans envanteri. İlk paketler var; bütün dönüşüm değil. | A |

### Aşama 3 — Oynanış derinliği: keşif, dövüş, balıkçılık, çiftlik ve köy

Tekrarlanan tıklama veya sadece sayı artışı değil, oyuncuya yeni bir karar/ödül getiren küçük özellik paketleri.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 48 | `H03` | `Y` | P1 | “Düşmanlar çok kolay” geri bildiriminin ekipman/seviye matrisiyle ölçülmesi ve denge kararı. | M §9 |
| 49 | `H04` | `K` | P2 | Daha akıllı AI ve saldırı geri bildirimi. Windup/hedef/hasar temelleri var; yeni savaş derinliği tamamlanmadı. | M §9 |
| 50 | `H05` | `Y` | P2 | Yeni savunma/kaçınma kontrolü ve buna bağlı dengeli karşılaşmalar. | M §9, E §4 |
| 51 | `H06` | `K` | P2 | Tatmin edici ganimet ve yeni boss karşılaşmaları. Temel boss/ganimet var; geniş paket yok. | M §9 |
| 52 | `H07` | `Y` | P2 | Güvenli kısa yol/uzun riskli damar seçimi ve keşif maliyetine bağlı maden tercihleri. | G |
| 53 | `H08` | `Y` | P2 | Altın/ileri cevher genişlemesi, jeotlar, fosiller, özgün kalıntı/gizli geçit/hazine görevleri. | E §4 |
| 54 | `H10` | `Y` | P2 | Önce 4–6 balık; yer/hava/saat tercihi, gözlem kaydı ve her türün oynanış amacı. | G |
| 55 | `H11` | `Y` | P2 | Telefonda tek elle oynanabilen özgün atış/çekme zamanlama mini oyunu. | G, M §9 |
| 56 | `E08` | `K` | P2 | Günlük bakım özeti ve görünür verim tahmini. Mevcut yem/bağ/hazır ürün bilgileri var; hedeflenen özet/öngörü döngüsü tamamlanmamış. | G |
| 57 | `E04` | `K` | P2 | Otomatik sulama derinliği. Fıskiye/sera/kapsam ödülü var; istenen damla sulama paketi yok. | E §2, M §7 |
| 58 | `E03` | `Y` | P2 | Toprak yorgunluğu, dinlendirme, gübre çeşitleri ve okunabilir verim göstergesi. | E §2 |
| 59 | `E07` | `Y` | P2 | Hayvanların su/temizlik bakım sistemi. Mevcut Animal verisinde bu bakım alanları yok. | E §3 |
| 60 | `E09` | `Y` | P2 | Otomatik yemlik/suluk ve anlamlı bakım otomasyonu. | E §3, G |
| 61 | `E10` | `Y` | P2 | Mutluluğun ürün kalitesine etkisi. Mevcut bağın ürün adedine etkisi, kalite sistemi değil. | E §3 |
| 62 | `E06` | `Y` | P2 | Keçi, ördek ve domuz; her türün farklı üretim yolu. | E §3, G |
| 63 | `E13` | `K` | P2 | Daha geniş işleme zincirleri. Bal, peynir, dokuma ve mutfak temelleri var; mayonez, tereyağı, kumaş ve fıçı genişlemesi yok. | E §3 |
| 64 | `F08` | `Y` | P2 | İlk özgün ortak pazar günü veya benzer tek tamamlanmış etkinlik. | G |
| 65 | `F11` | `K` | P2 | Gizli içerik ve tekrar oynama nedenleri. Keşif noktaları mevcut; uzun vadeli olay döngüsü tamamlanmamış. | M §14 |
| 66 | `F10` | `Y` | P2 | Üretim odaklı oyun sonu projesi; az alan/az bakım/çeşitli ürün gibi oyuncu seçimi. | G |
| 67 | `T09` | `Y` | P2 | Becerilerin 5/10. seviyelerinde meslek seçimi ve etkilerinin UI’sı. Beş beceride 10 seviye temeli mevcut. | E §6 |
| 68 | `T13` | `Y` | P2 | Kıyafet, şapka, saç, ten ve göz seçimi; kalıcı karakter görünümü. | E §6 |

### Aşama 4 — Envanter 2.0 ve eşya sistemi

Gerçek hotbar zaten var. Yeni eşya-instance/stack şeması mevcut miktarları ve dört kişilik oyun kayıtlarını bozmamalı.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 69 | `D11` | `K` | P1 | Tam Inventory 2.0 veri/göç sözleşmesi. Ayrıntılı taslak var; uygulama ve onay kapısı açık. | I |
| 70 | `D06` | `Y` | P1 | Gerçek araç instance kimliği, sahipliği ve `ownedTools` modeli. | I |
| 71 | `D07` | `Y` | P1 | Ekipman yuvaları ve aktif ekipmanın sunucu sahipliğiyle eşlenmesi. | I |
| 72 | `D08` | `Y` | P1 | Gerçek yığın ayırma/birleştirme, stack kimliği ve güvenli taşıma. | I |
| 73 | `D09` | `Y` | P1 | Sürükle-bırak ve eşdeğer dokunma/klavye seç–taşı akışı. Hotbar’a atama bunun tamamı değil. | I |
| 74 | `D12` | `Y` | P1 | Araç-instance/ekipman/stack şema göçü ve dört oyunculu kayıp/dupe kabulü. | I |
| 75 | `D10` | `Y` | P1 | Ayrı çanta kapasitesi yükseltme sistemi. Koleksiyonla 600→900 mevcut; geniş sistem değil. | M §3 |

### Aşama 5 — roamcroft.com için gerçek dört kişilik Online 2.0

Dış portallardan bağımsız yerel online. Önce hesap/kurtarma ve bağlantı güvenliği, sonra büyük ortak dünya.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 76 | `I07` | `Y` | P1 | Kısa, okunabilir sekiz karakterli davet kodu. Mevcut native kod 24 hex karakter. | M §10 |
| 77 | `I08` | `Y` | P1 | Native sitede güvenli bağlantıyla katılım, URL temizleme ve sadeleştirilmiş lobi. CG bağlantısı ayrı kapsam. | M §10 |
| 78 | `I09` | `Y` | P1 | İsteğe bağlı native hesap, cihazlar arası erişim ve hesap kurtarma; misafiri koruma. | M §10, O2 |
| 79 | `I10` | `Y` | P2 | Native arkadaş sistemi ve hesap bağlama. | M §10 |
| 80 | `I11` | `Y` | P2 | Başkasının köyünü salt okunur ziyaret, paylaşımı kapatma ve kota. | O2 |
| 81 | `I12` | `Y` | P2 | Oyuncular arası tekilleştirilmiş hediye teslimatı ve otoriter sıralamalar. | O2 |
| 82 | `I13` | `Y` | P2 | Ortak maden, birlikte asansör ve birlikte boss; ganimet/kat/checkpoint otoritesi. | E, M §10 |
| 83 | `I14` | `Y` | P2 | Host merkezli yaklaşık 20 kare sınırını AOI/bölgesel snapshot ve bağımsız simülasyonla kaldırma. | M §10, §19 |
| 84 | `I15` | `Y` | P2 | Ortak dünyada bağımsız iç mekânlar ve kişisel kulübeler. | O, M §19 |
| 85 | `I16` | `Y` | P2 | Host devri ve indirilebilir tam parti kaydından geri yükleme. | O |
| 86 | `I17` | `Y` | P2 | Aynı karakterin birden çok sekmesi için lider kilidi/yönetimi. | O |
| 87 | `I18` | `Y` | P2 | 32 kalıcı profil sınırı için yönetim/temizleme ekranı. | O |
| 88 | `I19` | `Y` | P2 | Çok odalı kapasite, bölgesel kesinti, CPU ve maliyet ölçümü. | O, M §20 |

### Aşama 6 — Kalite, sürdürülebilirlik, dokümantasyon ve oyunun büyümesi

Belgeler, erişilebilirlik, kalan cihaz ölçümleri ve topluluk ritmi; kaynakta portal ile ortak geçen parçalar native oyuna uygulanabildiği ölçüde.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 89 | `A10` | `K` | P1 | Tek, çelişkisiz güncel durum kaydı: master/README/changelog’un tarihsel ve güncel bölümlerini ayırma. | M, J, R |
| 90 | `B14` | `B` | P2 | Repo genel lint temizliği. Eski belgeler genel lint borcu bildiriyor; yeni genel temiz sonuç yok. | [1.8 doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-1.8.0.md), [1.9 doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-1.9.0.md) |
| 91 | `B15` | `K` | P2 | Miniflare soğuk istek/taşıma hatalarının kök nedeni. Sınırlı test yaklaşımı var; altyapı hatası tamamen giderilmiş sayılmıyor. | [1.9.1 doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-1.9.1.md) |
| 92 | `K03` | `K` | P1 | Tam editoryal İngilizce ve bütün yeni portal hata metinlerinin yerelleştirilmesi. Portal akışında hâlâ sabit İngilizce hata metinleri var. | L, M §11, C |
| 93 | `L08` | `K` | P1 | iOS Safari, çentik, OS çubukları, ekran klavyesi, PWA kurulum/uçak modu/güncelleme ve arka plan dönüşü. Kod temelleri var; tam cihaz kabulü yok. | U, M §16 |
| 94 | `L09` | `Y` | P1 | Güncel sürüm için LCP/INP/CLS/PageSpeed ölçümleri. Eski API kota engeli sonrasında yeni kanıt bulunmadı. | E, M |
| 95 | `L10` | `Y` | P1 | Güncel sürümün farklı GPU/1080p–1440p–4K karşılaştırması ve React commit/compositor düzeyinde incelemesi. Eski ölçümler arşivdir. | Performans denetimi, M §20 |
| 96 | `L12` | `K` | P1 | WebGL context loss/recovery ve portal iframe yaşam döngüsü kabulü. Temel kod var; tam portal/cihaz matrisi eksik. | P, M §12 |
| 97 | `L13` | `Y` | P2 | Eaglercraft’tan uygulanabilir mimari ilkelerin özgünlük/lisans/uyumluluk açısından araştırılması. Motor değiştirme veya kod kopyalama kararı değil. | M §20 |
| 98 | `L14` | `K` | P2 | CodeScene odaklı davranışı koruyan modülerleştirme. Yardımcı modüller var; planlanan createState/act/combat/systems/tick çıkarımları bitmiş değil. | N |
| 99 | `M07` | `B` | P1 | Google’ın güncel indeksleme/sıralama/zengin sonuç durumu ve Search Console sitemap gönderimi. İlk sahiplik/indeks isteği kullanıcı bildirimiyle mevcut. | M, P |
| 100 | `M08` | `K` | P1 | README/TR/changelog’un güncel portal/yayın/audit durumuyla eşleştirilmesi. Temel belgeler var; bazı açıklamalar eski. | M, J, R |
| 101 | `M09` | `K` | P1 | Her sürümde gerçekten güncel oyun ekranları ve kaynak/provenans kayıtları. Tarihsel ekran etiketleri var; bütün son adayların görsel güncelliği doğrulanmış değil. | A, [Görsel kaynakları](C:/Users/devbu/Roamcroft/docs/screenshots/README.md) |
| 102 | `M10` | `Y` | P2 | Dil bazlı sosyal paylaşım kartları; mevcut Türkçe yazılı JPG’nin EN/TR pazarlama karşılıkları. | L, P |
| 103 | `M11` | `Y` | P2 | Portal/mağaza kapakları, özgün tanıtım görselleri ve fragman. | P |
| 104 | `M12` | `Y` | P2 | Topluluk ve ölçülü rollout/geri bildirim planının uygulanması. | P |
| 105 | `N08` | `Y` | P2 | Mahremiyet/rıza temelli oynanış analitiği: onboarding, ilk anlamlı ilerleme, geri dönüş ve tutundurma. Sentry bunun yerine geçmez. | M §13, P |
| 106 | `N09` | `Y` | P2 | Analitik olay şeması, saklama süresi, kapatma yolu ve hata halinde oyunu engellememe kabulü. | P |
| 107 | `F12` | `Y` | P2 | Prestij; korunan/sıfırlanan veriler, yedek, açık onay ve ortak sahiplik kuralları. | M §14, P |
| 108 | `F13` | `Y` | P2 | Düzenli içerik güncelleme döngüsü ve tutundurma sonuçlarına göre içerik planlama. | M §14 |
| 109 | `N17` | `B` | P2 | Domain yenilemesi ve Sentry sponsor planı gibi dış hesap durumlarının takibi. Belgelerde gelecekteki tarihler var; güncel hesap durumu doğrulanmadı. | M |

### Aşama 7 — Uzun vadeli platform, iş modeli ve eski genişleme hedefleri

Bunlar tamamen silinmiyor. Eski sayısal kotalar bağlayıcı hedef değildir; eğlence/ekonomi kanıtı ve kullanıcının onayı sonrası değerlendirilecek.

| Genel sıra | Kaynak ID | Durum | Codex önceliği | Tam yapılacak iş (rapordan) | Kaynak kodu |
|---:|---|---|---|---|---|
| 110 | `N01` | `K` | P1 | Tek çekirdek ve platform adaptörü yaklaşımı. CrazyGames için uygulanmış; diğer portallar için genel bitmiş çözüm yok. | P, C |
| 111 | `N02` | `Y` | P3 | itch.io HTML5 dağıtımı ve backend/origin/WS kabulü. | P |
| 112 | `N03` | `Y` | P3 | Playgama Bridge ve kanal/gelir çakışması değerlendirmesi. | P |
| 113 | `N04` | `Y` | P3 | GameDistribution SDK/sözleşme/yeniden dağıtım kabulü. | P |
| 114 | `N05` | `Y` | P3 | GamePix SDK/sözleşme/yeniden dağıtım kabulü. | P |
| 115 | `N06` | `Y` | P3 | Poki için uygun münhasır olmayan teklif ve teknik/veri izinleri değerlendirmesi. | P |
| 116 | `N07` | `Y` | P2 | Platformların lisans, alt lisans, kaldırma, net gelir, ödeme eşiği, vergi ve Türkiye’ye ödeme koşulları. | P |
| 117 | `N10` | `Y` | P2 | Kullanıcı dostu midroll, sıklık sınırı ve doğal duraklar. | M §13, P |
| 118 | `N11` | `Y` | P2 | İsteğe bağlı rewarded reklam; sunucu otoriteli tek sefer ödül, ACK/kopma/iptal ve çift ödül testleri. | P |
| 119 | `N12` | `Y` | P3 | TWA/Bubblewrap/Capacitor karşılaştırması ve imzalı Android test APK’sı. | P |
| 120 | `N13` | `Y` | P3 | AAB/Google Play; yaş/veri güvenliği/hedef API/test ve mağaza kabulü. | P |
| 121 | `N14` | `Y` | P3 | Steam/PC paketleme, girdi, lisans ve ödeme değerlendirmesi. | P |
| 122 | `T01` | `Y` | P3 | Eski kayıt günlerini dönüştürerek dört adet 28 günlük mevsime geçiş. Mevcut mevsim 7 gün. | E §2, G |
| 123 | `T02` | `Y` | P3 | Dört ürün kalitesi, ayrı yığınlar ve satış çarpanları. | E §2, G |
| 124 | `T03` | `Y` | P3 | 100’den fazla oynanabilir tarif ve kalite/süre/açılma dengesi. Mevcut el tarifi sayısı 19. | E §3, G |
| 125 | `T04` | `Y` | P3 | 50’den fazla balık, mevsim/hava/saat tablosu ve albüm. | E §4, G |
| 126 | `T05` | `Y` | P3 | Farklı olta/yem ve pasif yengeç kapanı. | E §4 |
| 127 | `T06` | `Y` | P3 | 30’dan fazla NPC, doğum günleri ve kişisel hikâye görevleri. | E §5, G |
| 128 | `T07` | `Y` | P3 | 10 kalp, 12 yetişkin evlilik adayı, teklif/düğün/aile. | E §5, G |
| 129 | `T08` | `Y` | P3 | Mevsim başına iki festival; yarışma/dans/sezonluk satıcı ve tekilleştirilmiş ödül. | E §5, G |
| 130 | `T10` | `Y` | P3 | Başarımları 49’a genişletme. Mevcut sayı 12. | E §6 |
| 131 | `T11` | `Y` | P3 | Tuz Düzlüğü, Akyel Adası ve Söğüt Bataklığı adlı ileri bölgeler. | E §6 |
| 132 | `T12` | `Y` | P3 | 200’den fazla dekor; duvar/zemin/iç mekân düzenleme. | E §6 |
| 133 | `T14` | `Y` | P3 | Sekiz farklı çiftlik başlangıç haritası ve ayrı başlangıç/ekonomi kabulü. | E §6 |
| 134 | `T15` | `Y` | P3 | Ticari çekirdeğin bütünüyle istemci paketinden ayrılması. Otoriter sunucu var; offline Engine hâlâ istemcide bulunuyor. | E, V |

## Tamamlanmış native özellikler — yeniden TODO yazılmasın

Bu maddeler Codex'in incelediği **kod/belge kapsamı için tamamlandı** diye sınıflanmıştır. Bu, tüm fiziksel cihaz veya prod kabulünün bittiği anlamına gelmez. Yeniden yapılacak görev gibi yazma; yeni geliştirmelerde koru.

| ID | Mevcut sistem / özellik | Kaynak |
|---|---|---|
| `A01` | Son geliştirmeleri yerel Git checkpoint’inde koruma: `55ad765` mevcut, izlenen dosyalar temiz. | M, C |
| `A05` | Eski kayıt formatı, `SAVE_VERSION=1` ve eski depolama anahtarlarını koruma. | I, L, J |
| `A06` | Native IndexedDB’de çift snapshot, atomik head rotasyonu, localStorage geri dönüşü ve bozuk kayıt reddi. | J, Q |
| `A07` | Kayıtlı çıkışta save/ACK bekleme; hata halinde oyunda kalma. | E, J |
| `A12` | Kullanıcı dosyaları, eski dallar ve Sentry worktree’sini koruma. İncelemede korunmuş durumdalar. | M, Git envanteri |
| `B01` | Tinypool 2.1.2, proxy-addr 2.0.8, source-map-js 1.2.2 ve Sharp 0.35.5 dar yamaları. | S |
| `B08` | Native origin, oturum, üyelik, nonce/sıra, replay, boyut ve kota kapıları. | V, O, J |
| `B09` | CSP nonce ve güvenlik başlıkları; script izinlerini genel gevşetmeme. | V, J |
| `B10` | Resmî sitede Sentry ve mahremiyet filtresi. Serbest oyuncu/kayıt/istek verisi filtreleniyor. | M, [mahremiyet kodu](C:/Users/devbu/Roamcroft/lib/monitoring/privacy.ts) |
| `C01` | Toplama, tarım, el/makine üretimi, satış ve inşa temel döngüsü. | M, J |
| `C02` | İsteğe bağlı TR/EN İlk Adımlar; yeniden açma, salt okunur ilerleme ve ayrı tercih. | F |
| `C08` | HUD ve görev panosunun ortak öneri seçmesi; hazır ödüllerin önceliği. | J, F |
| `C09` | Balta/kazma/çapa/sulama/kılıç/olta; mevcut enerji, mesafe ve yükseltme kuralları. | M §2, F |
| `D01` | Gerçek dokuz yuvalı araç/eşya bağlama; canlı stok ve 1–9/dokunma seçimi. | M, [hotbar doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-hotbar-nine-slice.md) |
| `D02` | Seçimin tüketmemesi; kullanımın mevcut Engine/sunucu eylemine gitmesi. | I, J |
| `D03` | Çanta filtreleme/sıralama, seçili eşya ayrıntısı ve miktar tabanlı kapasite. | J, Q |
| `D04` | Depoda 1/10/100/Tümü/özel miktar; yön/onay, güncel stok ve kapasite kontrolü. | [Depo doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-storage-quantity.md) |
| `D05` | Tarif/makine/sipariş için depodan yalnız eksik malzemeyi atomik hazırlama. | E, J |
| `E01` | Altı ekin; mevsim, su, gübre, sera, hasat ve domates/mısır tekrar hasadı. | E, G, J |
| `E02` | Elma/armut fidanı, olgunlaşma, mevsim ve günlük tek hasat. | E, J |
| `E05` | Tavuk/inek/koyun; yem, sevme, bağ, adlandırma, yavru ve elle ürün toplama. | M §7, J |
| `E11` | Tek parti/isteğe bağlı tekrar, girdiyi başta ayırma, çalışan tarifi kilitleme ve dolu çantada çıktı koruma. | G, J |
| `E12` | Alternatif makine tarifleri ve üretim değer karşılaştırması. | G, J |
| `F01` | Üç NPC; sohbet, hediye, rutin, dostluk ve günlük siparişler. | M §8, J |
| `F02` | İki günlük teslim seçeneği, ortak günlük sınır, yarın önizlemesi ve ödül dengesi. | G, J |
| `F03` | Köy dönüm noktalarından türeyen altı hikâye bölümü ve NPC tepkileri. | E, J |
| `F09` | Mevcut 12 başarım, dört koleksiyon, köy hedefleri ve fener sonrası serbest oyun. | M §14 |
| `G01` | Seed/generation 2, kayan dünya penceresi, negatif koordinatlar ve kalıcı editler. | M §18, J |
| `G02` | Gerçek Three.js sahnesinde üç ağaç silueti, altı yer örtüsü ve tavşan/kuş aktörleri. | LF |
| `G03` | Su, kıyı, bulut, yağmur, gece/gündüz ve üretken ses/atölye animasyonları. | E, J |
| `H01` | Beş düşman türü, saldırı hazırlıkları, akın, savunma yapıları ve boss. | M §9, J |
| `H02` | Beş katlı maden, asansör, cevher koşulları ve kontrol noktaları. | M §9, J |
| `H09` | Mevcut balıkçılık: süre/olasılık, enerji ve tek genel balık ürünü. Mini oyun değil. | G, M §9 |
| `I01` | Dört kişilik davet lobisi ve ortak yüzey çiftliği. | O, J |
| `I02` | DO 20 Hz otorite, WS 10 Hz snapshot, prediction/reconciliation ve adaptif tampon. | J |
| `I03` | Özel çantalar, ortak dünya/altın/depo ve üretim alıcısının korunması. | O, J |
| `I04` | Atomik ekonomik ACK, nonce/replay, D1 CAS ve çakışmada durma. | O, J |
| `I05` | Ortak uyku ve tek gün doğumu; reconnect/üyelik değişiminde oy iptali. Eski açık kutuları geçersizleşmiş. | E, J |
| `I06` | Host’a bağlı kalıcı ortak çiftliğin yeni lobiyle yeniden açılması. | O, J |
| `K01` | Merkezi tip güvenli TR/EN sözlükler ve kalıcı tercih. | L |
| `K02` | İlk açılış İngilizce; yalnız açık kayıtlı tercih korunur. Eski otomatik Türkçe kararı sonradan değiştirilmiş. | L, M §11 |
| `K04` | Masaüstü merkez modal, mobil navigasyon, X hit-testing düzeltmesi ve Back/history sıralaması. | J, Q |
| `K05` | İkon atlas kırpması, tek logo, Camp Art karşılama ve çanta/depo ayrımı. | A, J |
| `K06` | Kompakt HUD, birleştirilen bildirimler, dokuz yuvalı mobil palet ve 320px ekim/inşa düzeni. | Q |
| `K08` | Yanlış yazı seçimini azaltırken input, kod ve kopyalanabilir alanları koruma. | M §4, J |
| `K10` | Launcher Ayarlar’ın motor/sahne açmadan çalışacak şekilde ayrılması. | [Hazırlık belgesi](C:/Users/devbu/Roamcroft/docs/CRAZYGAMES_READINESS.md) |
| `K12` | How to Play kaydırma kilidinin route’a özel düzeltilmesi. | [Scroll doğrulaması](C:/Users/devbu/Roamcroft/docs/verification-guide-scroll-alpha.3.md) |
| `L01` | Instancing/batching/culling, sabit görünür slotlar, arazi tamponu tekrar kullanımı ve hayvan batching’i. | J, Q |
| `L02` | Orman model paylaşımı, hiyerarşik culling, habitat bütçesi ve yalnız canlı otların çizilmesi. | Q |
| `L03` | Balanced/Detailed seçimini ve çözünürlük netliğini koruma; menü sürelerini GPU yükü saymama. | J, Q |
| `L04` | CPU/GPU, p95/p99, %1 low, draw call ve ağ ölçümlerini ayıran profil altyapısı. | M §20, CP |
| `M01` | Resmî domain, canonical ve www yönlendirme hazırlığı; tarihli canlı kabul kayıtları var. | R, M |
| `M02` | Kaynak ve üretilen Wrangler’da `workers_dev=false`, `preview_urls=false`. İkisini de okudum. | R |
| `M03` | Eski Production endpoint’inin kapalı olduğuna dair 31 Ekim tarihli 404 kanıtı. Bugün yeniden ölçülmedi. | [SEO canlı günlüğü](C:/Users/devbu/Roamcroft/work/seo-release-live.log) |
| `M05` | Tek oyun varlığında VideoGame/WebApplication, ücretsiz Offer, kategori ve tarayıcı bilgileri. | [Site verisi](C:/Users/devbu/Roamcroft/lib/site.ts) |
| `M06` | Dört sitemap rotası; EN/TR tanıtım ve oyun galerisi kodu. | [Sitemap](C:/Users/devbu/Roamcroft/public/sitemap.xml), yerel main geçmişi |

## Bilinçli olarak bekletilen işler (şu an aktif gündem değil)

- CrazyGames'e ait **J01–J20** maddeleri. Bunların 8'i raporda tamamlandı, 12'si açık/kısmi/belirsiz; ikisi de şu anki roamcroft.com geliştirme önceliği değildir.
- `A02`: CrazyGames tarafına özel 9 commitin yedek/yayın takibi; **kaybetmemek** için Git geçmişinde korunacak ancak portala sürüm hazırlamak amaç değil.
- `A04`: CrazyGames ZIP adaylarını yeniden üretme/hash doğrulama; **ertelendi**.
- `B11`: Portal sayfasının özel Sentry/mahremiyet kabulü; **ertelendi**. Native site mahremiyet filtresi korunur.
- `K03`, `L12`, `M08`, `M11`, `N01` gibi karma maddelerin **native oyuna yarayan kısmı** sıralamada bulunur; portal-özel alt kısmı bekletilir.
- Tarihsel **T01–T15** hedefleri silinmedi. Önceki sistem-gap-review bu genişleme adetlerini zorunlu kota olmaktan çıkarmıştı; bu nedenle bu dosyada ancak uzun vadeli öneridir.

## Güncelleme protokolü

Her Codex paketi sonrası yalnızca ilgili ID'lerin durumu kod ve test kanıtlarıyla güncellensin. Dosya listesini silme; geçmiş isteklerin orijinal kaynağı korunsun. Test/derleme geçmişi yeni çalıştırma olarak sunulmasın. Özellikle kayıt şeması, native online dört oyuncu, site origin, cloud secrets ve üretim verileri etkileniyorsa onay almadan kodu dağıtma.

## Kaynak dosya kısaltmaları

- `M`: `docs/ROAMCROFT_2_0_MASTER_PLAN.md`
- `E`: `docs/development-plan.md`
- `G`: `docs/system-gap-review.md`
- `P`: `docs/PORTAL_ROADMAP.md`
- `F`: `docs/gameplay-foundation-1.13.0.md`
- `I`: `docs/inventory-hotbar-1.14-design.md`
- `A`: `docs/ART_DIRECTION_2_0.md`
- `O`: `docs/online-readiness.md`
- `O2`: `docs/online-roadmap.md`
- `R`: `docs/DOMAIN_POLICY.md`
- `S`: `docs/security-audit-2026-10-30.md`
- `N`: `docs/modularization-plan.md`
- `Q`: `docs/verification-quality-recovery-alpha.3.md`
- `LF`: `docs/verification-living-forest.md`
- `U`: `docs/acceptance-mobile-1.13.1.md`
- `L`: `docs/i18n.md`
- `V`: `docs/server-security.md`
- `J`: `CHANGELOG.md`

İncelenen orijinal rapor: kullanıcının 5 Kasım 2026'da paylaştığı Codex salt okunur master TODO dökümü. Bu dosya **önceliklendirilmiş çalışma kopyasıdır**; repo içindeki Markdown veya kod otomatik değiştirilmemiştir.
