import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine, createState, tileAt, walkable} from '../lib/game/model.ts';
import {cleanLevels} from '../lib/game/audio.ts';
import {WATER_SURFACE_Y, WORLD_BASE_TOP} from '../lib/game/visuals.ts';

test('small vegetation is passable but trunks and water block travel',()=>{
 const e=new Engine(createState());e.s.buildings=[];
 for(const tile of e.s.tiles){tile.terrain='grass';tile.resource=null;}
 const tile=tileAt(e.s,10,10)!;
 for(const plant of ['bush','mushroom'] as const){tile.resource=plant;assert.ok(walkable(e.s,10,10));}
 tile.resource='tree';assert.equal(walkable(e.s,10,10),false);assert.ok(walkable(e.s,10.4,10.4));
 tile.terrain='water';assert.equal(walkable(e.s,10.4,10.4),false);
});
test('harvesting emits a material-specific sound only after a successful action',()=>{
 const e=new Engine(createState());e.s.player.x=10;e.s.player.z=10;e.s.buildings=[];
 const tile=tileAt(e.s,10,10)!;tile.terrain='grass';tile.resource='tree';tile.amount=5;
 e.act(10,10,'axe','');assert.ok(e.events.some(event=>event.sound==='axe'));
});
test('water clears the opaque world base and restored volume settings are bounded',()=>{
 assert.ok(WATER_SURFACE_Y>WORLD_BASE_TOP);
 assert.deepEqual(cleanLevels({music:10,ambience:-1,effects:NaN}),{music:1,ambience:0,effects:.65});
});
