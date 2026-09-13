import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
const mark=await readFile(new URL('favicon.svg',root),'utf8');
const symbol=mark.slice(mark.indexOf('<path'),mark.lastIndexOf('</svg>'));
const icon='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="104" fill="#233e32"/><circle cx="256" cy="256" r="172" fill="#344d38" stroke="#bba467" stroke-width="8"/><g transform="translate(112 112) scale(12)" fill="#e7c37d" stroke="#f8dfa0" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round">'+symbol+'</g></svg>';
for(const size of [192,512])await sharp(Buffer.from(icon)).resize(size,size).png().toFile(new URL('icon-'+size+'.png',root).pathname.replace(/^\/(\w:)/,'$1'));
await writeFile(new URL('icon-maskable.png',root),await sharp(Buffer.from(icon)).png().toBuffer());
