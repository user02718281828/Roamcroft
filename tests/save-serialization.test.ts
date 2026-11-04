import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,SAVE_VERSION} from '../lib/game/model.ts';
import {serialize,deserialize} from '../lib/game/save.ts';

test('save envelope hashes and embeds one snapshot, retaining Unicode and corruption detection',()=>{
 const state=createState(84621),settlement=state.settlement;
 settlement.name='Çiftlik "🌱"';
 let reads=0;
 Object.defineProperty(state,'settlement',{enumerable:true,get(){reads++;return settlement;}});
 const text=serialize(state),envelope=JSON.parse(text);
 assert.equal(reads,1,'the farm must only be traversed once');
 assert.equal(envelope.format,'ocak-vadisi');
 assert.equal(envelope.version,SAVE_VERSION);
 assert.ok(Number.isFinite(Date.parse(envelope.savedAt)));
 assert.equal(envelope.payload.settlement.name,settlement.name);
 assert.equal(deserialize(text).seed,state.seed);
 assert.equal(deserialize(text).settlement.name,settlement.name);
 envelope.payload.gold++;
 assert.throws(()=>deserialize(JSON.stringify(envelope)));
});
