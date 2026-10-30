'use client';
import {useEffect,useRef,useState,useId} from 'react';
import {ChevronUp} from 'lucide-react';
import {ITEMS,TOOLS,type Bag} from '@/lib/game/data';
import {hotbarCount,type HotbarBinding,type HotbarLayout} from '@/lib/ui/hotbar';
import {localize,translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import GameIcon from './GameIcon';
import {usePanelHistory} from '@/lib/ui/panel-history';
export function bindingName(slot:HotbarBinding){return slot?.kind==='tool'&&slot.id==='hand'?translate('hotbar.hand'):slot?localize(slot.kind==='tool'?TOOLS.find(t=>t.id===slot.id)?.name||slot.id:ITEMS[slot.id]?.name||slot.id):translate('hotbar.empty');}
export default function Hotbar({layout,inventory,active,onSelect,disabled,fallback}:{layout:HotbarLayout;inventory:Bag;active:number;onSelect:(index:number)=>void;disabled:boolean;fallback?:{name:string;icon:string}}){
  useLocale();const bar=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false),id=useId(),selected=layout[active];
  usePanelHistory(open,()=>setOpen(false));
  useEffect(()=>{if(disabled)setOpen(false);},[disabled]);
  useEffect(()=>{
    if(!open)return;
    const key=(event:KeyboardEvent)=>{
      // Tab keeps normal focus traversal instead of opening the game's bag.
      if(event.key==='Tab'){event.stopPropagation();return;}
      if(event.key==='Escape'||/^[1-9]$/.test(event.key)){
        event.preventDefault();event.stopPropagation();
        if(event.key!=='Escape')onSelect(Number(event.key)-1);
        setOpen(false);
      }
    };
    const resize=()=>setOpen(false);
    window.addEventListener('keydown',key,true);window.addEventListener('resize',resize);
    return()=>{window.removeEventListener('keydown',key,true);window.removeEventListener('resize',resize);};
  },[open,onSelect]);
  useEffect(()=>{
    const node=bar.current;if(!node)return;
    const align=()=>{
      const child=node.children.item(active);if(!child)return;
      const outer=node.getBoundingClientRect(),inner=child.getBoundingClientRect();
      if(inner.left<outer.left+4)node.scrollLeft+=inner.left-outer.left-4;
      else if(inner.right>outer.right-4)node.scrollLeft+=inner.right-outer.right+4;
    };
    align();const resize=new ResizeObserver(align);resize.observe(node);
    return()=>resize.disconnect();
  },[active]);
  return <div className="quickbar" data-open={open} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false);}}>
    {open&&<button className="quickbar-dismiss" type="button" tabIndex={-1} aria-label={translate('hotbar.close')} onClick={()=>setOpen(false)}/>}
    <button className="quickbar-toggle glass" type="button" disabled={disabled} aria-expanded={open} aria-controls={id} aria-label={translate('hotbar.choose')} onClick={()=>setOpen(v=>!v)}>
      <GameIcon id={selected?.kind==='item'?selected.id:selected?.id==='fish'?'rod':selected?.id||fallback?.icon||'hand'}/>
      <span>{selected?bindingName(selected):fallback?.name||translate('hotbar.hand')}</span><ChevronUp aria-hidden="true"/>
    </button>
    <div id={id} className="toolbar glass item-hotbar" ref={bar} role="group" aria-label={translate('hotbar.title')}>
    {layout.map((slot,index)=>{
      const count=hotbarCount(slot,inventory),name=bindingName(slot);
      return <button type="button" key={index} disabled={disabled||!slot} aria-pressed={active===index} data-stock-empty={slot?.kind==='item'&&count===0}
        className={active===index?'selected':''} onClick={()=>{onSelect(index);setOpen(false);}}
        aria-label={translate('hotbar.slot',{slot:index+1,name,count:slot?.kind==='item'?count:'—'})} title={`${index+1} · ${name}`}>
        <kbd aria-hidden="true">{index+1}</kbd>{slot&&<GameIcon id={slot.kind==='tool'&&slot.id==='fish'?'rod':slot.id}/>}
        {slot?.kind==='item'&&<b className="hotbar-count" aria-hidden="true">{count}</b>}
      </button>;
    })}
    </div>
  </div>;
}
