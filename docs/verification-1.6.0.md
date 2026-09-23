# 1.6.0 doğrulama — 22 Eylül 2026

- TypeScript kontrolü ve 120 test başarılı. Yeni testler: tek parti, malzemeyi bir kez ayırma, tarif kilidi, duraklatma, otomatik tekrar, eski kayıt kısmi ilerlemesi, kayıt/harita geçişi, dolu çanta, sökmede girdi iadesi, sunucu komutları, geçersiz kayıt reddi, tekrar hasat, su/mevsim ve planlayıcı süreleri.
- Üretim derlemesi başarılı. Statik dosyalar 2.64 MB, tahmini sıkıştırılmış toplam 1.48 MB; bunlar ilk yükleme aktarımı veya PageSpeed ölçümü değildir.
- Yerel üretim HTTP kontrolü başarılı: hafif başlangıç, nonce CSP, güvenlik başlıkları, dosyalar, service worker, oturum ve CORS.
- Sahne testinde statik dünya 25 bölgede 5 çizim çağrısını korur. Yeni üretim verileri mevcut simülasyon döngüsündedir; yeni render döngüsü yoktur.
- Yerel CPU ölçümü: 3.600 kare / 72 hayvan için simülasyon medyanı 0.021 ms, p95 0.305 ms; A* p95 0.366 ms. Bu ölçüm tarayıcı GPU FPS değeri değildir.
- Fiziksel Android/PWA testi, yeni Lighthouse ve uzun oturum GPU ölçümü yapılmadı. Tüm cihazlarda sabit FPS iddiası yoktur.

- Kontrollü yerel kayıtla tarayıcıda değirmen → yem ve mutfak → elma marmeladı tarifleri seçildi. Başlatmada buğday 12'den 9'a, elma 9'dan 6'ya, bal 3'ten 2'ye düştü; partiler bitince çantada 8 yem ve 2 marmelat görüldü. Domates hasadı 4 ürün verdi ve kök yeniden büyümeye başladı.
- 844 × 390 yatay makine menüsü ve 390 × 844 dikey ekim planı kontrol edildi; belge boyutları viewport ile aynı, yatay taşma yok. Uzayan içerik, hayvanları ve el üretimini aşağı itmesin diye iki yeni bölüm açılır/kapanır yapıldı.

## Canlı yayın ve CI — 23 Eylül 2026

- 1.6.0 Cloudflare Workers üzerinde yayında. Canlı HTTP kontrolü başarılı; tarayıcıda sürüm etiketi, oyun sahnesi, açılır ekim planı ve makine bölümü doğrulandı. Tarayıcı hata günlüğünde hata yoktu. Canlı kayda test envanteri yüklenmedi.
- [GitHub CI](https://github.com/user02718281828/Roamcroft/actions/runs/35846216706) başarılı: bağımlılık kurulumu, TypeScript, 120 test, üretim derlemesi ve HTTP/CSP kontrolü. Workers Builds kontrolü de başarılı.
- Önceki CI çalışmasında `/api/world` yanıtının güvenlik başlığı kontrolü başarısız olmuştu. Temiz yerel D1 veritabanında ve canlıda tekrarlanmadı. HTTP testine durum kodunu önce bildiren hata mesajı, iş akışına başarısızlıkta sunucu günlüğü eklendi; hiçbir doğrulama kaldırılmadı veya yeniden denemeyle gizlenmedi. Son CI geçti; ilk hatanın kök nedeni mevcut kayıttan belirlenemedi.
