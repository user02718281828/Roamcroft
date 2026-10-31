import type { Metadata } from "next";
import GameShowcase from "../GameShowcase";

const base = "https://roamcroft.com";

export const metadata: Metadata = {
  title: "Roamcroft Oynanış Görselleri | Ücretsiz 3D Tarayıcı Çiftçilik Oyunu",
  description: "Roamcroft'un gerçek PC oynanış görüntülerini keşfet. Ücretsiz 3D izometrik tarayıcı çiftçilik ve keşif oyunu; tek kişilik veya dört kişiye kadar beta eşli oyun.",
  alternates: {
    canonical: `${base}/game/tr`,
    languages: { en: `${base}/game`, tr: `${base}/game/tr`, "x-default": `${base}/game` },
  },
  openGraph: {
    type: "website", locale: "tr_TR", url: `${base}/game/tr`,
    title: "Roamcroft — Yaşayan Bir Vadi",
    description: "Ücretsiz tarayıcı oyunundan gerçek çiftçilik ve orman keşfi ekran görüntüleri.",
    images: [{ url: `${base}/screenshots/roamcroft-pc-farming-gameplay.webp`, width: 1920, height: 1080, alt: "Roamcroft PC çiftçilik oynanışı" }],
  },
  twitter: {
    card: "summary_large_image", title: "Roamcroft — Gerçek Oynanış Görselleri",
    description: "Roamcroft'ta ücretsiz 3D tarayıcı çiftçilik deneyimi.",
    images: [`${base}/screenshots/roamcroft-pc-farming-gameplay.webp`],
  },
};

export default function GameTurkishPage() { return <GameShowcase locale="tr" />; }
