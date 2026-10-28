# Portal i18n — yerel doğrulama

1.11.5 tabanında Türkçe/İngilizce desteği için Windows üzerinde taşınabilir
Node **22.13.0**, npm **10.9.2** kullanıldı. Paket ve kilit dosyaları değişmedi;
yeniden kurulum veya bağımlılık yükseltmesi yapılmadı.

| Kontrol | Sonuç |
| --- | --- |
| `npm run typecheck` | Başarılı; anahtar, yer tutucu adları ve değer tipleri denetlendi. |
| `npm test` | 193 başarılı, 0 başarısız, 0 atlanan; son tam koşu yaklaşık 15,60 saniye. 185 mevcut + 8 yeni test. |
| `npm run build` | Başarılı; finalize ve varlık bütçesi geçti. |
| `node scripts/generate-i18n.mjs --check` | 1.310 girdide anahtar/yer tutucu eşliği, tip dosyası ve iki manifest güncelliği geçti. |
| `npm run check:runtime` | Yerel üretim Worker/D1/DO, dört gerçek WebSocket istemcisi, gecikme/kayıp/yeniden bağlantı, Worker yeniden başlatma, kayıt çakışması ve ortak uyku kontrolleri geçti. |
| `git diff --check` | Başarılı. |

Statik toplam **2.820.762 bayt**, tahmini sıkıştırılmış aktarım **1.544.821
bayt**; bütçe **3.000.000 bayt**. Bunlar derleme ölçümleridir; gerçek aktarım
veya fiziksel cihaz performansı iddiası değildir.

## Yeni testlerin kapsamı

- Sözlüklerin eksiksizliği, tüm katalog etiketleri ve NPC konuşmaları.
- Birincil tarayıcı dilinin algılanması, kayıtlı tercihin önceliği, geçersiz ve
  desteklenmeyen dilde İngilizce; kapalı depolama durumunda oturum seçimi.
- Ayrı tercih anahtarı, abonelik bildirimi ve abonelikten çıkış.
- Tip güvenli anahtar/parametreler, sıfır değerleri, oyuncu metnindeki `$&` ve
  süslü parantezlerin gerçek metin olarak korunması.
- Eşya adları içeren kanonik sunucu olayları, mevsim listeleri, büyük/küçük
  harfler ve kullanıcı adlarının korunması.
- Dil değişiminde Engine/state/ağ nesnesi kimliği, komut parametreleri, kayıt
  payload/checksum, eski format ve protokol sürümlerinin korunması.
- PWA manifestlerinde ortak uygulama kimliği/origin ve çevrimdışı kabuk girdisi.

## Tarayıcı kontrolü

Canlı adrese gidilmeden `127.0.0.1:8877` ve son derleme için ayrı
`127.0.0.1:8878` origin'leri kullanıldı. İlk açılış tarayıcı dilinden Türkçe
oldu. Başlangıç ekranı İngilizceye geçirildi ve yenilemede seçim korundu.
İngilizce HUD, görev açıklaması ve ayarlar görüntülendi. Açık ayarlarda Türkçeye
geçiş paneli ve köy adını korudu; erişilebilirlik ve ses etiketleri de değişti.
WebMCP başlık/açıklamalarının dil değişimi gözlendi. İki kontrolde tarayıcı hata
kaydı boştu. Yerel ekran görüntüleri `work/i18n-settings-tr.jpg` ve
`work/i18n-settings-en.jpg` altında tutuldu; `work` Git tarafından yok sayılır.
Geçici sekme ve sunucular kapatıldı.

## Koşu sırasında düzeltilenler ve sınırlar

Yeni testte protokol sabitinin adı düzeltildi. Testin yakaladığı mevsim listesi
çevirisi ve görsel kontrolde görülen cümle harfi düzeltildi. HTTP kontrolündeki
eski Türkçe başlangıç ekranı beklentisi İngilizce SSR, iki dil seçeneği ve iki
manifesti denetleyecek şekilde güncellendi; nonce/başlık/otorite kontrolleri
korundu. Son build ilk denemesinde açık önizleme nedeniyle Windows `EBUSY`
verdi; önizleme kapatıldıktan sonra aynı komut başarılı oldu.

Vinext rota sınıflandırma, punycode ve deneysel Node API uyarıları vardı;
bağımlılık değişikliğiyle bastırılmadılar. 23 güvenlik bulgusu bu görevde
giderilmedi ve yeniden audit yapılmadı. Fiziksel Android/PWA yaşam döngüsü,
hedef portal iframe/SDK, gerçek WAN/çok cihaz, uzun oturum ve tüm içeriğin
editoryal İngilizce kontrolü tamamlanmış sayılmaz. Varsayılan sosyal paylaşım
görselindeki Türkçe yazılar için portal yayın aşamasında ayrı görseller gerekir.
Commit, push ve canlı dağıtım yapılmadı.
