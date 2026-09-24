'use client';
import {useState,type ComponentType} from 'react';
import './launcher.css';
import {useGameViewport,enterGameFullscreen} from '@/lib/game/viewport';

export default function Launcher(){
  useGameViewport();
  const [Game,setGame]=useState<ComponentType<{autoStart?:boolean;serverMode?:boolean}>|null>(null),[serverMode,setServerMode]=useState(false);
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const play=async(server=false)=>{
    if(loading)return;
    if(window.matchMedia('(pointer: coarse)').matches)void enterGameFullscreen();
    setLoading(true);setError('');setServerMode(server);
    try{const module=await import('./Game');setGame(()=>module.default);}
    catch{setError('Oyun yüklenemedi. Bağlantını kontrol edip tekrar dene.');setLoading(false);}
  };
  if(Game)return <Game autoStart serverMode={serverMode}/>;
  return <main className="launch-screen">
    <section className="launch-card" aria-label="Roamcroft başlangıç ekranı">
      <img className="launch-art" src="/og-image.jpg" width={1200} height={630} alt="" fetchPriority="high"/>
      <div className="launch-content">
        <h1>Roamcroft</h1>
        <p>Kendi dünyana dön.</p>
        <p className="launch-update"><b>1.8 · Canlanan Vadi</b><br/>Hareketlenen atölyeler, düz köy yolları ve doğaya karışan küçük ayrıntılar.</p>
        <button onClick={()=>void play()} disabled={loading} aria-busy={loading}>{loading?'Vadi hazırlanıyor…':'Oyna'}</button>
        <button className="launch-server" onClick={()=>void play(true)} disabled={loading}>Sunucu dünyası · Önizleme</button>
        {error&&<p role="alert">{error}</p>}
        <p className="launch-help">Oyna: cihazındaki çiftlik, çevrimdışı da çalışır.<br/>Sunucu dünyası: ayrı çiftlik, internet gerektirir. Çerezi silersen erişimini kaybedersin. Her bağlantı oturumu 30 gün uzatır.</p>
        <noscript>Roamcroft’u oynamak için tarayıcında JavaScript’i aç.</noscript>
      </div>
    </section>
  </main>;
}
