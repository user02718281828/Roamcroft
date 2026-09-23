# Roamcroft 1.7.0 ekonomi tabanı

Kaynak: `npm run audit:economy`. Fiyatlar doğrudan oyun verisinden hesaplanır. Bu bir oyuncu testi veya sınırsız kazanç tahmini değildir. Süreler birinci seviye, yeteneksiz makine içindir; bina, taşıma, bakım, ekim ve enerji maliyetleri tabloya dahil değildir. Negatif satış farkı, eşyanın yemek veya inşa amacıyla değersiz olduğu anlamına gelmez.

| Makine / tarif | Girdi satış değeri | Çıktı satışı | İşleme farkı | Pazardan girdi al → sat | Tam dostlukta al → sat | Süre (sn) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Yem değirmeni / Temel üretim | 36 | 90 | 54 | 33 | 39 | 55 |
| Balık tütsühanesi / Temel üretim | 51 | 165 | 114 | 84 | 92 | 60 |
| Dokuma atölyesi / Temel üretim | 66 | 75 | 9 | Girdi satılmıyor | Girdi satılmıyor | 65 |
| Dokuma atölyesi / Halat ör | 8 | 24 | 16 | 8 | 12 | 35 |
| Marangoz / Temel üretim | 9 | 20 | 11 | 5 | 5 | 35 |
| Taş ocağı / Temel üretim | 16 | 28 | 12 | 0 | 4 | 50 |
| Taş ocağı / Bakır erit | 44 | 32 | -12 | -38 | -31 | 45 |
| Taş ocağı / Demir erit | 70 | 55 | -15 | -55 | -47 | 65 |
| Yel değirmeni / Temel üretim | 36 | 64 | 28 | 7 | 13 | 45 |
| Yel değirmeni / Yem öğüt | 36 | 80 | 44 | 23 | 29 | 45 |
| Arılık / Temel üretim | 0 | 84 | 84 | 84 | 84 | 150 |
| Mandıra / Temel üretim | 70 | 90 | 20 | -20 | -8 | 80 |
| Köy mutfağı / Temel üretim | 24 | 120 | 96 | 80 | 84 | 70 |
| Köy mutfağı / Elma marmeladı | 126 | 210 | 84 | 12 | 31 | 80 |
| Köy mutfağı / Armutlu tart | 124 | 165 | 41 | -28 | -10 | 85 |
| Köy mutfağı / Ekmek pişir | 67 | 90 | 23 | -15 | -5 | 55 |
| Köy mutfağı / Sebze çorbası | 61 | 130 | 69 | 35 | 43 | 65 |

## On günlük üç sabit üretim planı

Her gün yalnızca bir parti; on gün boyunca aynı tarifi üretme hesabı. Girdilerin hazır ve makinenin kurulmuş olduğu varsayılır. Ekinin/hayvanın tüm yaşam döngüsü simüle edilmez. Sermaye ve emek farklı olduğundan sonuçlar “en iyi oyuncu yolu” sıralaması değildir.

| Plan | 10 günlük girdi | 10 günlük çıktı satışı | Ham satmaya göre fark | Makine yapı malzemesi değeri |
| --- | --- | ---: | ---: | ---: |
| Tahılı işle | 30 wheat | 640 | 280 | 335 |
| Meyveyi kavanozla | 30 apple, 10 honey | 2100 | 840 | 402 |
| Sütü değerlendir | 20 milk | 900 | 200 | 520 |

Günlük siparişler girdi satış değerinin %25 fazlasını (yukarı yuvarlama) altın ve malzeme olarak verir. Her kişi günde tek teslimat kabul eder. Hazır sipariş girdilerini pazardan alıp ödülünü satmak, en yüksek dostluk indiriminde bile zarar eder; bu koşul 28 günlük tüm teklifler için otomatik test edilir. Mevcut makine kârları değiştirilmedi; ilk adım görünür karşılaştırma ve sınırlı talep seçeneğidir. Uzun oturumda oyuncu davranışı ve emek dengesi ayrıca ölçülmelidir.
