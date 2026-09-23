import {BUILDINGS} from '../lib/game/data.ts';
import {machineRecipes} from '../lib/game/production.ts';
import {processingValue,bagValue} from '../lib/game/economy.ts';

console.log('# Roamcroft 1.7.0 ekonomi tabanı\n');
console.log('Kaynak: `npm run audit:economy`. Fiyatlar doğrudan oyun verisinden hesaplanır. Bu bir oyuncu testi veya sınırsız kazanç tahmini değildir. Süreler birinci seviye, yeteneksiz makine içindir; bina, taşıma, bakım, ekim ve enerji maliyetleri tabloya dahil değildir. Negatif satış farkı, eşyanın yemek veya inşa amacıyla değersiz olduğu anlamına gelmez.\n');
console.log('| Makine / tarif | Girdi satış değeri | Çıktı satışı | İşleme farkı | Pazardan girdi al → sat | Tam dostlukta al → sat | Süre (sn) |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for(const [type,building] of Object.entries(BUILDINGS))for(const r of machineRecipes(type)){
  const normal=processingValue({friendship:{}},r),friend=processingValue({friendship:{narin:100}},r);
  console.log(`| ${building.name} / ${r.name} | ${normal.input} | ${normal.output} | ${normal.added} | ${normal.purchasedMargin??'Girdi satılmıyor'} | ${friend.purchasedMargin??'Girdi satılmıyor'} | ${r.time} |`);
}
console.log('\n## On günlük üç sabit üretim planı\n');
console.log('Her gün yalnızca bir parti; on gün boyunca aynı tarifi üretme hesabı. Girdilerin hazır ve makinenin kurulmuş olduğu varsayılır. Ekinin/hayvanın tüm yaşam döngüsü simüle edilmez. Sermaye ve emek farklı olduğundan sonuçlar “en iyi oyuncu yolu” sıralaması değildir.\n');
console.log('| Plan | 10 günlük girdi | 10 günlük çıktı satışı | Ham satmaya göre fark | Makine yapı malzemesi değeri |');
console.log('| --- | --- | ---: | ---: | ---: |');
for(const [name,type,id] of [['Tahılı işle','mill','default'],['Meyveyi kavanozla','kitchen','applejam'],['Sütü değerlendir','dairy','default']]){
  const r=machineRecipes(type).find(r=>r.id===id)!,v=processingValue({friendship:{}},r);
  console.log(`| ${name} | ${Object.entries(r.input).map(([id,n])=>`${n*10} ${id}`).join(', ')} | ${v.output*10} | ${v.added*10} | ${bagValue(BUILDINGS[type].cost)} |`);
}
console.log('\nGünlük siparişler girdi satış değerinin %25 fazlasını (yukarı yuvarlama) altın ve malzeme olarak verir. Her kişi günde tek teslimat kabul eder. Hazır sipariş girdilerini pazardan alıp ödülünü satmak, en yüksek dostluk indiriminde bile zarar eder; bu koşul 28 günlük tüm teklifler için otomatik test edilir. Mevcut makine kârları değiştirilmedi; ilk adım görünür karşılaştırma ve sınırlı talep seçeneğidir. Uzun oturumda oyuncu davranışı ve emek dengesi ayrıca ölçülmelidir.');
