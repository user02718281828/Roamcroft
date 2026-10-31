import type { Metadata } from "next";
import GameShowcase from "./GameShowcase";

const base = "https://roamcroft.com";

export const metadata: Metadata = {
  title: "Roamcroft Gameplay & Screenshots | Free 3D Browser Farming Game",
  description: "Explore real PC gameplay screenshots of Roamcroft, a free 3D isometric browser farming and adventure game with solo play and up to four-player beta co-op.",
  alternates: {
    canonical: `${base}/game`,
    languages: { en: `${base}/game`, tr: `${base}/game/tr`, "x-default": `${base}/game` },
  },
  openGraph: {
    type: "website", url: `${base}/game`, title: "Roamcroft — A Living Valley",
    description: "Real gameplay screenshots, farming and forest exploration in a free browser game.",
    images: [{ url: `${base}/screenshots/roamcroft-pc-farming-gameplay.webp`, width: 1920, height: 1080, alt: "Roamcroft PC farming gameplay" }],
  },
  twitter: {
    card: "summary_large_image", title: "Roamcroft — Gameplay Screenshots",
    description: "Real 3D browser farming gameplay in Roamcroft.",
    images: [`${base}/screenshots/roamcroft-pc-farming-gameplay.webp`],
  },
};

export default function GamePage() { return <GameShowcase locale="en" />; }
