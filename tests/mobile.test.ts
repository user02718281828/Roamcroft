import test from 'node:test';
import assert from 'node:assert/strict';
import {PinchGesture} from '../lib/game/touch.ts';
test('pinch zoom is anchored, bounded and does not become a click when a finger lifts',()=>{
 const pinch=new PinchGesture();assert.equal(pinch.begin(1,0,0,17),false);assert.equal(pinch.begin(2,100,0,17),true);
 assert.equal(pinch.move(2,200,0),8.5);assert.equal(pinch.move(2,400,0),7);assert.equal(pinch.move(2,50,0),22);
 assert.equal(pinch.end(2),true);assert.equal(pinch.move(1,50,20),null);assert.equal(pinch.suppress,true);assert.equal(pinch.end(1),true);assert.equal(pinch.suppress,false);
 assert.equal(pinch.begin(3,10,10,17),false);assert.equal(pinch.end(3),false);
});
test('canceled or zero-distance touches remain finite and release all gesture state',()=>{
 const pinch=new PinchGesture();pinch.begin(1,0,0,17);pinch.begin(2,0,0,17);assert.equal(pinch.move(2,10,0),null);pinch.reset();assert.equal(pinch.points.size,0);assert.equal(pinch.suppress,false);
});
