import test from 'node:test';
import assert from 'node:assert/strict';
import {JoystickInput} from '../lib/game/joystick.ts';

test('joystick clamps diagonals, preserves analog strength and ignores another finger',()=>{
 const stick=new JoystickInput();assert.ok(stick.begin(1,100,100));assert.equal(stick.begin(2,200,200),false);
 assert.deepEqual(stick.move(1,102,101),{x:0,y:0});
 const half=stick.move(1,121,100)!;assert.ok(half.x>.4&&half.x<.5);assert.equal(half.y,0);
 const diagonal=stick.move(1,300,300)!;assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-8);
 assert.equal(stick.move(2,0,0),null);assert.equal(stick.end(2),false);assert.equal(stick.pointer,1);
 assert.ok(stick.end(1));assert.equal(stick.x,0);assert.equal(stick.y,0);assert.equal(stick.move(1,300,300),null);
});
test('canceling a held joystick cannot leave movement latched',()=>{
 const stick=new JoystickInput();stick.begin(9,0,0);stick.move(9,42,0);stick.reset();
 assert.equal(stick.pointer,null);assert.equal(stick.x,0);assert.equal(stick.y,0);assert.ok(stick.begin(10,20,20));assert.deepEqual(stick.move(10,20,20),{x:0,y:0});
});
