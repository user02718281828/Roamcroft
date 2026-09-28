'use client';
import {useRef,useState} from 'react';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import PwaControls from './PwaControls';
import GameIcon from './GameIcon';
export default function MainMenu({onContinue,onNew,onLoad,onSettings,onGuide,onSave,onExit,loadError,serverMode=false}:{onContinue:()=>void;onNew:()=>void;onLoad:(f:File)=>void;onSettings:()=>void;onGuide:()=>void;onSave:()=>Promise<void>;onExit:()=>Promise<void>;loadError?:string;serverMode?:boolean}) {
  const file=useRef<HTMLInputElement>(null),pending=useRef(false),[confirm,setConfirm]=useState(false),[exiting,setExiting]=useState(false),[error,setError]=useState('');
  return <div className="main-menu-screen">
    <section className="main-menu-card" aria-label="Roamcroft ana menü">
      <GameIcon id="home" className="main-menu-emblem"/>
      <span className="eyebrow">KEŞFET · YETİŞTİR · YUVA KUR</span>
      <h1>Roamcroft</h1>
      <p>{serverMode?'Sunucudaki çiftliğin.':'Kendi dünyana dön.'}</p>
      <fieldset disabled={exiting} style={{border:0,padding:0,margin:0,display:'contents'}}>
      <button className="primary-button" onClick={onContinue}>Oyuna devam et</button>
      {!serverMode&&<><button className="secondary-button" onClick={()=>setConfirm(true)}>Yeni oyun</button>
      <button className="secondary-button" onClick={()=>file.current?.click()}>Kayıt yükle</button></>}
      <button className="secondary-button" onClick={onSettings}>Ayarlar</button>
      <button className="secondary-button" onClick={onGuide}>Nasıl oynanır?</button>
      <button className="secondary-button" aria-busy={exiting} onClick={()=>{if(pending.current)return;pending.current=true;setExiting(true);setError('');void onExit().catch(e=>{setError(e instanceof Error?e.message:'Kayıt yapılamadı.');pending.current=false;setExiting(false);});}}>{exiting?'Kaydediliyor…':'Kaydet ve başlangıca dön'}</button>
      <input hidden ref={file} type="file" accept="application/json,.json" onChange={e=>{const selected=e.target.files?.[0];if(selected)onLoad(selected);e.target.value='';}}/>
      {error && <output role="alert">{error}</output>}
      {loadError && <output role="alert" className="load-error">{loadError}</output>}
      <p>Başlangıca dönünce oyun kapanır; kaydından tekrar devam edebilirsin.{serverMode?' Ev sahibi ayrılırsa ortak oturum kapanır.':''}</p>
      <PwaControls onSave={onSave}/>
      </fieldset>
      <small>Tab: menü · E: etkileşim · Shift: koş · Ctrl: saldırı</small>
    </section>
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Yeni dünyaya başla?</AlertDialogTitle><AlertDialogDescription>Bu tarayıcıdaki tek oyunculu kayıt değişir. Mevcut dünyanı korumak için önce Ayarlar’dan kayıt dosyasını indirebilirsin.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Geri dön</AlertDialogCancel><AlertDialogAction onClick={onNew}>Yeni dünyayı oluştur</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
