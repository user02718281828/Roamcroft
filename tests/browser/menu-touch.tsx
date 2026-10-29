// Real Panels/Base UI/CSS in a local, in-memory fixture. No save or backend client.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import Panels from '../../components/game/Panels';
import {Engine,createState} from '../../lib/game/model';
import {serialize} from '../../lib/game/save';
import {setLocale} from '../../lib/i18n/locale';
import type {Panel} from '../../lib/ui/game-menu';
setLocale('en');
const engine=new Engine(createState()),before=JSON.parse(serialize(engine.s)).payload;
const noop=()=>{};
const settle=()=>new Promise(resolve=>setTimeout(resolve,240));
const assert=(value:unknown,message:string)=>{if(!value)throw Error(message);};
async function until(check:()=>boolean,message:string){
  for(let n=0;n<100;n++){if(check())return;await new Promise(resolve=>setTimeout(resolve,20));}
  assert(check(),message);
}
function hit(button:HTMLElement,x:number,y:number){
  const target=document.elementFromPoint(x,y);
  assert(target&&button.contains(target),`Close hit intercepted at ${x},${y} in ${innerWidth}×${innerHeight} by ${(target as HTMLElement)?.className}`);
  return target!;
}
function tap(button:HTMLElement){
  const b=button.getBoundingClientRect();
  assert(b.width>=44&&b.height>=44,'Close is smaller than 44×44 CSS pixels');
  // Check the whole target, not only the SVG or an accessibility/forced click.
  for(const [x,y]of [[.5,.5],[.1,.1],[.9,.1],[.1,.9],[.9,.9]])hit(button,b.x+b.width*x,b.y+b.height*y);
  const x=b.x+b.width/2,y=b.y+b.height/2,target=hit(button,x,y);
  const opts={bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y,pointerId:41,pointerType:'touch',isPrimary:true,button:0};
  target.dispatchEvent(new PointerEvent('pointerdown',{...opts,buttons:1}));
  if(typeof Touch==='function'&&typeof TouchEvent==='function'){
    const touch=new Touch({identifier:41,target,clientX:x,clientY:y});
    target.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[touch],changedTouches:[touch],targetTouches:[touch]}));
    target.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:[touch],targetTouches:[]}));
  }
  target.dispatchEvent(new PointerEvent('pointerup',{...opts,buttons:0}));
  target.dispatchEvent(new PointerEvent('click',{...opts,detail:1,buttons:0}));
}
function Fixture(){
  const [panel,setPanel]=useState<Panel>(null),[result,setResult]=useState('Not run'),[running,setRunning]=useState(false);
  async function run(){
    setRunning(true);setResult('Running synthetic touch + real hit testing…');
    let cycle=0;
    const open=async()=>{cycle++;setPanel('inventory');await until(()=>{
      const node=document.querySelector('.game-panel');
      if(!node||node.hasAttribute('data-starting-style')||node.hasAttribute('data-ending-style'))return false;
      const b=node.getBoundingClientRect();
      return b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight;
    },'Panel did not finish opening, cycle '+cycle);};
    const closed=async()=>{await until(()=>!document.querySelector('.game-panel'),'Panel did not close, cycle '+cycle);};
    try{
      assert(matchMedia('(pointer:coarse),(max-width:600px),(max-height:500px) and (max-width:1100px)').matches,'Use a mobile viewport');
      const x=()=>document.querySelector<HTMLElement>('.game-panel [data-slot="sheet-close"]:not(.camp-return)')!;
      for(let i=0;i<3;i++){await open();tap(x());await closed();}
      await open();document.querySelector<HTMLButtonElement>('.camp-menu-toggle')!.click();await settle();
      assert(document.querySelector('.camp-menu[data-expanded="true"]'),'Navigation not expanded');tap(x());await closed();
      await open();tap(document.querySelector<HTMLElement>('.camp-return')!);await closed();
      await open();history.back();await closed();
      await open();document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));await closed();
      await open();document.querySelectorAll<HTMLButtonElement>('.pack-destinations button')[1].click();await settle();
      assert(document.querySelector('.pack-storage-locked .primary-button'),'Storage prerequisite is not discoverable');tap(x());await closed();
      await open();document.querySelector<HTMLButtonElement>('.pack-slot[title="Village bread"]')!.click();await settle();
      assert(document.querySelector('.pack-use'),'Selected food action is not visible');tap(x());await closed();
      // Deliberately delay the old close traversal, then reopen before it arrives.
      const originalBack=history.back.bind(history);
      let release!:()=>void;const popped=new Promise<void>(r=>{release=r;});
      history.back=()=>{setTimeout(()=>{window.addEventListener('popstate',()=>setTimeout(release,20),{once:true});originalBack();},350);};
      try{
        await open();tap(x());await closed();await open();await popped;
        assert(document.querySelector('.game-panel'),'Old close traversal dismissed a newly opened menu');
      }finally{history.back=originalBack;}
      tap(x());await closed();
      assert(JSON.stringify(JSON.parse(serialize(engine.s)).payload)===JSON.stringify(before),'Menu mutated game/save data');
      setResult(`PASS · ${innerWidth}×${innerHeight} · 11 open/close cycles: X, navigation, footer, Back, Escape, storage discovery, food selection, delayed Back + rapid reopen. Inventory/save unchanged.`);
    }catch(error){
      const node=document.querySelector('.game-panel');
      setResult(`FAIL · cycle ${cycle} · ${String(error)} · ${JSON.stringify(node?{start:node.hasAttribute('data-starting-style'),end:node.hasAttribute('data-ending-style'),panel:node.getAttribute('data-panel'),animations:node.getAnimations().map(a=>({state:a.playState,time:a.currentTime,timing:a.effect?.getTiming(),property:(a as CSSTransition).transitionProperty}))}:{mounted:false})}`);
      setPanel(null);
    }
    finally{setRunning(false);}
  }
  return <><h1>LOCAL menu touch regression fixture</h1><p>In-memory Engine only. Synthetic touch events are not physical Android acceptance.</p>
    <output data-testid="result" role="status">{result}</output>
    <button className="primary-button" disabled={running} onClick={()=>void run()}>Run touch regressions</button>
    <button className="secondary-button" onClick={()=>setPanel('inventory')}>Open bag</button>
    <Panels engine={engine} panel={panel} setPanel={setPanel} audio={null} coop={null} onBuild={noop} onSeed={noop} onEquip={noop}
      onImport={noop} onExport={noop} onSave={noop} onReset={noop} selectedBuilding={null} sound={false} setSound={noop}
      saveStatus="" onApproach={noop} selectedNPC="narin" quality={false} setQuality={noop}/>
  </>;
}
createRoot(document.getElementById('app')!).render(<Fixture/>);
