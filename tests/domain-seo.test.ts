import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SITE_URL,LEGACY_URL,structuredData} from '../lib/site.ts';
import {secureFetch} from '../worker/security.mjs';

test('public discovery uses canonical pages while manifest identity stays origin relative',()=>{
  const sitemap=readFileSync('public/sitemap.xml','utf8');
  const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.deepEqual(urls,[SITE_URL+'/',SITE_URL+'/how-to-play']);
  assert.ok(readFileSync('public/robots.txt','utf8').includes('Disallow: /api/'));
  for(const name of ['manifest.json','manifest.tr.json']){
    const manifest=JSON.parse(readFileSync('public/'+name,'utf8'));
    assert.equal(manifest.id,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.start_url,'/');
    for(const icon of manifest.icons)assert.ok(icon.src.startsWith('/')&&!icon.src.startsWith('//'));
  }
  assert.equal(structuredData['@graph'][1].url,SITE_URL+'/');
  assert.equal('aggregateRating' in structuredData['@graph'][1],false);
});

test('app-level requests retain historical origin isolation; private APIs remain unindexed independently of edge routing',async()=>{
  for(const origin of [SITE_URL,LEGACY_URL]){
    let seen='';
    const handler={async fetch(request:Request){seen=new URL(request.url).origin;return new Response('private',{status:401});}};
    const response=await secureFetch(handler,new Request(origin+'/api/world'),{},{});
    assert.equal(seen,origin);assert.equal(response.status,401);assert.equal(response.headers.get('Location'),null);
    assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
    assert.match(response.headers.get('Content-Security-Policy')!,/connect-src 'self'/);
  }
});
