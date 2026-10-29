'use client';
import {useEffect,useRef} from 'react';
import {ITEMS,TOOLS,type Bag} from '@/lib/game/data';
import {hotbarCount,type HotbarBinding,type HotbarLayout} from '@/lib/ui/hotbar';
import {localize,translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import GameIcon from './GameIcon';
export function bindingName(slot:HotbarBinding){return slot?localize(slot.kind==='tool'?TOOLS.find(t=>t.id===slot.id)?.name||slot.id:ITEMS[slot.id]?.name||slot.id):translate('hotbar.empty');}
export default function Hotbar({layout,inventory,active,onSelect,disabled}:{layout:HotbarLayout;inventory:Bag;active:number;onSelect:(index:number)=>void;disabled:boolean}){
  useLocale();const bar=useRef<HTMLDivElement>(null);
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
  return <div className="toolbar glass item-hotbar" ref={bar} role="group" aria-label={translate('hotbar.title')}>
    {layout.map((slot,index)=>{
      const count=hotbarCount(slot,inventory),name=bindingName(slot);
      return <button type="button" key={index} disabled={disabled||!slot} aria-pressed={active===index} data-stock-empty={slot?.kind==='item'&&count===0}
        className={active===index?'selected':''} onClick={()=>onSelect(index)}
        aria-label={translate('hotbar.slot',{slot:index+1,name,count:slot?.kind==='item'?count:'—'})} title={`${index+1} · ${name}`}>
        <kbd aria-hidden="true">{index+1}</kbd>{slot&&<GameIcon id={slot.kind==='tool'&&slot.id==='fish'?'rod':slot.id}/>}
        {slot?.kind==='item'&&<b className="hotbar-count" aria-hidden="true">{count}</b>}
      </button>;
    })}
  </div>;
}
