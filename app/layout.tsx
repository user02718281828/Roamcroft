import type { Metadata,Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Roamcroft',
  metadataBase:new URL('https://roamcroft.roamcroft.workers.dev'),
  openGraph:{title:'Roamcroft',description:'Keşfet, yetiştir, kendi yuvanı kur.',type:'website',locale:'tr_TR',url:'/',images:[{url:'/og-image.jpg',width:1200,height:630,alt:'Roamcroft — keşfet, yetiştir, yuva kur'}]},
  twitter:{card:'summary_large_image',title:'Roamcroft',images:['/og-image.jpg']},
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
