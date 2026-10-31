import styles from "./game.module.css";
import ScrollAccess from "./ScrollAccess";

type Locale = "en" | "tr";

type Screenshot = {
  filename: string;
  width: number;
  height: number;
  title: { en: string; tr: string };
  detail: { en: string; tr: string };
  alt: { en: string; tr: string };
};

const screenshots: Screenshot[] = [
  {
    filename: "roamcroft-pc-farming-gameplay.webp", width: 1920, height: 1080,
    title: { en: "The riverside farm", tr: "Nehir kıyısındaki çiftlik" },
    detail: { en: "Cultivated plots, winding paths and the everyday rhythms of the valley.", tr: "Ekin alanları, patikalar ve vadinin günlük yaşamı." },
    alt: { en: "Roamcroft PC farming gameplay with planted crops, characters, forest trees, a river and wooden bridge", tr: "Roamcroft PC çiftçilik oynanışı: ekili tarlalar, karakterler, orman ağaçları, nehir ve ahşap köprü" },
  },
  {
    filename: "roamcroft-pc-forest-exploration.webp", width: 1920, height: 1080,
    title: { en: "Beyond the footpaths", tr: "Patikaların ötesinde" },
    detail: { en: "A wider look at the low-poly forest, waterways and open terrain.", tr: "Düşük poligonlu orman, su yolları ve açık araziden geniş bir görünüm." },
    alt: { en: "Wide Roamcroft PC screenshot showing an isometric green forest, paths, wooden bridges and a blue river", tr: "İzometrik yeşil ormanı, patikaları, ahşap köprüleri ve mavi nehri gösteren geniş Roamcroft PC ekran görüntüsü" },
  },
  {
    filename: "roamcroft-pc-night-gameplay.webp", width: 1920, height: 1080,
    title: { en: "The valley after dark", tr: "Karanlık çöktüğünde vadi" },
    detail: { en: "Life continues around the fields as day turns to night.", tr: "Gündüz geceye dönerken tarlaların çevresinde yaşam sürer." },
    alt: { en: "Nighttime Roamcroft PC gameplay with characters, planted fields, a campfire and riverside trees", tr: "Karakterler, ekili tarlalar, kamp ateşi ve nehir kıyısı ağaçlarıyla gece Roamcroft PC oynanışı" },
  },
  {
    filename: "roamcroft-pc-inventory-system.webp", width: 1920, height: 1080,
    title: { en: "A traveler's provisions", tr: "Gezginin erzakları" },
    detail: { en: "Tools, gathered materials and supplies in the traveler's bag.", tr: "Gezgin çantasındaki aletler, toplanmış malzemeler ve erzaklar." },
    alt: { en: "Roamcroft PC inventory screen showing a traveler's bag with tools, produce, resources and item details", tr: "Aletler, ürünler, kaynaklar ve eşya detaylarını gösteren Roamcroft PC gezgin çantası envanter ekranı" },
  },
  {
    filename: "roamcroft-pc-main-menu.webp", width: 1920, height: 1080,
    title: { en: "Begin a new chapter", tr: "Yeni bir sayfa aç" },
    detail: { en: "Enter the world through the browser. No download required.", tr: "İndirme gerektirmeden tarayıcından dünyaya gir." },
    alt: { en: "Roamcroft PC main menu with illustrated landscape, game logo and play options", tr: "Resimli manzara, oyun logosu ve oynama seçenekleri bulunan Roamcroft PC ana menüsü" },
  },
  {
    filename: "roamcroft-pc-night-farming.webp", width: 560, height: 355,
    title: { en: "A quieter moment", tr: "Sakin bir an" },
    detail: { en: "A closer view of the crops and riverbank at night.", tr: "Gece vakti ekinlere ve nehir kıyısına daha yakından bakış." },
    alt: { en: "Close-up of Roamcroft PC nighttime farm plots, characters and river edge", tr: "Roamcroft PC gece çiftlik tarlalarını, karakterlerini ve nehir kıyısını gösteren yakın plan" },
  },
];

