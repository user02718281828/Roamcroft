// Derleme sırasında sürüm ve uygulama dosyaları bu iki sabite yazılır.
const VERSION='roamcroft-dev';
const SHELL=['/','/manifest.json','/icon-192.png','/icon-512.png','/favicon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('roamcroft-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.searchParams.has('_rsc'))return;
 if(request.mode==='navigate'){
   event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(VERSION).then(cache=>cache.put('/',copy)));}return response;}).catch(()=>caches.match('/').then(response=>response||Response.error())));return;
 }
 if(!/\.(js|css|webp|png|svg|woff2)$/.test(url.pathname))return;
 event.respondWith(caches.open(VERSION).then(async cache=>{const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}));
});
