'use client';
import {useEffect,useState} from 'react';
type InstallEvent=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function PwaControls(){
 const [install,setInstall]=useState<InstallEvent|null>(null),[message,setMessage]=useState('');
 useEffect(()=>{
   if('serviceWorker' in navigator)void navigator.serviceWorker.register('/sw.js').catch(()=>{});
   const available=(event:Event)=>{event.preventDefault();setInstall(event as InstallEvent);};
   const installed=()=>setInstall(null);
   window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',installed);
   return()=>{window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',installed);};
 },[]);
 const fullscreen=async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else setMessage('Safari’de Paylaş → Ana Ekrana Ekle ile tam ekran oyna.');}
   catch{setMessage('Tarayıcı tam ekranı açamadı. Ana ekrana eklemeyi deneyebilirsin.');}
 };
 return <div className="pwa-controls"><button className="secondary-button" onClick={()=>void fullscreen()}>Tam ekran</button>{install&&<button className="secondary-button" onClick={()=>void install.prompt().then(()=>install.userChoice).then(choice=>{if(choice.outcome==='accepted')setInstall(null);})}>Ana ekrana ekle</button>}{message&&<p role="status">{message}</p>}</div>;
}
