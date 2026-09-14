import test from 'node:test';
import assert from 'node:assert/strict';
import {CloudField,cloudAnchors} from '../lib/game/clouds.ts';

test('clouds remain anchored while the camera moves and across streaming boundaries',()=>{
  assert.deepEqual(cloudAnchors(1,1,84621),cloudAnchors(23,23,84621));
  const before=cloudAnchors(23,23,84621),after=cloudAnchors(25,23,84621);
  const shared=before.filter(a=>after.some(b=>a.key===b.key));
  assert.ok(shared.length>0);
  for(const a of shared)assert.deepEqual(a,after.find(b=>a.key===b.key));
  for(let x=-500;x<500;x+=47)assert.ok(cloudAnchors(x,-x,84621).length<=25);
});
test('cloud layer has bounded geometry, translucent edges and no camera translation',()=>{
  const field=new CloudField();field.update(0,0,84621,0,1);
  const matrix=Array.from(field.instanceMatrix.array),version=field.instanceMatrix.version;
  field.update(10,10,84621,20,1);
  assert.deepEqual(Array.from(field.instanceMatrix.array),matrix);
  assert.equal(field.instanceMatrix.version,version);
  assert.deepEqual(field.position.toArray(),[0,0,0]);
  assert.equal(field.geometry.attributes.position.count,4);
  assert.equal(field.material.depthWrite,false);assert.equal(field.castShadow,false);
  assert.ok(field.material.uniforms.opacity.value<=.12);
  field.update(-10000,10000,84621,30,0);assert.ok(field.count<=25);
  field.geometry.dispose();field.material.dispose();field.dispose();
});
