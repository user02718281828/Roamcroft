import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const config=JSON.parse(await readFile(resolve(root,'deployment.config.json'),'utf8'));
if(!/^[a-f0-9-]{36}$/.test(config.database_id)||config.database_id.startsWith('00000000'))throw Error('Geçerli D1 kimliği gerekli.');
const target=resolve(root,'dist/server/wrangler.json');
const wrangler=JSON.parse(await readFile(target,'utf8'));
const binding=wrangler.d1_databases?.find(db=>db.binding===config.binding);
if(!binding)throw Error('D1 bağlantısı derlemede bulunamadı.');
Object.assign(binding,{database_id:config.database_id,database_name:config.database_name});
wrangler.name=config.name;
await writeFile(target,JSON.stringify(wrangler,null,2)+'\n');
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
async function bundleFiles(directory,prefix=''){
 const files=await readdir(directory,{withFileTypes:true}),result=[];
 for(const file of files){if(file.name.startsWith('.'))continue;const path=prefix+'/'+file.name;if(file.isDirectory())result.push(...await bundleFiles(resolve(directory,file.name),path));else if(/\.(js|css|webp)$/.test(file.name)&&file.name!=='sw.js')result.push(path);}
 return result;
}
const assets=await bundleFiles(resolve(root,'dist/client'));
let worker=await readFile(resolve(root,'public/sw.js'),'utf8');
worker=worker.replace("'roamcroft-dev'",JSON.stringify('roamcroft-'+pkg.version+'-'+Date.now())).replace("const SHELL=",'const SHELL='+JSON.stringify(assets)+'.concat(').replace("'/favicon.svg'];","'/favicon.svg']);");
await writeFile(resolve(root,'dist/client/sw.js'),worker);
const headersPath=resolve(root,'dist/client/_headers');
const headers=await readFile(headersPath,'utf8').catch(()=>'');
await writeFile(headersPath,headers+'\n/sw.js\n  Cache-Control: no-cache\n/manifest.json\n  Cache-Control: no-cache\n');
console.info('D1 bağlantısı doğrulandı; çevrimdışı uygulama dosyaları hazırlandı.');
