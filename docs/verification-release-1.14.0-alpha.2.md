# 1.14.0-alpha.2 — Living Forest yayın kaydı

30 Ekim son kullanıcı talimatı: f014c79/c7bc91d Living Forest için başarılı
son kontrollerle bir defalık normal main push/Workers Builds production yayını
onaylıdır. Fiziksel orman performansı yayın sonrasına ertelendi. Sonraki HUD,
rehber scroll ve içerik işleri bu onaya dahil değildir.

Taban3331e6af8aa67dac6432879fb1729d95dadd3510/alpha.1; kaynak f014c79,
dal c7bc91d. Engine/save/world/server/coop/monitoring/worker/DB değişmedi;
E/F prototip kaynakları yok. Dört güvenlik patch'i ve20 audit bulgusu
(0 kritik/8 yüksek/11 orta/1 düşük) korunur; mevcut erişim sınıflandırması
security-audit-2026-10-30.md. Yeni ulaşılabilir kritik/yüksek istismar kanıtı yok.

Kaynak/sahne eski kayıt/232 test/4WS ve model/dispose/performans kanıtı
verification-living-forest.md. Son HUD/menü/hotbar/depo kodu alpha.1 ile aynı;
kullanıcı alpha.1 gerçek Android X/Close/hotbar/depo/joystick/balta/saldırı/
pinch/kayıt erişimini başarılı bildirdi. Bu, yeni ormanın Android FPS kabulü
anlamına gelmez. Yeni son typecheck/test/build/runtime ve canlı sonuç aşağıya
kaydedilir; ön kabul canlı yayın başarısı değildir.

Rollback referansı alpha.1/3331e6af8aa67dac6432879fb1729d95dadd3510;
yalnız onaylı uygulama/source revert ile normal ileri commit. D1/DO veri/
şema geri alma, sıfırlama, force/reset, DNS veya eski origin yönlendirmesi yok.

## Son yerel yayın turu

232/232 test,0 hata/atlanan,18.02s; typecheck/build/4WS runtime çıkış0.
Statik2,963,483 bayt;3MB bütçe değişmedi. Nonce/CSP/SEO/robots/sitemap/
marka/SW/CORS,4WS gecikme/kayıp/tekrar/reconnect/restart,stok/üretim sahipliği,
D1 çakışması ve ortak uyku geçti. Loglar work/alpha2-release-*.log.
Son test turundan sonra yalnız release belgesi/README/AGENTS değişti;
uygulama kodu f014c79 ile aynıdır. Önceki eski kayıt ve gerçek sahne kabulü
aynı kod için verification-living-forest.md içinde korunur.

## Canlı sonuç — 30 Ekim

Normal fast-forward main push: `914bde9360078576eee0a51bf70295e4de3f45b7`.
GitHub verify [41029611889](https://github.com/user02718281828/Roamcroft/actions/runs/41029611889)
ve Workers Builds `72555405-f22f-4580-889e-80f1f168f927` success.
`https://roamcroft.com` ve eski Worker origin HTTP200/1.14.0-alpha.2;
WWW301/root, SEO/robots/sitemap/rehber/manifest/SW/marka hash'leri, güvenlik
başlıkları ve her istekte yeni script nonce doğrulandı. Her iki originde
çerezsiz WS401; yetkili dört oyuncu kanıtı yerel+CI, gerçek WAN değildir.
Canlı scene-C7JWq3yO.js içinde forestActors/rabbit/bird/canopy bulundu.
Gerçek sahne 390×844 açıldı, sekiz forest actor ve 3.600 tile çizildi;
menü açma/kapatma görüldü. Fiziksel forest performansı hâlâ bekliyor.

Yerel varsayılan DNS EAI_AGAIN verdi; salt okunur kabul, açık DNS cevabıyla
sadece doğrulama sürecinde host lookup kullanılarak tekrarlandı. HTTPS host,
SNI ve sertifika doğrulaması korundu; sistem DNS/TLS ayarı değiştirilmedi.
Log `work/alpha2-live-acceptance-dns.log`. Oturum/üretim test çiftliği açılmadı.

Sonraki HUD/rehber dalı bu main'den başlar ve ayrıca yayın onayı gerektirir.
