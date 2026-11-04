import {createRoot} from 'react-dom/client';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {CrazyGamesBridge,type PortalSDK} from '../../lib/platform/crazygames';
import {createPortalMultiplayer,inviteRoom,initialPortalMultiplayer} from '../../lib/platform/crazygames-multiplayer';
import type {OnlineTransport} from '../../lib/server/client';
import {useGameViewport} from '../../lib/game/viewport';
import {useLocale} from '../../lib/i18n/react';
import {translate} from '../../lib/i18n/core';
import {createCrazyGamesDataSession} from '../../lib/platform/crazygames-data';
import {configureData} from './storage';
import './styles.css';
const Game=lazy(()=>import('../../components/game/Game'));
const backend=(import.meta as ImportMeta&{env:{VITE_CRAZYGAMES_MULTIPLAYER_BACKEND?:string}}).env.VITE_CRAZYGAMES_MULTIPLAYER_BACKEND||'https://roamcroft.com';
declare global{interface Window{CrazyGames?:{SDK:PortalSDK}}}
function PortalGame(){
 useGameViewport();useLocale();
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[warning,setWarning]=useState(''),[open,setOpen]=useState(true),[muted,setMuted]=useState(false),[busy,setBusy]=useState(false),[online,setOnline]=useState<OnlineTransport>(),[exitRequest,setExitRequest]=useState(0),[bridge]=useState(()=>new CrazyGamesBridge(setMuted));
 const sdkRef=useRef<PortalSDK|undefined>(undefined),connection=useRef<ReturnType<typeof createPortalMultiplayer>|undefined>(undefined),pendingInvite=useRef<string|undefined>(undefined),gameOpen=useRef(false);
 gameOpen.current=ready&&open;
 async function launchOnline(code?:string){
  setOpen(false);setBusy(true);setError('');connection.current?.dispose();setOnline(undefined);
  let session:ReturnType<typeof createPortalMultiplayer>|undefined;
  try{
   const sdk=sdkRef.current;if(!sdk)throw Error('SDK unavailable');
   session=createPortalMultiplayer(sdk,backend);connection.current=session;
   await session.prepare(code);if(connection.current!==session)return;setOnline(session.transport);setOpen(true);
  }catch(e){session?.dispose();if(connection.current===session){connection.current=undefined;setError(e instanceof Error?e.message:'Co-op unavailable; single player is preserved.');}}
  finally{if(!connection.current||connection.current===session)setBusy(false);}
 }
 const exited=()=>{
  setExitRequest(0);connection.current?.dispose();connection.current=undefined;setOnline(undefined);setOpen(false);
  const code=pendingInvite.current;pendingInvite.current=undefined;if(code)void launchOnline(code);
 };
 useEffect(()=>{
  let canceled=false,accountChanged=false,session:ReturnType<typeof createCrazyGamesDataSession>|undefined,sdk:PortalSDK|undefined;
  const changed=()=>{accountChanged=true;connection.current?.dispose();bridge.setPlaying(false);setReady(false);setError('Account changed. Reload to load its Data Module save.');};
  const join=(params:Record<string,string>)=>{
   if(canceled||accountChanged)return;
   try{const code=inviteRoom(params);if(gameOpen.current){pendingInvite.current=code;setExitRequest(n=>n+1);}else void launchOnline(code);}catch{setError('Invalid invitation.');}
  };
  const timer=setTimeout(()=>{if(!canceled)setError('SDK initialization is taking too long. Retry; no save has been overwritten.');},15000);
  const script=document.createElement('script');script.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';script.async=true;
  script.onload=()=>{void (async()=>{try{
   sdk=window.CrazyGames?.SDK;if(!await bridge.initialize(sdk)||!sdk?.data)throw Error('Data Module unavailable. Enable SDK Data Module in the developer panel.');
   if(canceled)return;sdkRef.current=sdk;
   session=createCrazyGamesDataSession(sdk.data,sdk.user,changed,setWarning);
   const store=session.store,state=await store.load();if(canceled||accountChanged)return;
   try{if(store.isNew&&localStorage.getItem('ocak-vadisi.save.v1'))setWarning('An older browser farm is retained, not migrated. Export it using the previous build before importing into this separate Data Module farm.');}catch{}
   configureData(store,state);setError('');setReady(true);
   sdk.game.addJoinRoomListener?.(join);
   if(sdk.game.inviteParams?.roomName!==undefined)setOpen(false);
   const entry=initialPortalMultiplayer(sdk.game);if(entry)await launchOnline(entry.code);
  }catch(e){if(!canceled)setError(e instanceof Error?e.message:'Data Module load failed; original retained.');}finally{clearTimeout(timer);}})();};
  script.onerror=()=>{clearTimeout(timer);setError('SDK unavailable. Retry before playing; no cloud save is confirmed.');};document.head.appendChild(script);
  return()=>{canceled=true;clearTimeout(timer);session?.dispose();connection.current?.dispose();try{sdk?.game.removeJoinRoomListener?.(join);}catch{}bridge.dispose();script.remove();};
 },[bridge]);
 if(!ready)return <main className="main-menu-screen"><section className="main-menu-card"><h1>Roamcroft</h1><p role={error?'alert':'status'}>{error||'Loading SDK Data Module…'}</p>{error&&<button onClick={()=>location.reload()}>Retry</button>}</section></main>;
 if(!open)return <main className="main-menu-screen"><section className="main-menu-card"><h1>Roamcroft</h1>{error&&<p role="alert">{error}</p>}{busy?<p role="status">{translate('portal.connecting')}</p>:<><button className="primary-button" onClick={()=>{setError('');setOnline(undefined);setOpen(true);}}>{translate('portal.solo')}</button><button className="secondary-button" onClick={()=>void launchOnline()}>{translate('portal.coop')}</button></>}</section></main>;
 return <>{warning&&!online&&<p role="alert" style={{position:'absolute',top:72,left:8,right:8,pointerEvents:'none',zIndex:100,background:'#493021',color:'white',padding:12}}>{warning}</p>}<Suspense fallback={<p role="status">Loading Roamcroft…</p>}><Game key={online?'online':'solo'} autoStart serverMode={!!online} platform={{loading:bridge.setLoading,playing:bridge.setPlaying,muted,online,exitRequest}} onExit={exited}/></Suspense></>;
}
createRoot(document.getElementById('root')!).render(<PortalGame/>);
