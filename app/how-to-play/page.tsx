import type {Metadata} from 'next';
import {LEGACY_URL} from '@/lib/site';
import './guide.css';

export const metadata:Metadata={title:'How to play Roamcroft — Farming, saves & co-op',
  description:'Start a device farm, grow your first crops, find storage and play with friends. Learn how Roamcroft saves work across its old and new addresses.',
  alternates:{canonical:'/how-to-play'},openGraph:{url:'/how-to-play',title:'How to play Roamcroft'}};

export default function HowToPlay(){
  return <main className="field-guide">
    <a className="guide-back" href="/">← Play Roamcroft / Oyuna dön</a>
    <h1>Roamcroft field guide</h1>
    <p>A home to grow. A valley to explore.</p>
    <nav aria-label="Guide languages"><a href="#english">English</a><a href="#turkce" lang="tr">Türkçe</a></nav>
    <section id="english" lang="en">
      <h2>Your first day</h2>
      <p>Choose Device farm for a local world. Use WASD or the left joystick to walk. Select the axe, then a nearby tree; your character approaches before gathering. Selecting a tool spends nothing.</p>
      <ol><li>Gather wood and stone. Keep some supplies for a workshop or storage chest.</li><li>Use the hoe on empty ground, choose a seed and water the planted soil. Crops grow during active play; out-of-season crops wait.</li><li>Use your hand on a ripe crop. Bring goods to the market to sell, then compare your next building or tool upgrade.</li></ol>
      <p>Open Camp → First steps for optional goals. You can explore, fish, talk to villagers and craft at your own pace. On desktop: E interacts, Tab opens the bag, Escape closes menus. On mobile use the tool button; the separate sword button attacks. Pinch with two fingers to adjust the camera.</p>
      <h2>Your bag and storage</h2>
      <p>The bag shows your supplies; selecting an item does not consume it. Select food or seed to see its action. Storage is separate: build a storage chest from Build first. Then open the bag and scroll to Storage. Choose an item, Store or Take, check the amount and confirm. The server validates online transfers.</p>
      <h2>Play with friends</h2>
      <p>Choose Server farm, then Online to create a room or join by invitation code. Up to four players share the surface farm, time, gold and storage; each keeps a personal bag. The host must stay connected. Shared mines and independent distant exploration are still planned.</p>
      <h2>Keep your farm safe when changing address</h2>
      <p>Device saves belong to the browser and address you used. A new address showing an empty farm does not mean the old one was deleted. Keep the old site open: <a href={LEGACY_URL}>previous Roamcroft address</a>. There, use Settings → Export save; keep the JSON file. On this site choose Device farm and use Load save in the game menu, confirming the replacement only after keeping a backup.</p>
      <p>Server identity uses a secure cookie tied to its address. Local export does not transfer server ownership. Continue using the old address for an existing server farm; automatic account migration is unavailable. Do not clear site data. PWA/offline play needs a successful initial load; gameplay does not advance while closed.</p>
      <h2>Languages and current limits</h2>
      <p>English is the first-visit language; an explicit Turkish or English preference is saved. This is a developing browser game: physical mobile, long sessions and real internet co-op still need wider testing. No account recovery or cross-device cloud identity is available.</p>
    </section>
    <section id="turkce" lang="tr">
      <h2>İlk günün</h2>
      <p>Cihaz çiftliği ile yerel dünyanı aç. WASD veya sol joystick ile yürü. Baltayı, ardından yakındaki ağacı seç; karakter önce yaklaşır. Araç seçmek malzeme harcamaz.</p>
      <ol><li>Odun ve taş topla; atölye veya depo sandığı için biraz ayır.</li><li>Boş zemini çapala, tohum seçip ek ve sula. Ekinler aktif oyun sırasında büyür; mevsim dışındaysa bekler.</li><li>Olgun ekini el aracıyla hasat et. Pazarda ürün satıp sonraki yapı veya araç yükseltmeni karşılaştır.</li></ol>
      <p>Kamp → İlk Adımlar isteğe bağlı hedefler sunar. Masaüstünde E etkileşim, Tab çanta, Escape kapatmadır. Mobilde araç düğmesini kullan; ayrı kılıç düğmesi saldırır. Kamerayı iki parmakla ayarla.</p>
      <h2>Çanta ve depo</h2>
      <p>Eşya seçimi tüketim yapmaz. Kullanım için eşya ayrıntısını aç. Ayrı depoyu görmek için önce İnşa bölümünden depo sandığı kur; sonra çantada aşağıdaki Depo bölümüne ilerle. Eşyayı, Koy veya Al yönünü ve miktarı seçip onayla. Online aktarım sunucuda doğrulanır.</p>
      <h2>Arkadaşlarla oyun</h2>
      <p>Sunucu çiftliği → Online üzerinden oda kur veya davet koduyla katıl. En fazla dört kişi yüzeyi, zamanı, altını ve depoyu paylaşır; çantalar kişiseldir. Ev sahibi bağlı kalmalıdır. Ortak maden ve uzakta bağımsız keşif henüz yoktur.</p>
      <h2>Yeni adrese geçerken kaydını koru</h2>
      <p>Cihaz kaydı tarayıcıya ve adrese bağlıdır. Yeni adreste çiftliğin görünmemesi silindiği anlamına gelmez. <a href={LEGACY_URL}>Eski Roamcroft adresini</a> açıp Ayarlar → Kaydı dışa aktar ile JSON yedeğini sakla. Yeni adreste Cihaz çiftliği → oyun menüsündeki Kaydı yükle yolunu kullan; değiştirme onayından önce yedeğini tut.</p>
      <p>Sunucu kimliği adrese bağlı güvenli çerezdedir. Yerel JSON sunucu sahipliğini taşımaz. Eski sunucu çiftliğin için eski adresi kullan; otomatik hesap göçü yoktur. Site verilerini silme. PWA/çevrimdışı oyun ilk başarılı yüklemeyi gerektirir; kapalıyken oyun ilerlemez.</p>
      <h2>Diller ve sınırlar</h2>
      <p>İlk açılış İngilizcedir; açıkça seçtiğin Türkçe veya İngilizce tercihi korunur. Fiziksel mobil, uzun oturum ve gerçek internet çok oyunculu kabulü genişletilmelidir. Hesap kurtarma ve cihazlar arası sunucu kimliği henüz yoktur.</p>
    </section>
    <a className="guide-back" href="/">Play Roamcroft / Roamcroft oyna →</a>
  </main>;
}
