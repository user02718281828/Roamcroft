import type { Metadata,Viewport } from 'next';
import './globals.css';
import { translateFor } from '../lib/i18n/core';
export const metadata: Metadata = {
  title: 'Roamcroft',
  metadataBase:new URL('https://roamcroft.roamcroft.workers.dev'),
  openGraph:{title:'Roamcroft',description:translateFor('en','meta.description'),type:'website',locale:'en_US',alternateLocale:['tr_TR'],url:'/',images:[{url:'/og-image.jpg',width:1200,height:630,alt:'Roamcroft'}]},
  twitter:{card:'summary_large_image',title:'Roamcroft',images:['/og-image.jpg']},
  manifest:'/manifest.json',
  appleWebApp:{capable:true,title:'Roamcroft',statusBarStyle:'black-translucent'},
  icons: { icon: '/favicon.svg',apple:'/icon-192.png' },
  description:
    translateFor('en','meta.description'),
};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#233e32'};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
