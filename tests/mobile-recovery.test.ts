import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {build} from 'esbuild';
import sharp from '../node_modules/sharp/dist/index.mjs';
import {TouchPress,DEFAULT_TOUCH,TOUCH_KEY,readTouch,touchPreferences} from '../lib/ui/touch-controls.ts';
import {JoystickInput} from '../lib/game/joystick.ts';
import {PinchGesture} from '../lib/game/touch.ts';
import {PointerDrag} from '../lib/game/interaction.ts';
import {ValleyScene} from '../lib/game/scene.ts';
import {Engine,createState} from '../lib/game/model.ts';
import {ITEMS} from '../lib/game/data.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {storageQuote} from '../lib/ui/storage-view.ts';
import {itemArt,ORCHARD_ART} from '../lib/ui/item-art.ts';
import {nearbyToolTile} from '../lib/ui/touch-target.ts';

test('equipped mobile tools find only a reachable matching target without selecting, moving or consuming',()=>{
 const e=new Engine(createState()),p=e.s.player;
 e.s.tiles=[{...e.s.tiles[0],x:p.x,z:p.z+1,resource:'tree',terrain:'grass'},
 {...e.s.tiles[0],x:p.x+1,z:p.z,resource:'stone',terrain:'grass'},
 {...e.s.tiles[0],x:p.x,z:p.z-1,resource:null,terrain:'water'},
 {...e.s.tiles[0],x:p.x+10,z:p.z,resource:'tree',terrain:'grass'}];
 const before=structuredClone(e.s);
 assert.equal(nearbyToolTile(e.s,'axe')?.resource,'tree');assert.equal(nearbyToolTile(e.s,'pickaxe')?.resource,'stone');
 assert.equal(nearbyToolTile(e.s,'fish')?.terrain,'water');assert.equal(nearbyToolTile(e.s,'sword'),undefined);
 e.s.tiles=e.s.tiles.filter(t=>t.resource!=='tree'||t.x===p.x+10);assert.equal(nearbyToolTile(e.s,'axe'),undefined);
 e.s.tiles=before.tiles;assert.deepEqual(e.s,before);
});

test('touch release fires once, cancels outside/other finger, and cannot repeat while held',()=>{
 const p=new TouchPress(); assert.equal(p.end(1,true),false);
 assert.ok(p.begin(1));assert.equal(p.begin(2),false);assert.equal(p.end(2,true),false);
 assert.ok(p.end(1,true));assert.equal(p.end(1,true),false);
 p.begin(3);assert.equal(p.end(3,false),false);p.begin(4);p.cancel();assert.equal(p.end(4,true),false);
});
test('joystick, camera and pinch own separate pointers; UI suspension clears captures and gestures',()=>{
 const stick=new JoystickInput(),press=new TouchPress(),view=Object.create(ValleyScene.prototype) as ValleyScene;
 view.drag=new PointerDrag();view.pinch=new PinchGesture();
 const released:number[]=[];view.canvas={hasPointerCapture:()=>true,releasePointerCapture:(id:number)=>released.push(id)} as unknown as HTMLCanvasElement;
 stick.begin(1,100,100);stick.move(1,130,100);press.begin(4);
 view.drag.begin(2,200,200,0);view.pinch.begin(2,200,200,17);view.pinch.begin(3,300,200,17);
 assert.equal(stick.move(2,300,100),null);assert.equal(view.pinch.move(1,900,100),null);
 assert.equal(view.pinch.move(3,400,200),8.5);assert.ok(stick.x>0);
 view.cancelInput();stick.reset();press.cancel();
 assert.equal(view.pinch.points.size,0);assert.equal(view.drag.active,null);assert.equal(stick.x,0);assert.equal(press.end(4,true),false);
 assert.deepEqual(new Set(released),new Set([2,3]));
});
test('control preferences are isolated from saves and validate blocked/malformed storage',()=>{
 const engine=new Engine(createState()),before=JSON.parse(serialize(engine.s));
 assert.deepEqual(readTouch({getItem:()=>'{broken'}),DEFAULT_TOUCH);
 assert.deepEqual(readTouch({getItem:()=>{throw Error('blocked');}}),DEFAULT_TOUCH);
 assert.deepEqual(touchPreferences({hand:'left',size:'large',sensitivity:999}),{hand:'left',size:'large',sensitivity:1.2});
 assert.equal(touchPreferences({sensitivity:NaN}).sensitivity,1);
 const value=readTouch({getItem:key=>key===TOUCH_KEY?JSON.stringify({hand:'left',size:'large',sensitivity:.8}):null});
 assert.equal(value.hand,'left');assert.equal(value.sensitivity,.8);
 assert.deepEqual(JSON.parse(serialize(engine.s)).payload,before.payload);
});
test('feed remains nonnegative through legacy save, capacity rejection and repeated transfers',()=>{
 const e=new Engine(deserialize(serialize(createState())));
 assert.equal(e.s.inventory.feed,10);
 e.s.buildings.find(b=>b.type==='campfire')!.type='chest';
 for(const q of [-10,0,1.5,NaN,11])assert.equal(e.transferStorage('feed',q,true),false);
 assert.equal(e.s.inventory.feed,10);const quote=storageQuote(e,'feed',true);assert.equal(quote.amount,10);
 assert.ok(e.transferStorage('feed',quote.amount,true));assert.equal(e.transferStorage('feed',quote.amount,true),false);
 assert.equal(e.s.inventory.feed,0);assert.equal(e.s.storage.feed,10);
 assert.ok(e.transferStorage('feed',10,false));assert.equal(e.s.inventory.feed,10);assert.equal(e.s.storage.feed,0);
 const bad=structuredClone(e.s);bad.inventory.feed=-10;assert.throws(()=>deserialize(serialize(bad)));
 e.s.inventory.wood=1200;assert.equal(storageQuote(e,'feed',false).amount,0);assert.equal(deserialize(serialize(e.s)).inventory.wood,1200);
});
test('storage selection/quotes do not mutate bags; changed capacity invalidates quote and guest waits for authority',()=>{
 const e=new Engine(createState());e.s.buildings.find(b=>b.type==='campfire')!.type='chest';
 e.s.storage.wood=1199;const before=structuredClone(e.s);
 const q=storageQuote(e,'feed',true);assert.equal(q.amount,1);assert.deepEqual(e.s,before);
 e.s.storage.wood=1200;assert.equal(storageQuote(e,'feed',true).amount,0);assert.notEqual(storageQuote(e,'feed',true).signature,q.signature);
 const sent:unknown[]=[];e.network={guest:true,server:true,shared:true,peers:[],send:(method,args)=>{sent.push([method,args]);return true;}};
 const bags=structuredClone([e.s.inventory,e.s.storage]);e.transferStorage('feed',1,true);
 assert.deepEqual([e.s.inventory,e.s.storage],bags);assert.deepEqual(sent,[['transferStorage',['feed',1,true]]]);
});

