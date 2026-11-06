import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, createState } from '../lib/game/model.ts';
import { QUESTS } from '../lib/game/data.ts';
import { recommendedQuest,visibleQuests } from '../lib/game/quests.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { localizeText } from '../lib/i18n/core.ts';
import { SAVE_VERSION } from '../lib/game/model.ts';

void test('early recommendations teach gathering and farming before spending on orchards',()=>{
  const s=createState(42);
  for(const id of ['gather','till','plant','firstcraft','firstsale','harvest','orchard']){
    assert.equal(recommendedQuest(s)?.id,id);s.claimed.push(id);
  }
  assert.notEqual(recommendedQuest(s)?.id,'fruit');
  s.stats.orchard=1;assert.equal(recommendedQuest(s)?.id,'fruit');
});
void test('reader-only release does not offer new claim IDs before activation',()=>{
  const s=createState(42);s.stats.craft=10;s.stats.sell=100;s.claimed=['gather','till','plant'];
  assert.equal(visibleQuests(false).length,20);
  assert.ok(!visibleQuests(false).some(q=>q.id==='firstcraft'||q.id==='firstsale'));
  assert.ok(!['firstcraft','firstsale'].includes(recommendedQuest(s,false)?.id||''));
  assert.equal(visibleQuests(true).length,22);
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

void test('first craft requires completed work, then gives a one-time planting reward',()=>{
  const e=new Engine(createState(42));
  const start=structuredClone(e.s);
  assert.equal(e.claim('firstcraft'),false);
  assert.equal(e.craft('plank'),true);
  assert.equal(e.claim('firstcraft'),false); // Queuing a job is not completion.
  for(let i=0;i<80;i++)e.tick(.1);
  assert.equal(e.s.stats.craft,1);
  assert.equal(e.s.inventory.plank,2);
  assert.equal(e.claim('firstcraft'),true);
  assert.equal(e.s.inventory.carrotseed,start.inventory.carrotseed+4);
  assert.equal(e.s.gold,start.gold);
  const restored=new Engine(deserialize(serialize(e.s)));
  const before=structuredClone(restored.s);
  assert.equal(restored.claim('firstcraft'),false);
  assert.deepEqual(restored.s,before);
  assert.equal(SAVE_VERSION,1);
});

void test('first sale counts earned sales, never initial gold, purchases or rejected trades',()=>{
  const e=new Engine(createState(42));
  assert.equal(e.claim('firstsale'),false);
  e.trade('wood',0,false);
  assert.equal(e.claim('firstsale'),false);
  e.trade('carrotseed',1,true);
  assert.equal(e.claim('firstsale'),false);
  e.trade('wood',1,false);
  const wood=e.s.inventory.wood, stone=e.s.inventory.stone, gold=e.s.gold;
  assert.equal(e.claim('firstsale'),true);
  assert.equal(e.s.inventory.wood,wood+6);
  assert.equal(e.s.inventory.stone,stone+4);
  assert.equal(e.s.gold,gold);
  const restored=new Engine(deserialize(serialize(e.s)));
  const before=structuredClone(restored.s);
  assert.equal(restored.claim('firstsale'),false);
  assert.deepEqual(restored.s,before);
});

void test('legacy progress is preserved and full bags keep every new reward in deliveries',()=>{
  const s=createState(42);
  s.claimed=['gather','till','plant'];s.upgrades.axe=3;
  s.stats.craft=8;s.stats.sell=300;
  const e=new Engine(deserialize(serialize(s)));
  assert.deepEqual(e.s.claimed,s.claimed);
  assert.equal(e.s.upgrades.axe,3);
  assert.equal(recommendedQuest(e.s)?.id,'firstcraft');
  e.s.inventory={stone:600};e.s.storage={};e.s.overflow={};
  assert.equal(e.claim('firstcraft'),true);
  assert.equal(e.claim('firstsale'),true);
  assert.equal(e.s.inventory.stone,600);
  assert.equal(e.s.inventory.carrotseed||0,0);
  assert.equal(e.s.inventory.wood||0,0);
  assert.equal(Object.values(e.s.inventory).reduce((sum,n)=>sum+n,0),600);
  assert.deepEqual(e.s.overflow,{carrotseed:4,wood:6,stone:4});
  // The original long-term objectives still have their original requirements.
  assert.equal(e.claim('craft'),true);
  assert.equal(e.claim('sell'),true);
  const restored=deserialize(serialize(e.s));
  assert.deepEqual(restored.overflow,e.s.overflow);
});

void test('new quest names and instructions are localized in both languages',()=>{
  for(const id of ['firstcraft','firstsale']){
    const q=QUESTS.find(q=>q.id===id)!;
    assert.notEqual(localizeText(q.name,'en'),q.name);
    assert.notEqual(localizeText(q.desc,'en'),q.desc);
    assert.equal(localizeText(q.desc,'tr'),q.desc);
  }
});
