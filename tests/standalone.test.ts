import test from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/coop/route.ts';
test('standalone endpoint rejects spoofed identity headers without accessing stored rooms',async()=>{
 const response=await POST(new Request('https://roamcroft.roamcroft.workers.dev/api/coop',{method:'POST',headers:{'Content-Type':'application/json','X-OpenAI-User-Id':'forged'},body:JSON.stringify({action:'create',name:'Test'})}));
 assert.equal(response.status,404);assert.equal(response.headers.get('Cache-Control'),'no-store');
});
