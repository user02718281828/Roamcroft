# Güvenli yeni çiftlik ve başlangıç seçimi — 5 Kasım 2026

## Kapsam ve öncelik

[Tam yol haritası](NATIVE_ROADMAP_2026_11_05.md) Aşama 0 kayıt güvenliği ile
Aşama 1 C04/C06'nın küçük, oynanabilir devamıdır. Önceki iki kısa görev paketi
korunur. Bu çalışma büyük bina/World3 entegrasyonu veya tüm ilk 30 dakika
denge kabulü değildir. Native önceliği sürer, CrazyGames'e yeni özellik açılmaz.

## Tamamlanan davranış

- Launcher → Yeni oyun, ana menü → Yeni oyun ve Ayarlar → Yeni oyun tek onay
  akışını kullanır. Form açılması/profil seçimi/iptal çiftlik oluşturmaz veya
  kaydı değiştirmez. Varsayılan her yeni formda mevcut rahat başlangıçtır.
- İsteğe bağlı **Yalın başlangıç**: 60 altın; 8 odun, 6 taş, 4 lif, 6 buğday
  tohumu, 4 havuç tohumu, 4 meyve, 2 ekmek. Bu 34 eşyadır. Standart 180 altın
  ve 94 eşya değişmedi. Yalın seçenek daha zorludur; hızlı ilerleme vaadi yoktur.
- Ev/pazar/kamp ateşi, başlangıç ekinleri, dünya generation=2, ekonomi kuralları,
  araçlar, yükseltmeler ve oyunun geri kalanı aynıdır. Tamamen boş çiftlik
  profili değildir; C06'nın tüm kapsamı tamamlandı sayılmaz.
- Yeni seçenek yalnız native cihaz çiftliği için gösterilir. Kişisel sunucu
  ve ortak çiftlik başlangıcına uygulanmaz. Portalda seçim gösterilmez ve
  standart başlangıç korunur. Portal auth/Data Module altyapısı değiştirilmedi.
- Yeni çiftliğe geçiş **saveStored başarılı sonucu gelene kadar bekler**.
  Önceden yeni durum hemen gösterilip asenkron kayıt sonucu beklenmiyordu.
  Artık false/exception durumunda eski Engine/dünya yerinde kalır, onay formu
  hata gösterir. Çift tıklama engellenir; kayıt sırasında form/iptal kilitlidir.
  Yeni kayıt beklenirken eski sahnenin pagehide/visibility kontrol kaydı engellenir.
- Ayarlardaki eski ikinci onay kaldırıldı; büyük panel ile ana menü arasında
  çift onay yerine tek, açık başlangıç formu vardır. Sökme onayı korunur.
- TR/EN, kaydırılabilir dar/yatay form, 44px onay/iptal hedefleri vardır.

## Kayıt güvenliği sınırları

Yeni State alanı, profil metadata'sı veya SAVE_VERSION değişikliği yoktur.
createState ve yükleme fonksiyonları değiştirilmedi; profil yalnız onaylanan
yeni çiftlik fabrikasında uygulanır. Var olan çiftlikte profil otomatik seçilmez.
Mevcut IndexedDB atomik head/snapshot rotasyonu kullanılır. Önceki çiftlik bir
önceki snapshot'ta kalabilir; sonraki otomatik kayıtlar bu yedeği döndürür.
Bu uzun vadeli arşiv değildir: yeni oyuna onay vermeden önce JSON indirmek gerekir.
Gerçek kullanıcı kaydı bu testlerde silinmedi; localhost 8985 ayrı test origin'idir.

Önceki paketin yeni claimed görev kimlikleri için eski build'e geri dönüş sınırı
[ilk paket kaydında](NATIVE_GAMEPLAY_2026_11_05.md) hâlâ geçerlidir. Yeni profil
seçimi bu ayrı sınırı ortadan kaldırmaz. D1/DO şeması veya üretim verisi değişmez.

## Tekrarlanabilir kabul

