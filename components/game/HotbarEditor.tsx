'use client';
import {useState} from 'react';
import {TOOLS} from '@/lib/game/data';
import {useHotbar,assignHotbar} from '@/lib/ui/hotbar-preferences';
import {localize,translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import {bindingName} from './Hotbar';
export default function HotbarEditor({itemId}:{itemId?:string}){
  useLocale();const layout=useHotbar(),[choice,setChoice]=useState('item'),[message,setMessage]=useState('');
  return <details className="hotbar-editor"><summary>{translate('hotbar.bind')}</summary>
    <p>{translate('hotbar.help')}</p>
    <label>{translate('hotbar.choice')}<select value={choice} onChange={e=>{setChoice(e.target.value);setMessage('');}}>
      <option value="item" disabled={!itemId}>{translate('hotbar.selectedItem')}</option>
      {TOOLS.map(t=><option key={t.id} value={t.id}>{bindingName({kind:'tool',id:t.id})}</option>)}
      <option value="empty">{translate('hotbar.clear')}</option>
    </select></label>
    <div className="hotbar-bindings" role="group" aria-label={translate('hotbar.bind')}>
      {layout.map((slot,index)=><button type="button" key={index} disabled={choice==='item'&&!itemId}
        aria-label={translate('hotbar.assignSlot',{slot:index+1,name:bindingName(slot)})}
        onClick={()=>{assignHotbar(index,choice==='empty'?null:{kind:choice==='item'?'item':'tool',id:choice==='item'?itemId!:choice});setMessage(translate('hotbar.bound',{slot:index+1}));}}>
        <b>{index+1}</b><small>{bindingName(slot)}</small>
      </button>)}
    </div><output role="status">{message}</output>
  </details>;
}
