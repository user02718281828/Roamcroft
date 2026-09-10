import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Roamcroft',
  icons: { icon: '/favicon.svg' },
  description:
    'Toprağı işle, köyünü kur, üret ve geceye hazırlan. İzometrik hayatta kalma ve çiftçilik oyunu.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
