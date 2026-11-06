'use client';
import {useEffect,useRef,useState} from 'react';
import type {Engine} from '@/lib/game/model';
import type {ValleyScene} from '@/lib/game/scene';
import {InteriorScene} from '@/lib/game/interior-scene';
import {FURNITURE,type FurnitureType} from '@/lib/game/interiors';
import {Dialog} from '@base-ui/react/dialog';
import {ITEMS} from '@/lib/game/data';
import {translate,localize} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import {usePanelHistory} from '@/lib/ui/panel-history';
import StoragePanel from './StoragePanel';
import Joystick from './Joystick';
import './interior.css';

export default function InteriorView({engine,artist,onExit,onMove,onSave,sensitivity,hand,size}:{
  engine:Engine;artist:ValleyScene|null;onExit:()=>void;onMove:(v:{x:number;y:number})=>void;onSave:()=>Promise<void>;sensitivity:number;hand:string;size:string;
}){
  useLocale();usePanelHistory(true,onExit);
  const [surface,setSurface]=useState<HTMLCanvasElement|null>(null),picker=useRef<(x:number,z:number)=>void>(()=>{});
  const [editing,setEditing]=useState(false),[kind,setKind]=useState<FurnitureType>('chair'),[rotation,setRotation]=useState(0);
  const [selected,setSelected]=useState<number|undefined>(),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[,redraw]=useState(0);
  const session=engine.interior,room=engine.roomData();
  useEffect(()=>{setMessage(engine.homeMessage);},[engine.homeMessage]);
  const feedback=(ok:boolean)=>{setMessage(ok?translate('home.updated'):localize(engine.events.at(-1)?.text||translate('home.blocked')));redraw(n=>n+1);};
  picker.current=(x,z)=>{
    if(!engine.interior)return;
    if(editing){
      if(selected!==undefined){feedback(engine.decorateHome(kind,x,z,rotation,selected));return;}
      feedback(engine.decorateHome(kind,x,z,rotation));
    }else engine.goInside(x,z);
  };
  useEffect(()=>{
    if(!surface||!artist)return;
    let view:InteriorScene|undefined,frame=0,disposed=false,last=0;
    try{view=new InteriorScene(engine,artist,surface,(x,z)=>picker.current(x,z));
      const loop=(now:number)=>{if(disposed)return;if(!document.hidden)view?.draw(Math.min(.08,(now-(last||now))/1000));last=now;frame=requestAnimationFrame(loop);};
      frame=requestAnimationFrame(loop);
    }catch{setMessage(translate('home.unavailable'));}
    return()=>{disposed=true;cancelAnimationFrame(frame);view?.dispose();onMove({x:0,y:0});};
  },[engine,artist,surface]);
  if(!session||!room)return null;
  const current=room.items.find(f=>f.id===selected),open=editing||session.storageOpen;
  const name=(type:FurnitureType)=>translate(`home.item.${type}`);
  return <Dialog.Root open onOpenChange={value=>{if(!value)onExit();}}><Dialog.Portal><Dialog.Popup className="game-shell interior-shell" data-touch-hand={hand} data-touch-size={size} data-edit={open}>
    <header><Dialog.Title>{translate('home.title')}</Dialog.Title><button type="button" onClick={onExit}>{translate('home.exit')}</button></header>
    <Dialog.Description className="sr-only">{translate('home.help')}</Dialog.Description>
    <div className="interior-stage"><canvas ref={setSurface} aria-label={translate('home.canvas')}/>
      <div className="interior-touch"><Joystick disabled={busy} onMove={onMove} sensitivity={sensitivity}/></div>
    </div>
    {open&&<aside className="interior-tools" aria-label={translate('home.decorate')}>
      <button type="button" onClick={()=>{setEditing(false);session.storageOpen=false;redraw(n=>n+1);}}>{translate('ui.close')}</button>
      {session.storageOpen?<StoragePanel engine={engine}/>:<>
        <p>{translate('home.placeHelp')}</p>
        <label>{translate('home.newItem')}<select value={kind} onChange={e=>{setKind(e.target.value as FurnitureType);setSelected(undefined);}}>
          {(Object.keys(FURNITURE) as FurnitureType[]).map(type=><option key={type} value={type}>{name(type)}</option>)}
        </select></label>
        <div className="interior-cost">{Object.entries(FURNITURE[current?.type||kind].cost).map(([id,n])=><span key={id}>{n} {localize(ITEMS[id].name)}</span>)}</div>
        <label>{translate('home.moveItem')}<select value={selected??''} onChange={e=>{const id=e.target.value?Number(e.target.value):undefined;setSelected(id);setRotation(room.items.find(f=>f.id===id)?.rotation||0);}}>
          <option value="">{translate('home.buyMode')}</option>{room.items.map(f=><option key={f.id} value={f.id}>{f.id} · {name(f.type)}</option>)}
        </select></label>
        <button type="button" onClick={()=>setRotation(r=>(r+1)%4)}>{translate('home.rotate')} · {rotation*90}°</button>
        <button type="button" disabled={!current} onClick={()=>{if(current&&engine.removeDecoration(current.id)){setSelected(undefined);feedback(true);}else feedback(false);}}>{translate('home.remove')}</button>
        <label>{translate('home.floor')}<select value={room.floor} onChange={e=>feedback(engine.styleHome(e.target.value,room.wall))}>
          <option value="oak">{translate('home.oak')}</option><option value="stone">{translate('home.stone')}</option><option value="dark">{translate('home.dark')}</option>
        </select></label>
        <label>{translate('home.wall')}<select value={room.wall} onChange={e=>feedback(engine.styleHome(room.floor,e.target.value))}>
          <option value="cream">{translate('home.cream')}</option><option value="sage">{translate('home.sage')}</option><option value="clay">{translate('home.clay')}</option>
        </select></label>
      </>}
    </aside>}
    <footer><small>{translate('home.help')}</small><div>
      <button type="button" onClick={()=>feedback(engine.interactHome())}>{translate('home.use')}</button>
      <button type="button" aria-pressed={editing} onClick={()=>{session.storageOpen=false;setEditing(!editing);setMessage('');}}>{translate('home.decorate')}</button>
      <button type="button" disabled={busy} onClick={()=>{setBusy(true);void onSave().then(()=>setMessage(translate('home.saved'))).catch(()=>setMessage(translate('home.saveError'))).finally(()=>setBusy(false));}}>{translate('home.save')}</button>
    </div>{message&&<output role="status">{localize(message)}</output>}</footer>
  </Dialog.Popup></Dialog.Portal></Dialog.Root>;
}
