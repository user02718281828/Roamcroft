'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import {useEffect,useState} from 'react';
import {installPrompt,pendingUpdate,preparePwa,type InstallEvent} from '@/lib/game/pwa';
import {enterGameFullscreen} from '@/lib/game/viewport';
export default function PwaControls({onSave}:{onSave:()=>Promise<void>}){
  useLocale();
 const [install,setInstall]=useState<InstallEvent|null>(installPrompt),[message,setMessage]=useState('');
 const [update,setUpdate]=useState(!!pendingUpdate()),[updating,setUpdating]=useState(false);
 useEffect(()=>{
   preparePwa();
   const available=()=>{setInstall(installPrompt());setUpdate(!!pendingUpdate());};
   window.addEventListener('roamcroft-install',available);
   return()=>window.removeEventListener('roamcroft-install',available);
 },[]);
 const fullscreen=async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else if(!await enterGameFullscreen())setMessage(sourceText("m_cb83effefd"));}
   catch{setMessage(sourceText("m_1fe77e97c8"));}
 };
 const activate=async()=>{setUpdating(true);try{await onSave();const worker=pendingUpdate();if(!worker){location.reload();return;}navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});worker.postMessage({type:'ACTIVATE_UPDATE'});}catch(error){setMessage(error instanceof Error?error.message:sourceText("m_d4625b7fa3"));setUpdating(false);}};
 return <div className="pwa-controls"><button className="secondary-button" onClick={()=>void fullscreen()}>{translate("m_dd2215475a")}</button>{install&&<button className="secondary-button" onClick={()=>void install.prompt().then(()=>install.userChoice).then(choice=>{if(choice.outcome==='accepted')setInstall(null);})}>{translate("m_fa5592b453")}</button>}{update&&<button className="primary-button" disabled={updating} onClick={()=>void activate()}>{localize(updating?sourceText('save.pending'):sourceText("m_6b6047c425"))}</button>}{localize(message&&<p role="status">{localize(message)}</p>)}</div>;
}
