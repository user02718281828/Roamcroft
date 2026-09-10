'use client';
import {useRef,useState} from 'react';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import GameIcon from './GameIcon';
export default function MainMenu({onContinue,onNew,onLoad,onSettings,onCoop,onSave}:{onContinue:()=>void;onNew:()=>void;onLoad:(f:File)=>void;onSettings:()=>void;onCoop:()=>void;onSave:()=>Promise<void>}) {
  const file=useRef<HTMLInputElement>(null),[confirm,setConfirm]=useState(false),[exited,setExited]=useState(false),[error,setError]=useState('');
  return <div className="main-menu-screen">
    <section className="main-menu-card" aria-label="Roamcroft ana menü">
      <GameIcon id="home" className="main-menu-emblem"/>
      <span className="eyebrow">KEŞFET · YETİŞTİR · YUVA KUR</span>
      <h1>Roamcroft</h1>
      <p>Kendi dünyana dön.</p>
      <button className="primary-button" onClick={onContinue}>Oyuna devam et</button>
      <button className="secondary-button" onClick={()=>setConfirm(true)}>Yeni oyun</button>
      <button className="secondary-button" onClick={()=>file.current?.click()}>Kayıt yükle</button>
      <button className="secondary-button" onClick={onCoop}>Co-op · Birlikte oyna</button>
      <button className="secondary-button" onClick={onSettings}>Ayarlar</button>
      <button className="secondary-button" onClick={()=>void onSave().then(()=>{setExited(true);window.close();}).catch(e=>setError(e instanceof Error?e.message:'Kayıt yapılamadı.'))}>Kaydet ve çık</button>
      <input hidden ref={file} type="file" accept="application/json,.json" onChange={e=>{const selected=e.target.files?.[0];if(selected)onLoad(selected);e.target.value='';}}/>
      {error && <output role="alert">{error}</output>}
      {exited && <output>Oyun duraklatıldı. Sekmeyi kapatabilirsin; kayıt sonucunu Ayarlar bölümünde görebilirsin.</output>}
      <small>Tab: menü · E: etkileşim · Shift: koş · Ctrl: saldırı</small>
    </section>
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Yeni dünyaya başla?</AlertDialogTitle><AlertDialogDescription>Bu tarayıcıdaki tek oyunculu kayıt değişir. Mevcut dünyanı korumak için önce Ayarlar’dan kayıt dosyasını indirebilirsin.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Geri dön</AlertDialogCancel><AlertDialogAction onClick={onNew}>Yeni dünyayı oluştur</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