Yeni dört test: varsayılan ile tam eşitlik/profiller arası veri sızmaması;
üç seed'de gerçek motorun üretim/satış/ilk atölye rotası; kayıt ACK/false/exception;
gerçek fake-indexeddb üzerinde yeni çiftlik yeniden açılışı ve önceki snapshot.
Mevcut storage-rotation testi işlem iptalinde head/yedeğin korunmasını kapsar.
Başlangıç betiği artık current / tarihsel proposal / gerçek lean fabrikasını
ayrı raporlar; eski karşılaştırma kaybolmaz.

| Script ölçümü | Standart | Yalın |
| --- | --- | --- |
| Seed'ler | 42, 84621, 20261029 | aynı |
| Başlangıç altını / eşya | 180 / 94 | 60 / 34 |
| İlk rotadaki kaynak darbesi | 4 | 9 |
| Aktif simülasyon süresi | 17,7 sn | 21,0–22,6 sn |
| Rota sonu altın / enerji | 385 / 100 | 265 / 94,06 |

Bu rotada eski betiğin ödül alma noktaları korunur; yeni iki görevin ödülleri
rota sonundaki testte ayrıca doğrulanır. Rakamlar menü okuması, karar verme,
gerçek giriş gecikmesi veya 30 dakika insan deneyimi değildir. Ek 5 kaynak
darbesi tek başına daha eğlenceli/dengeli olduğunun kanıtı değildir; seçenek
bu nedenle varsayılan yapılmadı.

## Doğrulama ve devam

Son typecheck, 267/267 test, normal build ve CrazyGames uyumluluk build'i geçti.
Dört oyunculu Worker runtime: özel envanter, reconnect, gecikme/tekrar,
D1 çatışmasında dış kaydı koruma ve ortak uyku geçti. Son CSS değişikliği
yalnız form boyutu/hedef alanıdır; final build ve tarayıcı geometrisiyle doğrulandı.
Tarayıcıda iptal → 180 altının korunması; Ayarlar'dan tek onay → 60 altın/34
eşya; kayıt → TR yeniden açılış → 60 altın doğrulandı. Hem İngilizce hem Türkçe
seçenekler görüntülendi; 320×640 ve 740×360 viewport kontrol edildi. Fiziksel
telefon, insanlı ilk 30 dakika ve gerçek WAN kabulü yapılmadı.
Final 320px formda iki düğme 44px yüksek / 233px geniş; yatay taşma yok,
form üst/alt sınırı 12/628px. Yatayda form kaydırılarak iptal düğmesine ulaşılıp
kapatıldı. İki tarayıcı viewport ayarı test sonunda sıfırlandı.
Kanıt: work/new-farm-320-final.png. Eski üç portal ZIP'i yedekten aynı byte'larla
korundu; uyumluluk build'i yeni portal teslimi/QA/Submit anlamına gelmez.

Sonraki öncelik: insan/cihaz kabulünün açık kalemlerini koruyarak 5×4 footprint
entegrasyonunun sürümlü yerleşim/çarpışma dilimi. Eski 1 hücreli yapılar ve
mevcut dünyalar otomatik büyütülmez. World3 aynı pakete karıştırılmaz.
Bu yerel aşama için commit/push/main/deploy yapılmaz; yayın izni yoktur.

Sonraki oturum güncellemesi: ilk gerçek 5×4 ev dilimi ve paused yapı yenilemesi
[büyük yapı kaydında](NATIVE_LARGE_BUILDINGS_2026_11_05.md) tamamlandı. Yukarıdaki
"sonraki öncelik" bu belge checkpoint'inin tarihsel sırasıdır; diğer büyük
yapılar/iç mekânlar/World3 hâlâ açıktır.
Yerel kurtarma checkpoint'i: work/native-progress-20261105/ altında doğrulanmış
Git bundle, tracked değişikliklerin binary patch'i ve bu iki native paketin
untracked yeni dosyaları bulunur. Bu dizin aynı disktedir; başka disk yedeği
veya tarayıcı/üretim oyuncu kaydı yedeği değildir. Kullanıcının iki eski
untracked dosyası değiştirilmedi veya bu pakete dahil edilmedi.
