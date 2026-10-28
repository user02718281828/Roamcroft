'use client';
import { GAME_VERSION } from '@/lib/version';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import {useState,type ComponentType} from 'react';
import './launcher.css';
import {useGameViewport,enterGameFullscreen} from '@/lib/game/viewport';
import LanguageSettings from './LanguageSettings';
import LanguageMetadata from './LanguageMetadata';
import LaunchArtwork from './LaunchArtwork';

export default function Launcher(){
  useLocale();
  useGameViewport();
  const [Game,setGame]=useState<ComponentType<{autoStart?:boolean;serverMode?:boolean;onExit?:()=>void}>|null>(null),[serverMode,setServerMode]=useState(false);
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const play=async(server=false)=>{
    if(loading)return;
    if(window.matchMedia('(pointer: coarse)').matches)void enterGameFullscreen();
    setLoading(true);setError('');setServerMode(server);
    try{const module=await import('./Game');setGame(()=>module.default);}
    catch{setError(sourceText("m_23db1c0734"));setLoading(false);}
  };
  if(Game)return <><LanguageMetadata/><Game autoStart serverMode={serverMode} onExit={()=>{setGame(null);setLoading(false);setError('');}}/></>;
  return <main className="launch-screen"><LanguageMetadata/>
    <section className="launch-card" aria-label={translate("m_77b3894fa1")}>
      <LaunchArtwork />
      <div className="launch-content">
        <h1>Roamcroft</h1>
        <LanguageSettings />
        <p>{translate("m_f136549175")}</p>
        <p className="launch-update"><b>{translate('release.title', {version: GAME_VERSION})}</b><br/>{translate('release.description')}</p>
        <button onClick={()=>void play()} disabled={loading} aria-busy={loading}>{localize(loading?sourceText("m_cf4aea5756"):sourceText("m_18bb868678"))}</button>
        <button className="launch-server" onClick={()=>void play(true)} disabled={loading}>{translate("m_4b3434427a")}</button>
        {localize(error&&<p role="alert">{localize(error)}</p>)}
        <p className="launch-help">{translate("m_9aa28e66ae")}<br/>{translate("m_c3d8677045")}</p>
        <noscript>{translate("m_de3750e998")}</noscript>
      </div>
    </section>
  </main>;
}