const copy = {
  en: {
    navWorld: "The world", navGallery: "Screenshots", navGuide: "How to play", navPlay: "Play free",
    chapter: "AN ORIGINAL BROWSER ADVENTURE", titleA: "A little land.", titleB: "A world of your own.",
    intro: "Welcome to Roamcroft: an independent 3D isometric farming and exploration game. Tend your farm, gather resources, make useful tools and discover the valley at your own pace.",
    heroButton: "Enter the valley", secondaryButton: "See real gameplay", featuredLabel: "ACTUAL PC GAMEPLAY", heroPhotoAlt: "Roamcroft's bright isometric farming valley with planted fields, woodland, characters and bridges over a river",
    infoA: "Free to play", infoB: "In your browser", infoC: "Solo or up to 4 players in beta co-op",
    noteIndex: "THE FIELD JOURNAL", noteTitle: "Every valley has a story.",
    noteBody: "There is room here for slow mornings among your crops, practical work with your tools, and journeys through the trees. Roamcroft is still growing in active alpha development; these are genuine screenshots of the PC browser version.",
    noteA: "01 / CULTIVATE", noteAText: "Plant and care for your fields.", noteB: "02 / EXPLORE", noteBText: "Find your way through a living landscape.", noteC: "03 / SHARE", noteCText: "Play alone or join a beta co-op world with friends.",
    galleryIndex: "SCENES FROM THE VALLEY", galleryTitle: "Seen in Roamcroft", galleryText: "Six real in-game PC screenshots. Select any image to open it at its original published resolution.",
    imageOpen: "Open full-size screenshot", endIndex: "YOUR NEXT CHAPTER", endTitle: "The valley is waiting.",
    endText: "Start a device farm or explore beta co-op with friends. Roamcroft is free, playable in the browser and currently in active alpha.",
    foot: "Independent browser farming and exploration game", footNote: "Actual PC gameplay · Active alpha", languageLabel: "Language", playAria: "Play Roamcroft in your browser",
  },
  tr: {
    navWorld: "Dünya", navGallery: "Görseller", navGuide: "Nasıl oynanır?", navPlay: "Ücretsiz oyna",
    chapter: "ÖZGÜN BİR TARAYICI MACERASI", titleA: "Küçük bir toprak.", titleB: "Sana ait bir dünya.",
    intro: "Roamcroft'a hoş geldin: bağımsız bir 3D izometrik çiftçilik ve keşif oyunu. Çiftliğini geliştir, kaynak topla, aletlerini hazırla ve vadiyi kendi hızında keşfet.",
    heroButton: "Vadiye gir", secondaryButton: "Gerçek oynanışı gör", featuredLabel: "GERÇEK PC OYNANIŞI", heroPhotoAlt: "Roamcroft'un ekili tarlaları, ormanları, karakterleri ve nehir köprüleriyle aydınlık izometrik çiftlik vadisi",
    infoA: "Oynaması ücretsiz", infoB: "Tarayıcında oyna", infoC: "Tek başına veya 4 kişiye kadar beta eşli oyun",
    noteIndex: "VADİ GÜNLÜĞÜ", noteTitle: "Her vadinin bir hikâyesi var.",
    noteBody: "Burada ekinlerin arasında sakin sabahlara, aletlerinle üretmeye ve ormanın içinden geçen keşiflere yer var. Roamcroft aktif alfa geliştirme sürecinde; gördüğün görseller PC tarayıcı sürümünden alınmış gerçek ekran görüntüleridir.",
    noteA: "01 / ÇİFTÇİLİK", noteAText: "Tarlalarını ek ve ürünlerine bak.", noteB: "02 / KEŞİF", noteBText: "Yaşayan bir doğada yolunu bul.", noteC: "03 / BİRLİKTE", noteCText: "Tek başına oyna ya da arkadaşlarınla beta eşli dünyaya katıl.",
    galleryIndex: "VADİDEN KARELER", galleryTitle: "Roamcroft'tan görüntüler", galleryText: "PC sürümünden altı gerçek oyun görüntüsü. Yayımlanan tam boyutu görmek için bir görsele tıkla.",
    imageOpen: "Tam boyutlu ekran görüntüsünü aç", endIndex: "YENİ BİR SAYFA", endTitle: "Vadi seni bekliyor.",
    endText: "Kendi cihazında bir çiftlik başlat veya arkadaşlarınla beta eşli oyuna katıl. Roamcroft ücretsizdir, tarayıcıda oynanır ve aktif alfa geliştirme sürecindedir.",
    foot: "Bağımsız tarayıcı çiftçilik ve keşif oyunu", footNote: "Gerçek PC oynanışı · Aktif alfa", languageLabel: "Dil", playAria: "Roamcroft'u tarayıcıda oyna",
  },
} as const;

