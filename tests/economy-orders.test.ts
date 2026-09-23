import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,createState} from '../lib/game/model.ts';
import {CROPS,ITEMS} from '../lib/game/data.ts';
import {dailyOrders} from '../lib/game/orders.ts';
import {bagValue,marketSells,processingValue,tradeUnitPrice} from '../lib/game/economy.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {inventoryCapacity} from '../lib/game/progression.ts';
import {validServerCommand} from '../lib/server/protocol.ts';
import {advanceWorld} from '../lib/server/world.ts';

test('daily offers survive reload, do not reroll with progress, and preview the actual next day',()=>{
  const s=createState(7),before=dailyOrders(s,'narin');
  s.level=30;s.inventory={applejam:99};s.friendship.narin=100;
  assert.deepEqual(dailyOrders(s,'narin'),before);
  assert.deepEqual(dailyOrders(deserialize(serialize(s)),'narin'),before);
  const preview=dailyOrders(s,'narin',s.day+1);s.day++;
  assert.deepEqual(dailyOrders(s,'narin'),preview);
  assert.notDeepEqual(dailyOrders(s,'narin'),before);
  assert.deepEqual(dailyOrders(s,'__proto__'),[]);
});
test('a year of orders has reachable basic crops and bounded, profitable delivery premiums',()=>{
  for(const seed of [0,7,4294967295])for(let day=1;day<=28;day++)for(const npc of ['narin','torin','lale']){
    const offers=dailyOrders({seed,day},npc);assert.equal(offers.length,2);
    assert.equal(offers[0].level,1);
    for(const id of Object.keys(offers[0].input))if(CROPS[id])assert.ok(CROPS[id].seasons.includes(Math.floor((day-1)/7)));
    for(const order of offers){
      for(const [id,n] of Object.entries({...order.input,...order.supplies})){assert.ok(ITEMS[id]);assert.ok(n>0&&Number.isInteger(n));}
      const value=order.gold+bagValue(order.supplies||{});
      assert.equal(value,Math.ceil(bagValue(order.input)*1.25));assert.ok(order.gold>0);
      if(Object.keys(order.input).every(marketSells)){
        const cost=Object.entries(order.input).reduce((n,[id,count])=>n+tradeUnitPrice({friendship:{narin:100}},id,true)*count,0);
        assert.ok(value<cost,'Buying a finished order and selling its rewards must not earn money');
      }
    }
  }
});
test('one delivery consumes only its own inputs and blocks the alternate path, including after save',()=>{
  const e=new Engine(createState(0));e.s.level=30;
  const [raw,prepared]=dailyOrders(e.s,'narin');e.s.inventory={carrot:99,wheat:99,soup:5};
  const gold=e.s.gold;assert.ok(e.completeContract('narin',prepared.token));
  assert.equal(e.s.inventory.soup,3);assert.equal(e.s.inventory.carrot,99);
  assert.equal(e.s.gold,gold+prepared.gold);assert.equal(e.s.inventory.fertilizer,2);
  const restored=new Engine(deserialize(serialize(e.s))),snapshot=structuredClone(restored.s);
  assert.equal(restored.completeContract('narin',raw.token),false);
  assert.equal(restored.completeContract('narin'),false);
  assert.deepEqual(restored.s,snapshot);
  assert.equal(e.events.filter(event=>event.celebration).length,1);
});
test('expired, forged, unaffordable and level-locked deliveries do not spend or award anything',()=>{
  const e=new Engine(createState(0));e.s.inventory={soup:4};
  const order=dailyOrders(e.s,'narin')[1],snapshot=structuredClone(e.s);
  assert.equal(e.completeContract('narin',order.token),false);assert.deepEqual(e.s,snapshot);
  e.s.level=30;e.s.day=2;
  const before=structuredClone(e.s);
  for(const token of [order.token,'2:narin:cheese','2:torin:planks','garbage'])assert.equal(e.completeContract('narin',token),false);
  assert.deepEqual(e.s,before);
  assert.equal(e.completeContract('lale',dailyOrders(e.s,'lale')[0].token),false);
  assert.deepEqual(e.s,before);
});
test('material rewards in a full bag are preserved and cannot be collected twice',()=>{
  const e=new Engine(createState(1));e.s.level=30;
  const order=dailyOrders(e.s,'narin')[1];assert.equal(order.id,'jam');
  e.s.inventory={wood:inventoryCapacity(e.s)-2,applejam:2};
  assert.ok(e.completeContract('narin',order.token));
  const restored=new Engine(deserialize(serialize(e.s)));
  const total=(restored.s.inventory.fertilizer||0)+(restored.s.storage.fertilizer||0)+(restored.s.overflow.fertilizer||0);
  assert.equal(total,3);assert.equal(restored.completeContract('narin',order.token),false);
});
test('legacy completion markers remain valid and new token commands are server validated',()=>{
  const e=new Engine(createState(0));e.s.level=30;e.s.inventory={carrot:12};
  e.s.contracts.narin=e.s.day;
  const restored=new Engine(deserialize(serialize(e.s)));
  assert.equal(restored.completeContract('narin'),false);
  const token=dailyOrders(e.s,'narin')[0].token;
  const command={seq:1,method:'completeContract',args:['narin',token]};
  assert.ok(validServerCommand(command));assert.ok(validServerCommand({...command,args:['narin']}));
  for(const args of [['narin',{}],['narin','1:lale:catch'],['narin','1000001:narin:supper'],['narin',token,50]])assert.equal(validServerCommand({...command,args}),false);
  delete e.s.contracts.narin;const record={state:e.s};
  const result=advanceWorld(record,{...e.s.player},[command,{...command,seq:2}],0,true);
  assert.equal(record.state.inventory.carrot,6);assert.equal(record.state.stats.orders,1);
  assert.equal(result.events.filter(event=>event.celebration).length,1);
});
test('market restrictions apply to direct engine and server commands as well as UI',()=>{
  const e=new Engine(createState());e.s.gold=10000;const before=structuredClone(e.s);
  for(const id of ['crystal','bar','copperbar','brick','wool','cheese','jam','toString','__proto__'])assert.equal(e.trade(id,1,true),false);
  assert.deepEqual(e.s,before);
  const record={state:e.s};advanceWorld(record,{...e.s.player},[{seq:1,method:'trade',args:['crystal',1,true]}],0,true);
  assert.deepEqual(e.s,before);
  e.s.inventory.cheese=1;assert.ok(e.trade('cheese',1,false));
});
test('processing comparison includes actual merchant discount and non-purchasable inputs',()=>{
  const s=createState(),recipe={input:{flour:2,wood:1},output:{bread:2}};
  assert.deepEqual(processingValue(s,recipe),{input:67,output:90,added:23,purchase:105,purchasedMargin:-15});
  s.friendship.narin=100;assert.equal(processingValue(s,recipe).purchase,95);
  assert.equal(processingValue(s,{input:{bar:1},output:{brick:1}}).purchase,null);
});
