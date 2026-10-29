export const BASE_HEADERS = Object.freeze({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)',
});

export function contentSecurityPolicy(nonce) {
  if(nonce!==undefined&&!/^[a-f0-9]{32}$/.test(nonce))throw new Error('Geçersiz CSP nonce.');
  return ["default-src 'self'",`script-src 'self'${nonce?` 'nonce-${nonce}'`:''}`,
    "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
    "font-src 'self'", "connect-src 'self' https://o4512335936815104.ingest.de.sentry.io", "worker-src 'self'", "media-src 'self' blob:",
    "object-src 'none'", "base-uri 'none'", "frame-src 'none'", "frame-ancestors 'none'", "form-action 'self'"].join('; ');
}

// HTML'i yeniden yazmadan vinext'in nonce desteğini kullanır; her istekte yeni nonce üretilir.
export async function secureFetch(handler,request,env,ctx) {
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  const csp=contentSecurityPolicy(nonce),incoming=new Headers(request.headers);
  incoming.set('Content-Security-Policy',csp);
  incoming.delete('Content-Security-Policy-Report-Only');
  let forwarded=new Request(request,{headers:incoming}),response;
  // Fully own small API bodies before a route can reject them. An unread body
  // on an early 401/403 can reset the local Workers transport's next request.
  // This is bounded independently of Content-Length, including chunked input.
  if(new URL(request.url).pathname.startsWith('/api/')&&request.method==='POST'&&forwarded.body){
    const reader=forwarded.body.getReader(),chunks=[];let size=0;
    try{
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
        if(size>8192){await reader.cancel();response=Response.json({error:'İstek fazla büyük.'},{status:413,headers:{'Cache-Control':'no-store'}});break;}
        chunks.push(value);
      }
      if(!response){
        const bytes=new Uint8Array(size);let offset=0;
        for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
        forwarded=new Request(request.url,{method:request.method,headers:incoming,body:bytes});
      }
    }finally{reader.releaseLock();}
  }
  response??=await handler.fetch(forwarded,env,ctx);
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(BASE_HEADERS))headers.set(key,value);
  headers.set('Content-Security-Policy',csp);
  if(new URL(request.url).pathname.startsWith('/api/'))headers.set('X-Robots-Tag','noindex, nofollow');
  // HTML ile nonce birlikte kalmalı; paylaşılan önbellekte başka yanıtla eşleşmemeli.
  if(headers.get('Content-Type')?.includes('text/html'))headers.set('Cache-Control','private, no-store');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers,...(response.webSocket?{webSocket:response.webSocket}:{})});
}