async function iconRenderer(){
 const result=await build({stdin:{contents:"import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import GameIcon from './components/game/GameIcon';export const render=(id)=>renderToStaticMarkup(React.createElement(GameIcon,{id}));",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false,jsx:'automatic',logLevel:'silent'});
 const mod={exports:{} as {render:(id:string)=>string}};
 new Function('module','exports','require',result.outputFiles[0].text)(mod,mod.exports,createRequire(import.meta.url));return mod.exports.render;
}
test('all catalog icons use bounded art; actual SVG rendering letterboxes instead of stretching in wide and tall boxes',async()=>{
 const render=await iconRenderer(), ids=Object.keys(ITEMS);
 for(const id of ids){
  assert.ok(ORCHARD_ART.includes(id)||itemArt(id),`Missing ${id}`);
  const svg=render(id);assert.match(svg,/<svg/);assert.doesNotMatch(svg,/lucide-circle-help/);
  if(itemArt(id))assert.match(svg,/preserveAspectRatio="xMidYMid meet"/);
 }
 const review=ids.filter(id=>!!itemArt(id));
 for(const id of review){
  const art=itemArt(id)!;const sheet=Buffer.from(await sharp(`public/art/farm-icons-${art.sheet}.webp`).png().toBuffer()).toString('base64');
  const svg=render(id).replace(/href="[^"]+"/,`href="data:image/png;base64,${sheet}"`);
  const wide=await sharp(Buffer.from(svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" '))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const tall=await sharp(Buffer.from(svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="40" height="120" '))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Preserving the source ratio leaves transparent edges in either non-square context.
  for(const image of [wide,tall]){let sum=0;for(let i=3;i<image.data.length;i+=4)sum+=image.data[i];assert.ok(sum>255*80,`${id} is not blank`);}
  for(let y=0;y<40;y++)assert.equal(wide.data[(y*120)*4+3],0,`${id} wide left edge`);
  for(let x=0;x<40;x++)assert.equal(tall.data[x*4+3],0,`${id} tall top edge`);
 }
 // Existing atlas neighbours start below y=544. Feed/bread views exclude that row.
 for(const id of ['wheatseed','carrotseed','feed','bread'])assert.equal(itemArt(id)!.y+itemArt(id)!.height,544);
 assert.equal(itemArt('potato')!.y+itemArt('potato')!.height,372);
 const css=readFileSync('app/globals.css','utf8')+'\n'+readFileSync('components/game/menu.css','utf8')+'\n'+readFileSync('components/game/mobile-recovery.css','utf8');
 const rows=ids.map(id=>`<div class="bundle-item"><span style="display:contents">${render(id)}</span><span>${id}</span></div>`).join('');
 mkdirSync('work',{recursive:true});
 writeFileSync('work/mobile-art-review.html',`<!doctype html><meta charset="utf-8"><title>Item art regression fixture</title><style>${css}\nhtml,body{height:auto;overflow:visible}body{background:#20372b;color:#fff;padding:16px}.gallery{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.bundle-item{border:1px solid #aaa;padding:8px}.game-icon{width:44px;height:44px}</style><h1>Regression fixture · all ${ids.length} item icons</h1><div class="gallery">${rows}</div>`);
});
