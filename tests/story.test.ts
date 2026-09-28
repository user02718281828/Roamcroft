import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine,createState } from '../lib/game/model.ts';
import { MILESTONES } from '../lib/game/settlement.ts';
import { settlementStory } from '../lib/game/story.ts';
import { serialize,deserialize } from '../lib/game/save.ts';

void test('story follows earned village milestones across saves and does not skip unfinished chapters',()=>{
  const e=new Engine(createState(3));
  const first=settlementStory(e.s).chapter.title;
  assert.equal(e.claimMilestone('roots'),false);assert.equal(settlementStory(e.s).chapter.title,first);
  e.s.stats.harvest=8;e.s.stats.sell=100;assert.ok(e.claimMilestone('roots'));
  const next=settlementStory(deserialize(serialize(e.s)));
  assert.equal(next.stage,1);assert.equal(next.memories[0].title,first);assert.notEqual(next.chapter.title,first);
  e.s.settlement.milestones=['legacy'];assert.equal(settlementStory(e.s).stage,0);
  e.s.settlement.milestones=MILESTONES.map(m=>m.id);
  assert.equal(settlementStory(e.s).stage,5);
  assert.equal(Object.keys(settlementStory(e.s).chapter.voices).length,3);
});
