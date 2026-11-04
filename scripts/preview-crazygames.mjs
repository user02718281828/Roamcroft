// Local static hosting under a subdirectory, without Worker, cookies or APIs.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist/crazygames');
const served=[];
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/__metrics'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(served));return;}
 if(!pathname.startsWith('/game/')){res.writeHead(404).end();return;}
 const target=resolve(root,pathname.slice(6)||'index.html');
 if(!target.startsWith(root+sep)){res.writeHead(403).end();return;}
 const content=await readFile(target);served.push({path:pathname,bytes:content.length,time:Date.now()});res.setHeader('Content-Type',mime[extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(content);
 }catch{res.writeHead(404).end();}}).listen(8973,'127.0.0.1',()=>console.log('Local portal build: http://127.0.0.1:8973/game/'));
