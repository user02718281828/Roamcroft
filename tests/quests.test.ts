import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, createState } from '../lib/game/model.ts';
import { QUESTS } from '../lib/game/data.ts';
import { recommendedQuest } from '../lib/game/quests.ts';
import { serialize, deserialize } from '../lib/game/save.ts';

void test('early recommendations teach gathering and farming before spending on orchards',()=>{
  const s=createState(42);
  for(const id of ['gather','till','plant','harvest','orchard']){
    assert.equal(recommendedQuest(s)?.id,id);s.claimed.push(id);
  }
  assert.notEqual(recommendedQuest(s)?.id,'fruit');
  s.stats.orchard=1;assert.equal(recommendedQuest(s)?.id,'fruit');
});
void test('ready rewards override recommendations and remain single-claim after save/load',()=>{
  const e=new Engine(createState(42));e.s.stats.orchard=1;
  assert.equal(recommendedQuest(e.s)?.id,'orchard');
  e.claim('orchard');const gold=e.s.gold;
  const restored=new Engine(deserialize(serialize(e.s)));
  restored.claim('orchard');assert.equal(restored.s.gold,gold);
  assert.equal(recommendedQuest(restored.s)?.id,'gather');
  restored.s.claimed=QUESTS.map(q=>q.id);assert.equal(recommendedQuest(restored.s),undefined);
});
