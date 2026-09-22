import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,createState,tileAt, type Building} from '../lib/game/model.ts';
import {BUILDINGS,CROPS,ITEMS} from '../lib/game/data.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {machineRecipe,machineRecipes} from '../lib/game/production.ts';
import {cropPlan} from '../lib/game/farming.ts';
import {validServerCommand} from '../lib/server/protocol.ts';
import {advanceWorld} from '../lib/server/world.ts';
import {shiftWindow} from '../lib/game/world.ts';

function machine(type='mill') {
  const e=new Engine(createState()); e.s.level=8;
  Object.assign(tileAt(e.s,16,20)!,{resource:null,source:null,crop:null,terrain:'grass',tilled:false});
  e.s.inventory={...BUILDINGS[type].cost};
  assert.ok(e.build(type,16,20));
  return {e,b:e.s.buildings.at(-1)!};
}
test('a new machine is opt-in, charges once and saves its paid batch',()=>{
  const {e,b}=machine(); e.s.inventory={wheat:9};
  e.systems(100); assert.equal(e.s.inventory.wheat,9);
  assert.ok(e.setMachineRecipe(b.id,'feed')); assert.ok(e.startProduction(b.id));
  assert.equal(e.s.inventory.wheat,6); assert.equal(e.startProduction(b.id),false);
  assert.equal(e.setMachineRecipe(b.id,'default'),false);
  e.systems(10); e.toggleBuilding(b.id); e.systems(80); assert.equal(b.timer,10);
  const loaded=new Engine(deserialize(serialize(e.s))), saved=loaded.s.buildings.at(-1)!;
  loaded.toggleBuilding(saved.id); loaded.systems(35);
  assert.equal(loaded.s.inventory.feed,8); assert.equal(loaded.s.inventory.wheat,6);
  loaded.systems(100); assert.equal(loaded.s.inventory.feed,8);
  loaded.setMachineRepeat(saved.id,true); loaded.systems(45);
  assert.equal(loaded.s.inventory.feed,16); assert.equal(loaded.s.inventory.wheat,3);
});
test('full bag preserves a finished batch across save and streaming without duplication',()=>{
  const {e,b}=machine(); e.s.inventory={wheat:3};e.startProduction(b.id);
  e.s.inventory.wood=600;e.systems(50);
  assert.equal(b.processing,true);assert.equal(e.s.inventory.flour,undefined);
  shiftWindow(e.s,200,200,true);e.systems(100);shiftWindow(e.s,15,19,true);
  const restored=new Engine(deserialize(serialize(e.s)));
  restored.s.inventory.wood-=2;restored.systems(.5);restored.systems(.5);
  assert.equal(restored.s.inventory.flour,2);assert.equal(restored.s.stats.production,1);
});
test('demolishing a paid machine returns its batch ingredients only once',()=>{
  const {e,b}=machine();e.s.inventory={wheat:3};e.startProduction(b.id);
  assert.ok(e.demolish(b.id));assert.equal(e.s.inventory.wheat,3);
  assert.equal(e.demolish(b.id),false);assert.equal(e.s.inventory.wheat,3);
});
test('recipes, invalid state and protocol inputs are validated in server worlds',()=>{
  const {e,b}=machine();e.s.inventory={wheat:3};
  assert.equal(e.setMachineRecipe(b.id,'applejam'),false);
  assert.equal(e.setMachineRecipe(b.id,'__proto__'),false);
  const cmd={seq:1,method:'setMachineRecipe',args:[b.id,'feed']};
  assert.ok(validServerCommand(cmd));
  assert.equal(validServerCommand({...cmd,args:[b.id,'toString']}),false);
  assert.equal(validServerCommand({seq:1,method:'setMachineRepeat',args:[b.id,'true']}),false);
  const record={state:e.s};
  advanceWorld(record,{...e.s.player},[cmd,{seq:2,method:'startProduction',args:[b.id]}],0,true);
  assert.equal(record.state.inventory.wheat,0);assert.equal(b.processing,true);
  b.recipe='applejam';assert.throws(()=>deserialize(serialize(e.s)));
  b.recipe='feed';b.processing='yes' as unknown as boolean;assert.throws(()=>deserialize(serialize(e.s)));
  b.processing=true;b.timer=999;assert.throws(()=>deserialize(serialize(e.s)));
});
test('old machine saves preserve their unpaid partial progress and loop setting',()=>{
  const {e,b}=machine();delete b.repeat;delete b.recipe;delete b.processing;b.timer=20;
  e.s.inventory={wheat:6};const loaded=new Engine(deserialize(serialize(e.s)));
  loaded.systems(25);assert.equal(loaded.s.inventory.flour,2);assert.equal(loaded.s.inventory.wheat,3);
  loaded.systems(45);assert.equal(loaded.s.inventory.flour,4);
});
test('each machine recipe uses real items, valid durations, and compatible defaults',()=>{
  for(const type of Object.keys(BUILDINGS))for(const r of machineRecipes(type)){
    assert.ok(r.time>0&&r.time<=10000);
    for(const bag of [r.input,r.output])for(const [item,n] of Object.entries(bag))assert.ok(ITEMS[item]&&Number.isSafeInteger(n)&&n>0);
    if(r.id==='default')assert.deepEqual(r.input,BUILDINGS[type].production!.input);
  }
  assert.equal(machineRecipe({type:'home'} as Building),undefined);
});
test('tomato regrows without free seeds, needs water, pauses in off-season and can be removed',()=>{
  const e=new Engine(createState()),t=tileAt(e.s,16,20)!;e.s.level=4;
  Object.assign(t,{resource:null,source:null,terrain:'grass',tilled:true,crop:'tomato',growth:CROPS.tomato.grow,water:100});
  const seeds=e.s.inventory.tomatoseed||0;
  e.act(16,20,'hand');assert.equal(t.crop,'tomato');assert.equal(t.growth,50);
  assert.equal(e.s.inventory.tomatoseed||0,seeds);assert.equal(e.s.inventory.tomato,4);
  e.act(16,20,'hand');assert.equal(e.s.inventory.tomato,4);
  t.water=0;e.systems(10);assert.equal(t.growth,50);
  t.water=100;e.s.day=15;e.systems(10);assert.equal(t.growth,50);
  e.s.day=1;e.systems(100);assert.equal(t.growth,150);
  const loaded=new Engine(deserialize(serialize(e.s)));loaded.act(16,20,'hand');
  assert.equal(loaded.s.inventory.tomato,8);
  loaded.actionCooldown=0;loaded.act(16,20,'hoe');assert.equal(tileAt(loaded.s,16,20)!.crop,null);
});
test('planner warns about season transition and reflects the actual skill growth multiplier',()=>{
  const s=createState();s.day=14;s.time=.95;
  assert.equal(cropPlan(s,'tomato').willPause,true);
  assert.equal(cropPlan(s,'corn').willPause,false);
  s.day=15;assert.equal(cropPlan(s,'tomato').growsNow,false);
  s.skills.farming=1280;s.talents.harvest=2;
  assert.equal(cropPlan(s,'tomato').seconds,Math.ceil(150/1.18));
});
