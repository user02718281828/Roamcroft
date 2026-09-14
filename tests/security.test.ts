import test from 'node:test';
import assert from 'node:assert/strict';
import {secureFetch,BASE_HEADERS,contentSecurityPolicy} from '../worker/security.mjs';

test('worker applies six headers and replaces attacker-supplied nonce without buffering responses',async()=>{
  const nonces:string[]=[];
  const handler={async fetch(request:Request){
    const csp=request.headers.get('Content-Security-Policy')!;nonces.push(csp);
    assert.equal(request.headers.has('Content-Security-Policy-Report-Only'),false);
    return new Response('<html>oyun</html>',{headers:{'Content-Type':'text/html','Cache-Control':'public','Vary':'RSC'}});
  }};
  for(let i=0;i<2;i++){
    const response=await secureFetch(handler,new Request('https://roamcroft.example/',{headers:{'Content-Security-Policy':"script-src 'nonce-attacker'",'Content-Security-Policy-Report-Only':"default-src *"}}),{},{});
    for(const [key,value] of Object.entries(BASE_HEADERS))assert.equal(response.headers.get(key),value);
    assert.equal(response.headers.get('Content-Security-Policy'),nonces[i]);
    assert.match(nonces[i],/nonce-[a-f0-9]{32}/);assert.ok(!nonces[i].includes('attacker'));
    assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('Vary'),'RSC');
    assert.equal(await response.text(),'<html>oyun</html>');
  }
  assert.notEqual(nonces[0],nonces[1]);
});
test('CSP blocks inline scripts, framing, foreign connections and dangerous objects',()=>{
  const csp=contentSecurityPolicy();
  assert.match(csp,/script-src 'self';/);assert.ok(!csp.includes('unsafe-eval'));
  for(const directive of ["script-src-attr 'none'","frame-ancestors 'none'","object-src 'none'","connect-src 'self'"])assert.ok(csp.includes(directive));
  assert.throws(()=>contentSecurityPolicy("x'; script-src *"));
});
test('API errors and HEAD preserve status, payload and deny cross-origin access',async()=>{
  const handler={async fetch(request:Request){return new Response(request.method==='HEAD'?null:'{"error":"disabled"}',{status:404,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}};
  for(const method of ['POST','HEAD']){
    const response=await secureFetch(handler,new Request('https://roamcroft.example/api/coop',{method,headers:{Origin:'https://untrusted.example'}}),{},{});
    assert.equal(response.status,404);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
    assert.equal(response.headers.get('X-Frame-Options'),'DENY');assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.equal(await response.text(),method==='HEAD'?'':'{"error":"disabled"}');
  }
});
