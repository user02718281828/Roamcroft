# Çevrimiçi gelişim planı

1.4.0'da ayrı bir sunucu dünyası önizlemesi bulunur. `/api/world` sunucu doğrulaması ve anonim HttpOnly oturumla çalışır; ayrıntılar [güvenlik mimarisinde](server-security.md). Bu hesap ve co-op aşamalarını tamamlamaz. Co-op menüsü ve `/api/coop` kapalıdır. `lib/coop/` testli altyapı olarak korunur; önceki Sites kimlik başlıkları bağımsız Workers adresinde güvenilmez.

## 1. Bulut kayıt

Doğrulanmış oturum sağlayıcısı ve kullanıcıya bağlı D1 `saves` tablosu: `user_id`, `game_state`, `revision`, `updated_at`. Sunucu kullanıcı kimliğini oturumdan çıkarmalıdır. Kaydetme karşılaştırmalı sürüm denetimiyle yapılmalı; çakışmada iki kayıt da korunmalıdır. Cihazdaki IndexedDB kaydı çevrimdışı çalışmaya devam eder; hesap açılması mevcut dünyayı sıfırlamaz. Şema değişiklikleri yedekli migration ile uygulanır.

## 2. Asenkron sosyal özellikler

İzin verilen köylerin salt okunur ziyaretleri, teslimatı kimlik anahtarıyla tekilleştirilen hediyeler ve sunucuda doğrulanan ilerlemeye dayalı sıralama. Ziyaretçinin komutları köy sahibinin kaydını değiştiremez. Paylaşım kapatılabilir ve istekler hız sınırlamasına tabidir.

## 3. Gerçek zamanlı co-op

Her oda için Durable Object, WebSocket bağlantıları, sunucunun yönettiği sabit simülasyon adımı ve en fazla dört doğrulanmış oyuncu. Komut sırası, tekrar denemeler, kopma/yeniden katılma ve eş zamanlı hasat testleri zorunludur. Dünyanın tamamını sürekli göndermek yerine bölge değişimleri ve yakındaki nesne farkları iletilir. Kalıcı anlık görüntüler D1/R2'ye aralıklı yazılır. Kapalı testte kayıt tutarlılığı ve gecikme hedefleri sağlandıktan sonra menü açılır.

Bu sayfadaki hesap ve çok oyunculu aşamalar gelecek çalışmadır; 1.4.0 özelliği olarak sunulmaz.
