import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {BASE_HEADERS,contentSecurityPolicy} from '../worker/security.mjs';
const root=resolve(import.meta.dirname,'..');
const config=JSON.parse(await readFile(resolve(root,'deployment.config.json'),'utf8'));
if(!/^[a-f0-9-]{36}$/.test(config.database_id)||config.database_id.startsWith('00000000'))throw Error('Geçerli D1 kimliği gerekli.');
const target=resolve(root,'dist/server/wrangler.json');
const wrangler=JSON.parse(await readFile(target,'utf8'));
const binding=wrangler.d1_databases?.find(db=>db.binding===config.binding);
if(!binding)throw Error('D1 bağlantısı derlemede bulunamadı.');
Object.assign(binding,{database_id:config.database_id,database_name:config.database_name});
wrangler.name=config.name;
const appEntry=wrangler.main==='secure-entry.mjs'?'index.js':wrangler.main;
if(!/^[\w./-]+\.js$/.test(appEntry))throw Error('Beklenmeyen Worker giriş dosyası.');
await writeFile(resolve(root,'dist/server/security.mjs'),await readFile(resolve(root,'worker/security.mjs'),'utf8'));
await writeFile(resolve(root,'dist/server/secure-entry.mjs'),`import app from './${appEntry}';\nimport {secureFetch} from './security.mjs';\nexport * from './${appEntry}';\nexport default {...app,fetch(request,env,ctx){return secureFetch(app,request,env,ctx);}};\n`);
wrangler.main='secure-entry.mjs';
// Keep application error logs; avoid one invocation log for every polling request.
wrangler.observability={enabled:true,logs:{enabled:true,invocation_logs:false,head_sampling_rate:1}};
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
const security=Object.entries({...BASE_HEADERS,'Content-Security-Policy':contentSecurityPolicy()}).map(([key,value])=>`  ${key}: ${value}`).join('\n');
await writeFile(headersPath,headers+'\n/*\n'+security+'\n/sw.js\n  Cache-Control: no-cache\n/manifest.json\n  Cache-Control: no-cache\n');
console.info('D1 bağlantısı doğrulandı; çevrimdışı uygulama dosyaları hazırlandı.');
