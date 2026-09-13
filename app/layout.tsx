import type { Metadata,Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Roamcroft',
  manifest:'/manifest.json',
  appleWebApp:{capable:true,title:'Roamcroft',statusBarStyle:'black-translucent'},
  icons: { icon: '/favicon.svg',apple:'/icon-192.png' },
  description:
    'Toprağı işle, köyünü kur, üret ve geceye hazırlan. İzometrik hayatta kalma ve çiftçilik oyunu.',
};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#233e32'};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
