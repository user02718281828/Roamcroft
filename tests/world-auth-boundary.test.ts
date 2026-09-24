import test from 'node:test';
import assert from 'node:assert/strict';
import {handleWorld} from '../lib/server/api.ts';
void test('unauthenticated world commands never initialize or access D1',async()=>{
  const db={prepare(){throw Error('D1 should not be touched');},batch(){throw Error('D1 should not be touched');}} as unknown as D1Database;
  for(const cookie of ['', '__Host-roamcroft-session=invalid']){
    const r=await handleWorld(new Request('https://farm.test/api/world',{method:'POST',headers:{Origin:'https://farm.test','Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({op:'pulse',pulse:{}})}),db);
    assert.equal(r.status,401);assert.equal(r.headers.get('Cache-Control'),'no-store');
  }
});
