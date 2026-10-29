# Envanter etkileşim dilimi — kesin depo miktarı

Taban Camp Art `f87fadd`; geliştirme dalı, yayımlanmadı. Bu bir 1.14.0
hotbar/ekipman/slot veya şema göçü teslimi değildir.

Oyuncu 1/10/100/Tümü ya da özel tam sayı seçer. Koy/Al düğmesi gerçek
aktarılabilecek miktarı gösterir; yön/miktar onaylanmadan stok değişmez.
Varsayılan1, yanlışlıkla bütün stoku aktarmayı azaltır. Miktar/eşya değişimi
bekleyen onayı iptal eder. Eski miktar modeli ve kapasite aynıdır.

`storageQuote` yalnız gösterimdir: pozitif güvenli tam sayı, stok ve boş
kapasiteyle sınırlanır. Onayda güncel teklif/imza yeniden hesaplanır. Asıl
Engine/sunucu doğrulaması ve komut sırası/tekrar koruması değiştirilmedi.
Yeni API, veri alanı, şema veya ekonomi kuralı yoktur; online stok ACK bekler.

Node22.13.0/npm10.9.2: typecheck, **222/222 tam test**, build başarılı;
son test iyileştirmesi sonrası4 hedefli test de geçti. Build **2,947,206 bayt**,
tahmini aktarım1,558,333; değişmeyen3MB bütçe. `check:runtime` başarılı:
HTTP/SEO/CSP, dört WS, atomik stok, tekrar/kayıp/reconnect/restart, dış D1
çakışması ve ortak uyku. Tam loglar yerel `work/storage-quantity-*`.

390×844 gerçek tarayıcı girdisi, yerel/bellek StoragePanel fixture'ı:
25 odun → 7 koy → çanta18/depo7;3 alma iptali aynı miktarda kaldı;
3 almanın çift tıklanan onayı → çanta21/depo4 (toplam25), ikinci aktarım yok.
0 girilince iki yön de kapandı. Bu fiziksel Android veya gerçek WAN testi
değildir. Tekrar: build sonrası `node scripts/check-menu-touch.mjs --storage`.
Fixture kayıt/API/WS istemcisi açmaz. Görsel yerel `work/storage-quantity-confirm.jpg`.

**DOĞRULAMA EKSİK:** fiziksel Android/iPhone ve gerçek ortak çiftlikte kullanıcı
kabulü. **PLANLANDI:** referanslı gerçek9-slot hotbar/ekipman/drag-drop ve mobil
seç/taşı; şema/otorite etkileri ayrı onay ve göç testleri gerektirir. Sonraki
paket bu sınırlı dilimi tam Inventory2.0 gibi sunmamalıdır.
