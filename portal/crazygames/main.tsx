import {createRoot} from 'react-dom/client';
import {lazy,Suspense,useEffect,useState} from 'react';
import {CrazyGamesBridge,type PortalSDK} from '../../lib/platform/crazygames';
import {useGameViewport} from '../../lib/game/viewport';
import {useLocale} from '../../lib/i18n/react';
import {translate} from '../../lib/i18n/core';
import {createCrazyGamesDataSession} from '../../lib/platform/crazygames-data';
import {configureData} from './storage';
import './styles.css';
const Game=lazy(()=>import('../../components/game/Game'));
declare global{interface Window{CrazyGames?:{SDK:PortalSDK}}}
function PortalGame(){
 useGameViewport();useLocale();const [ready,setReady]=useState(false),[error,setError]=useState(''),[warning,setWarning]=useState(''),[open,setOpen]=useState(true),[muted,setMuted]=useState(false),[bridge]=useState(()=>new CrazyGamesBridge(setMuted));
 useEffect(()=>{
  let canceled=false,accountChanged=false,session:ReturnType<typeof createCrazyGamesDataSession>|undefined,sdk:PortalSDK|undefined;
  const changed=()=>{accountChanged=true;bridge.setPlaying(false);setReady(false);setError('Account changed. Reload to load its Data Module save.');};
  const timer=setTimeout(()=>{if(!canceled)setError('SDK initialization is taking too long. Retry; no save has been overwritten.');},15000);
  const script=document.createElement('script');script.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';script.async=true;
  script.onload=()=>{void (async()=>{try{
   sdk=window.CrazyGames?.SDK;if(!await bridge.initialize(sdk)||!sdk?.data)throw Error('Data Module unavailable. Enable SDK Data Module in the developer panel.');
   if(canceled)return;
   session=createCrazyGamesDataSession(sdk.data,sdk.user,changed,setWarning);
   const store=session.store;
   const state=await store.load();if(canceled||accountChanged)return;
   try{if(store.isNew&&localStorage.getItem('ocak-vadisi.save.v1'))setWarning('An older browser farm is retained, not migrated. Export it using the previous build before importing into this separate Data Module farm.');}catch{}
   configureData(store,state);setError('');setReady(true);
  }catch(e){if(!canceled)setError(e instanceof Error?e.message:'Data Module load failed; original retained.');}finally{clearTimeout(timer);}})();};
  script.onerror=()=>{clearTimeout(timer);setError('SDK unavailable. Retry before playing; no cloud save is confirmed.');};document.head.appendChild(script);
  return()=>{canceled=true;clearTimeout(timer);session?.dispose();bridge.dispose();script.remove();};
 },[bridge]);
 if(!ready)return <main className="main-menu-screen"><section className="main-menu-card"><h1>Roamcroft</h1><p role={error?'alert':'status'}>{error||'Loading SDK Data Module…'}</p>{error&&<button onClick={()=>location.reload()}>Retry</button>}</section></main>;
 if(!open)return <main className="main-menu-screen"><section className="main-menu-card"><h1>Roamcroft</h1><button className="primary-button" onClick={()=>location.reload()}>{translate('m_19c9304ab1')}</button></section></main>;
 return <>{warning&&<p role="alert" style={{position:'absolute',top:72,left:8,right:8,pointerEvents:'none',zIndex:100,background:'#493021',color:'white',padding:12}}>{warning}</p>}<Suspense fallback={<p role="status">Loading Roamcroft…</p>}><Game autoStart serverMode={false} platform={{loading:bridge.setLoading,playing:bridge.setPlaying,muted}} onExit={()=>{bridge.setPlaying(false);setOpen(false);}}/></Suspense></>;
}
createRoot(document.getElementById('root')!).render(<PortalGame/>);
