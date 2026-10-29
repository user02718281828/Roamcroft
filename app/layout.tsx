import type { Metadata,Viewport } from 'next';
import './globals.css';
import { headers } from 'next/headers';
import { SITE_URL, SITE_DESCRIPTION, structuredData } from '../lib/site';
export const metadata: Metadata = {
  title: 'Roamcroft — Free Browser Farming & Exploration Game',
  metadataBase:new URL(SITE_URL),
  alternates:{canonical:'/'},
  openGraph:{title:'Roamcroft',description:SITE_DESCRIPTION,type:'website',locale:'en_US',alternateLocale:['tr_TR'],url:'/',images:[{url:'/og-image.jpg',width:1200,height:630,alt:'Roamcroft — a valley adventure, brand illustration'}]},
  twitter:{card:'summary_large_image',title:'Roamcroft',images:['/og-image.jpg']},
  manifest:'/manifest.json',
  appleWebApp:{capable:true,title:'Roamcroft',statusBarStyle:'black-translucent'},
  icons: { icon: [{url:'/brand/favicon-16.png',sizes:'16x16',type:'image/png'},{url:'/brand/favicon-32.png',sizes:'32x32',type:'image/png'},{url:'/brand/favicon-48.png',sizes:'48x48',type:'image/png'},{url:'/favicon.ico',sizes:'16x16 32x32 48x48'}],apple:'/brand/apple-touch-icon.png' },
  description:
    SITE_DESCRIPTION,
};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#233e32'};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce=(await headers()).get('Content-Security-Policy')?.match(/'nonce-([a-f0-9]{32})'/)?.[1];
  return (
    <html lang="en">
      <body><script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replaceAll('<','\\u003c')}}/>{children}</body>
    </html>
  );
}
