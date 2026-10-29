// Actual Panels/editor/hotbar; one hungry in-memory character, no storage/API game clients.
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Engine,createState} from '../../lib/game/model';
import {setLocale} from '../../lib/i18n/locale';
import {useHotbar} from '../../lib/ui/hotbar-preferences';
import {eatHotbarItem,hotbarIntent} from '../../lib/ui/hotbar';
import Hotbar from '../../components/game/Hotbar';
import Panels from '../../components/game/Panels';
import type {Panel} from '../../lib/ui/game-menu';
setLocale('en');
const engine=new Engine(createState());engine.s.inventory.bread=1;engine.s.player.hunger=5;engine.s.upgrades.axe=3;
const noop=()=>{};
function Fixture(){
  const layout=useHotbar(),[panel,setPanel]=useState<Panel>(null),[active,setActive]=useState(-1),[item,setItem]=useState<string|null>(null),[,refresh]=useState(0);
  const select=(index:number)=>{if(panel)return;const intent=hotbarIntent(layout[index],engine.s.inventory);if(!intent)return;setActive(index);setItem(intent.item);};
  const use=()=>{if(panel||!item)return;eatHotbarItem(engine,item);refresh(n=>n+1);};
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(panel||['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))return;if(/^[1-9]$/.test(e.key))select(Number(e.key)-1);if(e.key==='e'&&!e.repeat)use();};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  });
  return <><h1>LOCAL nine-slot hotbar fixture</h1><p>One hungry test character. Menu/binding preferences only; no game saves or backend clients.</p>
    <output data-testid="stock">Bread {engine.s.inventory.bread} · Axe tier {engine.s.upgrades.axe} · Active {active+1} · Held {item||'none'}</output>
    <Hotbar layout={layout} inventory={engine.s.inventory} active={active} onSelect={select} disabled={!!panel}/>
    <button onClick={()=>setPanel('inventory')}>Open bag</button><button disabled={!item||!hotbarIntent({kind:'item',id:item},engine.s.inventory)?.available} onClick={use}>Use selected item</button>
    <Panels engine={engine} panel={panel} setPanel={setPanel} audio={null} coop={null} onBuild={noop} onSeed={noop} onEquip={noop}
      onImport={noop} onExport={noop} onSave={noop} onReset={noop} selectedBuilding={null} sound={false} setSound={noop} saveStatus="" onApproach={noop} selectedNPC="narin" quality={false} setQuality={noop}/>
  </>;
}
createRoot(document.getElementById('app')!).render(<Fixture/>);
