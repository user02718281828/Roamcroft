// Local browser fixture, deliberately without D1/DO/HTTP/WebSocket game clients.
import {build} from 'esbuild';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
const output=resolve('work/menu-touch');mkdirSync(output,{recursive:true});
const storage=process.argv.includes('--storage');
await build({entryPoints:[storage?'tests/browser/storage-quantity.tsx':'tests/browser/menu-touch.tsx'],bundle:true,platform:'browser',format:'esm',jsx:'automatic',outfile:resolve(output,'fixture.js'),logLevel:'silent'});
const cssRoot=resolve('dist/client/_next/static/css'),files=readdirSync(cssRoot);
const css=['index.','page.','Game.'].flatMap(prefix=>files.filter(n=>n.startsWith(prefix)&&n.endsWith('.css'))).map(n=>readFileSync(resolve(cssRoot,n),'utf8')).join('\n');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Menu touch regression</title><style>${css}\nbody{background:#20372b;color:#f1dfb4;padding:12px}h1{font-size:18px}output{display:block;margin:12px 0}#app>button{margin:6px;min-height:44px}</style><div id="app"></div><script type="module" src="/fixture.js"></script>`;
createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html);}
  else if(req.url==='/fixture.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(resolve(output,'fixture.js')));}
  else if(/^\/art\/farm-icons-[1-4]\.webp$/.test(req.url||'')){res.setHeader('Content-Type','image/webp');res.end(readFileSync(resolve('public','.'+req.url)));}
  else{res.statusCode=404;res.end();}
}).listen(8947,'127.0.0.1',()=>console.log((storage?'Storage quantity':'Menu touch')+' fixture http://127.0.0.1:8947/ · local in-memory state only; build first; Ctrl+C stops.'));
