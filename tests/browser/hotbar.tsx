// Actual Panels/editor/hotbar; one hungry in-memory character, no storage/API game clients.
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Engine,createState} from '../../lib/game/model';
import {setLocale} from '../../lib/i18n/locale';
import {useHotbar,assignHotbar} from '../../lib/ui/hotbar-preferences';
import {serialize} from '../../lib/game/save';
import {eatHotbarItem,hotbarIntent} from '../../lib/ui/hotbar';
import Hotbar from '../../components/game/Hotbar';
import Panels from '../../components/game/Panels';
import type {Panel} from '../../lib/ui/game-menu';
setLocale('en');
const engine=new Engine(createState());engine.s.inventory.bread=1;engine.s.player.hunger=5;engine.s.upgrades.axe=3;
const noop=()=>{};
function Fixture(){
  const layout=useHotbar(),[panel,setPanel]=useState<Panel>(null),[active,setActive]=useState(-1),[item,setItem]=useState<string|null>(null),[,refresh]=useState(0),[result,setResult]=useState('Not run');
  const select=(index:number)=>{if(panel)return;const intent=hotbarIntent(layout[index],engine.s.inventory);if(!intent)return;setActive(index);setItem(intent.item);};
  const use=()=>{if(panel||!item)return;eatHotbarItem(engine,item);refresh(n=>n+1);};
  async function paletteTest(){
    const before=JSON.stringify(JSON.parse(serialize(engine.s)).payload),old=layout[8];
    const until=async(check:()=>boolean)=>{for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw Error('UI state did not settle');};
    const click=(selector:string)=>{const node=document.querySelector<HTMLElement>(selector)!;if(!node)throw Error('Missing '+selector);node.click();};
    const closed=()=>document.querySelector('.quickbar')?.getAttribute('data-open')==='false';
    try{
      setResult('Running');assignHotbar(8,{kind:'item',id:'bread'});
      await until(()=>!!document.querySelector('.item-hotbar button:last-child:not(:disabled)'));
      click('.quickbar-toggle');await until(()=>!closed());
      for(const node of document.querySelectorAll<HTMLElement>('.item-hotbar button')){
        const b=node.getBoundingClientRect();
        if(b.width<44||b.height<44||b.x<0||b.y<0||b.right>innerWidth||b.bottom>innerHeight||!node.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)))throw Error('Slot target clipped, covered or too small');
      }
      click('.item-hotbar button:last-child');await until(closed);
      await until(()=>document.querySelector('[data-testid="stock"]')!.textContent!.includes('Active 9'));
      for(const action of ['back','escape','outside','resize']){
        const oldToken=history.state?.roamcroftPanel;
        click('.quickbar-toggle');await until(()=>!closed()&&history.state?.roamcroftPanel&&history.state.roamcroftPanel!==oldToken);
        if(action==='back')history.back();
        else if(action==='outside')click('.quickbar-dismiss');
        else if(action==='resize')window.dispatchEvent(new Event('resize'));
        else window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
        await until(closed);
      }
      if(JSON.stringify(JSON.parse(serialize(engine.s)).payload)!==before)throw Error('Selection mutated save');
      setResult(`PASS ${innerWidth}×${innerHeight}: nine visible 44px hit targets, slot9 selection, Back, Escape, outside, resize. Save unchanged.`);
    }catch(error){setResult('FAIL '+String(error));}finally{assignHotbar(8,old);}
  }
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(panel||['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;if(/^[1-9]$/.test(e.key))select(Number(e.key)-1);if(e.key==='e'&&!e.repeat)use();};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  });
  return <><h1>LOCAL nine-slot hotbar fixture</h1><p>One hungry test character. Menu/binding preferences only; no game saves or backend clients.</p>
    <output data-testid="stock">Bread {engine.s.inventory.bread} · Axe tier {engine.s.upgrades.axe} · Active {active+1} · Held {item||'none'}</output>
    <button onClick={()=>void paletteTest()}>Run palette regression</button><output data-testid="palette-result">{result}</output>
    <Hotbar layout={layout} inventory={engine.s.inventory} active={active} onSelect={select} disabled={!!panel}/>
    <button onClick={()=>setPanel('inventory')}>Open bag</button><button disabled={!item||!hotbarIntent({kind:'item',id:item},engine.s.inventory)?.available} onClick={use}>Use selected item</button>
    <Panels engine={engine} panel={panel} setPanel={setPanel} audio={null} coop={null} onBuild={noop} onSeed={noop} onEquip={noop}
      onImport={noop} onExport={noop} onSave={noop} onReset={noop} selectedBuilding={null} sound={false} setSound={noop} saveStatus="" onApproach={noop} selectedNPC="narin" quality={false} setQuality={noop}/>
  </>;
}
createRoot(document.getElementById('app')!).render(<Fixture/>);
