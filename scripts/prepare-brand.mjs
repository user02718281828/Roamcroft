// User-supplied brand candidates stay intact; only delivery copies are resized/encoded.
import sharp from 'sharp';
import {mkdir,copyFile} from 'node:fs/promises';
const source='assets/brand-candidates/';
await mkdir('public/brand',{recursive:true});
const png={palette:true,colours:32,dither:0,effort:10};
for(const size of [192,512])await sharp(source+'roamcroft-icon-original.png').resize(size,size).png(png).toFile(`public/icon-${size}.png`);
await sharp(source+'roamcroft-icon-original.png').resize(384,384).extend({top:64,bottom:64,left:64,right:64,background:'#173c2c'}).png(png).toFile('public/icon-maskable.png');
for(const size of [16,32,48])await sharp(source+'roamcroft-icon-original.png').resize(size,size).png(png).toFile(`public/brand/favicon-${size}.png`);
await sharp(source+'apple-touch-icon.png').resize(180,180).png(png).toFile('public/brand/apple-touch-icon.png');
await sharp(source+'og-image.png').jpeg({quality:65,mozjpeg:true}).toFile('public/og-image.jpg');
await sharp(source+'roamcroft-logo-original.png').resize({width:900,withoutEnlargement:true}).webp({quality:65,effort:6}).toFile('public/brand/roamcroft-logo.webp');
await copyFile(source+'favicon.ico','public/favicon.ico');
console.log('Brand delivery assets prepared; originals and assets/og.svg preserved.');
