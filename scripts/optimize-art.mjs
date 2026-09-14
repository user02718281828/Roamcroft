import sharp from 'sharp';
import {readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..','public');
if(!process.argv[2])throw Error('Kullanım: node scripts/optimize-art.mjs <art ve textures klasörlerini içeren PNG kaynak dizini>');
const source=resolve(process.argv[2]);
let before=0,after=0;
for(const dir of ['art','textures'])for(const file of await readdir(resolve(source,dir))){
 if(!file.endsWith('.png'))continue;
 const input=resolve(source,dir,file),output=resolve(root,dir,file.replace(/\.png$/,'.webp'));
 const result=await sharp(input).resize(dir==='art'?768:512,undefined,{withoutEnlargement:true}).webp({quality:84,effort:6}).toFile(output);
 before+=(await stat(input)).size;after+=result.size;
 console.info(file+': '+result.width+' × '+result.height+', '+Math.round(result.size/1024)+' KB');
}
if(!before)throw Error('Kaynak dizininde PNG bulunamadı.');
console.info(JSON.stringify({before,after,reduction:Math.round((1-after/before)*100)+'%'}));
