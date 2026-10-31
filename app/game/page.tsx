import type { Metadata } from "next";
import styles from "./game.module.css";

const base = "https://roamcroft.com";

const screenshots = [
  {
    filename: "roamcroft-pc-farming-gameplay.webp",
    title: "Farming in a living valley",
    description: "Grow crops beside the river, meet villagers and make a place of your own.",
    alt: "Real Roamcroft PC gameplay showing an isometric riverside farm, crop plots, villagers, trees and a wooden bridge",
    width: 1920,
    height: 1080,
  },
  {
    filename: "roamcroft-pc-forest-exploration.webp",
    title: "Explore the valley",
    description: "Follow winding paths through forests and discover the changing landscape.",
    alt: "Real Roamcroft PC gameplay with a wide view of the low-poly forest, winding blue river, farm plots and small village",
    width: 1920,
    height: 1032,
  },
  {
    filename: "roamcroft-pc-main-menu.webp",
    title: "Your next chapter",
    description: "Start a new device farm or join friends in the browser.",
    alt: "Roamcroft PC start menu featuring the official illustrated valley, Roamcroft logo and launch buttons",
    width: 1920,
    height: 1080,
  },
  {
    filename: "roamcroft-pc-inventory-system.webp",
    title: "Gather and organize",
    description: "Carry the materials and tools you need for your next day in the valley.",
    alt: "Roamcroft PC inventory interface showing the traveler's bag, resources and item descriptions",
    width: 1920,
    height: 1080,
  },
  {
    filename: "roamcroft-pc-night-gameplay.webp",
    title: "A world that changes with time",
    description: "Look after your crops as daylight gives way to night.",
    alt: "Real Roamcroft PC nighttime farming gameplay with crops, characters, a campfire and riverbank",
    width: 1920,
    height: 1080,
  },
  {
    filename: "roamcroft-pc-night-farming.webp",
    title: "Farming after sunset",
    description: "A closer look at the quiet riverside farm after dark.",
    alt: "Close-up of Roamcroft PC nighttime gameplay showing farm plots, characters and a small river bridge",
    width: 560,
    height: 355,
  },
] as const;

export const metadata: Metadata = {
  title: "Roamcroft Screenshots | Free 3D Browser Farming Game",
  description:
    "See real PC gameplay screenshots of Roamcroft, a free isometric 3D browser farming and exploration game with optional 4-player co-op.",
  alternates: { canonical: `${base}/game` },
  openGraph: {
    title: "Roamcroft — Real Gameplay Screenshots",
    description: "Discover the valley, farms, forest and gameplay of Roamcroft.",
    type: "website",
    url: `${base}/game`,
    images: [
      {
        url: `${base}/screenshots/roamcroft-pc-farming-gameplay.webp`,
        width: 1920,
        height: 1080,
        alt: "Roamcroft PC farming gameplay beside the river",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roamcroft — Gameplay Screenshots",
    description: "See the real 3D browser farming world of Roamcroft.",
    images: [`${base}/screenshots/roamcroft-pc-farming-gameplay.webp`],
  },
};

export default function GamePage() {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <nav className={styles.nav} aria-label="Page navigation">
          <a className={styles.brand} href="/" aria-label="Roamcroft home">
            <span className={styles.brandMark} aria-hidden="true">✦</span> Roamcroft
          </a>
          <div className={styles.navActions}>
            <a href="/how-to-play#english">How to play</a>
            <a className={styles.navPlay} href="/">Play free <span aria-hidden="true">↗</span></a>
          </div>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>THE WORLD OF ROAMCROFT · REAL PC GAMEPLAY</p>
          <h1>A living valley. <em>A place to call your own.</em></h1>
          <p className={styles.intro}>
            Grow crops, collect resources, craft, and explore a welcoming 3D world.
            Roamcroft is a free isometric farming and adventure game you can play
            right in your browser — alone or with up to four friends in beta co-op.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="/">Play Roamcroft free <span aria-hidden="true">↗</span></a>
            <a className={styles.secondary} href="#screenshots">Explore screenshots <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.facts} aria-label="Game information">
            <span>3D isometric world</span><span>Free browser game</span><span>Solo &amp; up to 4-player beta co-op</span>
          </div>
        </header>

        <section className={styles.gallerySection} id="screenshots" aria-labelledby="gallery-heading">
          <div className={styles.sectionTitle}>
            <div>
              <p className={styles.eyebrow}>A LOOK INSIDE THE VALLEY</p>
              <h2 id="gallery-heading">Gameplay screenshots</h2>
            </div>
            <p>Captured from the PC browser version of Roamcroft during active alpha development.</p>
          </div>
          <div className={styles.gallery}>
            {screenshots.map((shot, index) => (
              <figure
                key={shot.filename}
                className={`${styles.shot} ${index === 0 ? styles.featured : ""}`}
              >
                <a
                  className={styles.imageLink}
                  href={`/screenshots/${shot.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View full-size screenshot: ${shot.title}`}
                >
                  {/* Regular HTML img makes every screenshot discoverable in the server-rendered page. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/screenshots/${shot.filename}`}
                    alt={shot.alt}
                    width={shot.width}
                    height={shot.height}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className={styles.image}
                  />
                </a>
                <figcaption className={styles.figcaption}>
                  <strong>{shot.title}</strong>
                  <span>{shot.description}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.bottomCta} aria-label="Play Roamcroft">
          <div>
            <p className={styles.eyebrow}>YOUR ADVENTURE STARTS HERE</p>
            <h2>Make the valley your own.</h2>
            <p>Free to play. No download required. Roamcroft is currently in active alpha development.</p>
          </div>
          <a className={styles.primary} href="/">Enter Roamcroft <span aria-hidden="true">↗</span></a>
        </section>
        <footer className={styles.footer}>
          <span>© {new Date().getUTCFullYear()} Roamcroft · Independent browser game</span>
          <a href="/">roamcroft.com</a>
        </footer>
      </div>
    </main>
  );
}
