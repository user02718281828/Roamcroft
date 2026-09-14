import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'..','dist/client');
async function scan(dir){let files=[];for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name.startsWith('.'))continue;const path=resolve(dir,entry.name);if(entry.isDirectory())files.push(...await scan(path));else files.push(path);}return files;}
const files=(await scan(root)).filter(path=>/\.(js|css|webp|png|svg|jpg)$/.test(path));
let raw=0,transfer=0;const chunks=[];
for(const path of files){const bytes=await readFile(path);raw+=bytes.length;transfer+=/\.(js|css|svg)$/.test(path)?gzipSync(bytes).length:bytes.length;if(path.endsWith('.js'))chunks.push({name:path.slice(root.length+1),bytes:bytes.length});}
const report={rawBytes:raw,estimatedCompressedBytes:transfer,largestChunk:chunks.sort((a,b)=>b.bytes-a.bytes)[0],budgetBytes:3000000};
await writeFile(resolve(root,'asset-budget.json'),JSON.stringify(report,null,2));
if(raw>report.budgetBytes)throw Error('Statik dosya bütçesi 3 MB sınırını aştı: '+raw);
console.info('Statik dosyalar: '+(raw/1000000).toFixed(2)+' MB; tahmini sıkıştırılmış aktarım: '+(transfer/1000000).toFixed(2)+' MB.');
