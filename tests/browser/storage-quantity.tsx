import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Engine,createState} from '../../lib/game/model';
import {setLocale} from '../../lib/i18n/locale';
import StoragePanel from '../../components/game/StoragePanel';
setLocale('en');
const engine=new Engine(createState());
engine.s.buildings.find(b=>b.type==='campfire')!.type='chest';
function Fixture(){
  const [,render]=useState(0);
  return <div onClick={()=>render(n=>n+1)} onChange={()=>render(n=>n+1)}>
    <h1>LOCAL storage quantity fixture</h1><p>In-memory Engine. No saves, accounts or game API clients.</p>
    <output data-testid="stock">Wood: bag {engine.s.inventory.wood||0}, storage {engine.s.storage.wood||0}</output>
    <StoragePanel engine={engine}/>
  </div>;
}
createRoot(document.getElementById('app')!).render(<Fixture/>);
