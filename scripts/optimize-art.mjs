import sharp from 'sharp';
import {readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..','public');
let before=0,after=0;
for(const dir of ['art','textures'])for(const file of await readdir(resolve(root,dir))){
 if(!file.endsWith('.png'))continue;
 const input=resolve(root,dir,file),output=input.replace(/\.png$/,'.webp');
 const result=await sharp(input).resize(dir==='art'?768:512,undefined,{withoutEnlargement:true}).webp({quality:84,effort:6}).toFile(output);
 before+=(await stat(input)).size;after+=result.size;
 console.info(file+': '+result.width+' × '+result.height+', '+Math.round(result.size/1024)+' KB');
}
console.info(JSON.stringify({before,after,reduction:Math.round((1-after/before)*100)+'%'}));
