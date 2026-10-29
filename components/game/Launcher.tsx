'use client';
import {GAME_VERSION} from '@/lib/version';
import {sourceText} from '@/lib/i18n/source';
import {localize,translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import {useEffect,useState,type ComponentType} from 'react';
import {deviceSaveHint,type DeviceSaveHint} from '@/lib/ui/device-save-hint';
import './launcher.css';
import {useGameViewport,enterGameFullscreen} from '@/lib/game/viewport';
import LanguageSettings from './LanguageSettings';
import LanguageMetadata from './LanguageMetadata';
import LaunchArtwork from './LaunchArtwork';
type Entry='play'|'new'|'menu'|'settings';
type GameProps={autoStart?:boolean;serverMode?:boolean;entry?:Entry;onExit?:()=>void};
export default function Launcher(){
  const locale=useLocale();useGameViewport();
  const [Game,setGame]=useState<ComponentType<GameProps>|null>(null),[serverMode,setServerMode]=useState(false),[entry,setEntry]=useState<Entry>('play');
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[saveHint,setSaveHint]=useState<DeviceSaveHint>('unknown');
  useEffect(()=>{
    let canceled=false;
    if(Game)return;
    let storage:Storage|undefined;try{storage=window.localStorage;}catch{}
    void deviceSaveHint(storage,window.indexedDB).then(value=>{if(!canceled)setSaveHint(value);});
    return()=>{canceled=true;};
  },[Game]);
  const play=async(server=false,next:Entry='play')=>{
    if(loading)return;
    if(window.matchMedia('(pointer: coarse)').matches)void enterGameFullscreen();
    setLoading(true);setError('');setServerMode(server);setEntry(next);
    try{const module=await import('./Game');setGame(()=>module.default);}
    catch{setError(sourceText('m_23db1c0734'));setLoading(false);}
  };
  if(Game)return <><LanguageMetadata/><Game autoStart={entry==='play'} entry={entry} serverMode={serverMode} onExit={()=>{setGame(null);setLoading(false);setError('');}}/></>;
  return <main className="launch-screen"><LanguageMetadata/>
    <section className="launch-card" aria-label={translate('m_77b3894fa1')}>
      <div className="launch-world">
        <h1><LaunchArtwork/></h1>
        <img className="launch-landscape" src="/brand/camp-valley.svg" width={700} height={270} alt="" aria-hidden="true"/>
        <div className="launch-story"><h2>{translate('launch.about')}</h2><p>{translate('launch.features')}</p>
          <a className="launch-guide" href={locale==='tr'?'/how-to-play#turkce':'/how-to-play#english'}>{translate('launch.guide')} →</a>
        </div>
      </div>
      <div className="launch-content">
        <div className="launch-heading"><span className="eyebrow">{translate('launch.chapter')}</span><small>v{GAME_VERSION}</small></div>
        <p className="launch-device">{translate(saveHint==='present'?'launch.saved':'launch.device')}</p>
        <div className="launch-actions">
          <button className="launch-primary" onClick={()=>void play()} disabled={loading} aria-busy={loading}>
            {loading?translate('m_cf4aea5756'):translate(saveHint==='present'?'m_19c9304ab1':saveHint==='empty'?'launch.start':'launch.open')}
          </button>
          <button className="launch-server" onClick={()=>void play(true)} disabled={loading}>{translate('m_4b3434427a')}</button>
          <button onClick={()=>void play(false,'new')} disabled={loading}>{translate('m_0a89501c7e')}</button>
          <div className="launch-utilities"><button onClick={()=>void play(false,'settings')} disabled={loading}>{translate('m_80ad54ad05')}</button>
            <button onClick={()=>void play(false,'menu')} disabled={loading}>{translate('launch.saves')}</button></div>
        </div>
        {error&&<p role="alert">{localize(error)}</p>}
        <LanguageSettings/>
        <details className="launch-notes"><summary>{translate('launch.farmHelp')}</summary>
          <p>{translate('m_9aa28e66ae')}</p><p>{translate('m_c3d8677045')}</p>
          <p>{translate('launch.origin')}</p><a href={locale==='tr'?'/how-to-play#turkce':'/how-to-play#english'}>{translate('launch.guide')}</a>
        </details>
        <noscript>{translate('m_de3750e998')}</noscript>
      </div>
    </section>
  </main>;
}