export default function GameShowcase({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const isTr = locale === "tr";
  const help = isTr ? "/how-to-play" : "/how-to-play#english";
  return (
    <main className={styles.page} lang={locale} id="roamcroft-game-showcase" data-roamcroft-game>
      <ScrollAccess />
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <a className={styles.wordmark} href="/" aria-label={t.playAria}>
            <span className={styles.wordmarkName}>Roamcroft</span>
            <span className={styles.wordmarkSub}>THE LIVING VALLEY</span>
          </a>
          <nav className={styles.navigation} aria-label={isTr ? "Sayfa gezinmesi" : "Page navigation"}>
            <a href="#world">{t.navWorld}</a>
            <a href="#screenshots">{t.navGallery}</a>
            <a href={help}>{t.navGuide}</a>
          </nav>
          <div className={styles.topActions}>
            <nav className={styles.language} aria-label={t.languageLabel}>
              <a href="/game/tr" hrefLang="tr" lang="tr" aria-current={isTr ? "page" : undefined} className={isTr ? styles.currentLanguage : ""}>TR</a>
              <span aria-hidden="true" className={styles.languageDivider} />
              <a href="/game" hrefLang="en" lang="en" aria-current={!isTr ? "page" : undefined} className={!isTr ? styles.currentLanguage : ""}>EN</a>
            </nav>
            <a className={styles.topPlay} href="/">{t.navPlay}</a>
          </div>
        </header>

        <section className={styles.hero} id="world" aria-labelledby="game-heading">
          <div className={styles.heroCopy}>
            <p className={styles.overline}>{t.chapter}</p>
            <h1 id="game-heading"><span>{t.titleA}</span><em>{t.titleB}</em></h1>
            <p className={styles.lead}>{t.intro}</p>
            <div className={styles.heroLinks}>
              <a href="/" className={styles.mainCta}>{t.heroButton}</a>
              <a href="#screenshots" className={styles.outlineCta}>{t.secondaryButton}</a>
            </div>
            <div className={styles.gameFacts} aria-label={isTr ? "Oyun özellikleri" : "Game features"}>
              <span>{t.infoA}</span><span>{t.infoB}</span><span>{t.infoC}</span>
            </div>
          </div>
          <figure className={styles.heroScene}>
            <div className={styles.heroSceneTop} aria-hidden="true"><span>ROAMCROFT / 001</span><span>PC CAPTURE</span></div>
            <img
              src="/screenshots/roamcroft-pc-farming-gameplay.webp"
              alt={t.heroPhotoAlt}
              width={1920} height={1080} fetchPriority="high" decoding="async"
              className={styles.heroImage}
            />
            <figcaption>{t.featuredLabel}</figcaption>
          </figure>
        </section>

        <section className={styles.fieldNotes} aria-labelledby="journal-heading">
          <div className={styles.fieldIntro}>
            <p className={styles.overline}>{t.noteIndex}</p>
            <h2 id="journal-heading">{t.noteTitle}</h2>
            <p>{t.noteBody}</p>
          </div>
          <div className={styles.fieldFeatures}>
            <div><span>{t.noteA}</span><p>{t.noteAText}</p></div>
            <div><span>{t.noteB}</span><p>{t.noteBText}</p></div>
            <div><span>{t.noteC}</span><p>{t.noteCText}</p></div>
          </div>
        </section>

        <section className={styles.screenshotsSection} id="screenshots" aria-labelledby="screenshots-heading">
          <div className={styles.sectionHead}>
            <div><p className={styles.overline}>{t.galleryIndex}</p><h2 id="screenshots-heading">{t.galleryTitle}</h2></div>
            <p>{t.galleryText}</p>
          </div>
          <div className={styles.gallery}>
            {screenshots.map((shot, index) => (
              <figure key={shot.filename} className={`${styles.card} ${index === 0 ? styles.wideCard : ""}`}>
                <a
                  href={`/screenshots/${shot.filename}`}
                  target="_blank" rel="noopener noreferrer"
                  className={styles.cardImageLink}
                  aria-label={`${t.imageOpen}: ${shot.title[locale]}`}
                >
                  {/* Standard server-rendered img elements preserve Google Images discovery. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/screenshots/${shot.filename}`} alt={shot.alt[locale]}
                    width={shot.width} height={shot.height} loading="lazy" decoding="async" className={styles.cardImage}/>
                </a>
                <figcaption className={styles.cardCaption}>
                  <span className={styles.cardNumber}>{String(index + 1).padStart(2,"0")} / 06</span>
                  <div><h3>{shot.title[locale]}</h3><p>{shot.detail[locale]}</p></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.finalPanel} aria-labelledby="next-heading">
          <div>
            <p className={styles.overline}>{t.endIndex}</p>
            <h2 id="next-heading">{t.endTitle}</h2>
            <p>{t.endText}</p>
          </div>
          <a href="/" className={styles.mainCta}>{t.navPlay}</a>
        </section>
        <footer className={styles.footer}>
          <div><span className={styles.footerBrand}>Roamcroft</span><span>{t.foot}</span></div>
          <p>{t.footNote}</p>
          <a href="/">roamcroft.com</a>
        </footer>
      </div>
    </main>
  );
}
