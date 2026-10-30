import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceNotices} from '../lib/ui/notices.ts';
import {createState} from '../lib/game/model.ts';
import {serialize} from '../lib/game/save.ts';
import {localizeText,translateFor} from '../lib/i18n/core.ts';

test('HUD repeats merge without extending display or mutating engine events/save',()=>{
  let id=0;const next=()=>++id,event={text:'+3 odun',kind:'good' as const,sound:'axe' as const};
  const state=createState(),save=JSON.parse(serialize(state)).payload,original=JSON.stringify(event);
  const first=advanceNotices([], [event],100,next);
  const repeated=advanceNotices(first,[event,event],500,next);
  assert.equal(repeated.length,1);assert.equal(repeated[0].count,3);
  assert.equal(repeated[0].expires,first[0].expires);assert.equal(first[0].count,1);
  assert.equal(JSON.stringify(event),original);assert.deepEqual(JSON.parse(serialize(state)).payload,save);
  assert.equal(advanceNotices(repeated,[],1900,next).length,0);
});
test('HUD queue is bounded, prioritizes warnings after current notice, and gives next entry a full life',()=>{
  let id=0;const next=()=>++id;
  const queue=advanceNotices([],['a','b','c','d'].map(text=>({text,kind:'good'})),0,next);
  assert.deepEqual(queue.map(n=>n.text),['a','b','c']);
  const warning=advanceNotices(queue,[{text:'Yaklaşmalısın',kind:'bad'}],100,next);
  assert.deepEqual(warning.map(n=>n.text),['a','Yaklaşmalısın','b']);
  const promoted=advanceNotices(warning,[],1800,next);
  assert.equal(promoted[0].text,'Yaklaşmalısın');assert.equal(promoted[0].expires,4200);
  assert.equal(advanceNotices(promoted,[],1900,next),promoted);
});
test('HUD drops stale queued entries, preserves long text and protected names for localization',()=>{
  let id=0;const next=()=>++id;
  const text='Narin: '+ 'uzun mesaj '.repeat(40);
  const queue=advanceNotices([],[{text,kind:'info'},{text:'old',kind:'good'}],0,next);
  assert.equal(queue[0].text,text);
  assert.deepEqual(advanceNotices(queue,[],7000,next),[]);
});
test('HUD raw warning remains translatable in both supported languages',()=>{
  const text=translateFor('tr','m_6455e5a37b');
  const queue=advanceNotices([],[{text,kind:'info'}],0,()=>1);
  assert.equal(localizeText(queue[0].text,'en'),translateFor('en','m_6455e5a37b'));
  assert.equal(localizeText(queue[0].text,'tr'),text);
});
