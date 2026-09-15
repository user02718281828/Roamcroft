'use client';
import {useEffect,useState} from 'react';
import {installPrompt,pendingUpdate,preparePwa,type InstallEvent} from '@/lib/game/pwa';
import {enterGameFullscreen} from '@/lib/game/viewport';
export default function PwaControls({onSave}:{onSave:()=>Promise<void>}){
 const [install,setInstall]=useState<InstallEvent|null>(installPrompt),[message,setMessage]=useState('');
 const [update,setUpdate]=useState(!!pendingUpdate()),[updating,setUpdating]=useState(false);
 useEffect(()=>{
   preparePwa();
   const available=()=>{setInstall(installPrompt());setUpdate(!!pendingUpdate());};
   window.addEventListener('roamcroft-install',available);
   return()=>window.removeEventListener('roamcroft-install',available);
 },[]);
 const fullscreen=async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else if(!await enterGameFullscreen())setMessage('Safari’de Paylaş → Ana Ekrana Ekle ile tam ekran oyna.');}
   catch{setMessage('Tarayıcı tam ekranı açamadı. Ana ekrana eklemeyi deneyebilirsin.');}
 };
 const activate=async()=>{setUpdating(true);try{await onSave();const worker=pendingUpdate();if(!worker){location.reload();return;}navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});worker.postMessage({type:'ACTIVATE_UPDATE'});}catch(error){setMessage(error instanceof Error?error.message:'Kayıt yapılamadı.');setUpdating(false);}};
 return <div className="pwa-controls"><button className="secondary-button" onClick={()=>void fullscreen()}>Tam ekran</button>{install&&<button className="secondary-button" onClick={()=>void install.prompt().then(()=>install.userChoice).then(choice=>{if(choice.outcome==='accepted')setInstall(null);})}>Ana ekrana ekle</button>}{update&&<button className="primary-button" disabled={updating} onClick={()=>void activate()}>{updating?'Kaydediliyor…':'Kaydet ve güncelle'}</button>}{message&&<p role="status">{message}</p>}</div>;
}
