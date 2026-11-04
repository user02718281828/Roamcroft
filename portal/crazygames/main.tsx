import {createRoot} from 'react-dom/client';
import {lazy,Suspense,useEffect,useState} from 'react';
import {CrazyGamesBridge,type PortalSDK} from '../../lib/platform/crazygames';
import {useGameViewport} from '../../lib/game/viewport';
import {useLocale} from '../../lib/i18n/react';
import {translate} from '../../lib/i18n/core';
import './styles.css';
const Game=lazy(()=>import('../../components/game/Game'));
declare global{interface Window{CrazyGames?:{SDK:PortalSDK}}}
function PortalGame(){
 useGameViewport();useLocale();const [open,setOpen]=useState(true),[muted,setMuted]=useState(false),[bridge]=useState(()=>new CrazyGamesBridge(setMuted));
 useEffect(()=>{
  const script=document.createElement('script');script.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';script.async=true;
  script.onload=()=>{void bridge.initialize(window.CrazyGames?.SDK);};script.onerror=()=>{};document.head.appendChild(script);
  return()=>{bridge.dispose();script.remove();};
 },[bridge]);
 if(!open)return <main className="main-menu-screen"><section className="main-menu-card"><h1>Roamcroft</h1><button className="primary-button" onClick={()=>setOpen(true)}>{translate('m_19c9304ab1')}</button></section></main>;
 return <Suspense fallback={<p role="status">Loading Roamcroft…</p>}><Game autoStart serverMode={false} platform={{loading:bridge.setLoading,playing:bridge.setPlaying,muted}} onExit={()=>{bridge.setPlaying(false);setOpen(false);}}/></Suspense>;
}
createRoot(document.getElementById('root')!).render(<PortalGame/>);
