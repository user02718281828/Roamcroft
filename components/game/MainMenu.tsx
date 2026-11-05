'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import {useRef,useState} from 'react';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';
import PwaControls from './PwaControls';
import GameIcon from './GameIcon';
import NewFarmOptions from './NewFarmOptions';
import type {StartProfile} from '@/lib/game/new-farm';
export default function MainMenu({onContinue,onNew,onLoad,onSettings,onGuide,onSave,onExit,loadError,serverMode=false,initialConfirm=false,allowProfiles=false,onPromptHandled}:{onContinue:()=>void;onNew:(profile:StartProfile)=>Promise<void>;onLoad:(f:File)=>void;onSettings:()=>void;onGuide:()=>void;onSave:()=>Promise<void>;onExit:()=>Promise<void>;loadError?:string;serverMode?:boolean;initialConfirm?:boolean;allowProfiles?:boolean;onPromptHandled?:()=>void}) {
  useLocale();
  const file=useRef<HTMLInputElement>(null),pending=useRef(false),[confirm,setConfirm]=useState(initialConfirm),[exiting,setExiting]=useState(false),[error,setError]=useState('');
  const creating=useRef(false),[saving,setSaving]=useState(false),[profile,setProfile]=useState<StartProfile>('standard');
  const start=async()=>{
    if(creating.current)return;
    creating.current=true;setSaving(true);setError('');
    try {await onNew(allowProfiles?profile:'standard');onPromptHandled?.();setConfirm(false);}
    catch(error){setError(error instanceof Error?error.message:sourceText('start.saveFailed'));}
    finally {creating.current=false;setSaving(false);}
  };
  return <div className="main-menu-screen">
    <section className="main-menu-card" aria-label={translate("m_d05f43f2d9")}>
      <GameIcon id="home" className="main-menu-emblem"/>
      <span className="eyebrow">{translate("m_2b04167dc2")}</span>
      <h1>Roamcroft</h1>
      <p>{localize(serverMode?sourceText("m_e049160942"):sourceText("m_f136549175"))}</p>
      <fieldset disabled={exiting||saving} style={{border:0,padding:0,margin:0,display:'contents'}}>
      <button className="primary-button" onClick={onContinue}>{translate("m_19c9304ab1")}</button>
      {!serverMode&&<><button className="secondary-button" onClick={()=>{setProfile('standard');setError('');setConfirm(true);}}>{translate("m_0a89501c7e")}</button>
      <button className="secondary-button" onClick={()=>file.current?.click()}>{translate("m_d36619c63d")}</button></>}
      <button className="secondary-button" onClick={onSettings}>{translate("m_80ad54ad05")}</button>
      <button className="secondary-button" onClick={onGuide}>{translate("m_155785fc19")}</button>
      <button className="secondary-button" aria-busy={exiting} onClick={()=>{if(pending.current)return;pending.current=true;setExiting(true);setError('');void onExit().catch(e=>{setError(e instanceof Error?e.message:sourceText("m_d4625b7fa3"));pending.current=false;setExiting(false);});}}>{localize(exiting?sourceText('save.pending'):sourceText("m_36fb7a84d3"))}</button>
      <input hidden ref={file} type="file" accept="application/json,.json" onChange={e=>{const selected=e.target.files?.[0];if(selected)onLoad(selected);e.target.value='';}}/>
      {localize(error && <output role="alert">{localize(error)}</output>)}
      {localize(loadError && <output role="alert" className="load-error">{localize(loadError)}</output>)}
      <p>{translate("m_c49d47d763")}{localize(serverMode?sourceText("m_e8fd874837"):'')}</p>
      <PwaControls onSave={onSave}/>
      </fieldset>
      <small>{translate("m_b34867b8cb")}</small>
    </section>
    <AlertDialog open={confirm} onOpenChange={open=>{if(creating.current)return;setConfirm(open);if(!open)onPromptHandled?.();}}>
      <AlertDialogContent className="game-confirm new-farm-confirm" aria-busy={saving}>
        <AlertDialogHeader><AlertDialogTitle>{translate("m_1d747cd58e")}</AlertDialogTitle><AlertDialogDescription>{translate("m_31dd986672")}</AlertDialogDescription></AlertDialogHeader>
        {allowProfiles&&<NewFarmOptions value={profile} onChange={setProfile} disabled={saving}/>}
        {error&&<output role="alert">{localize(error)}</output>}
        <AlertDialogFooter><AlertDialogCancel disabled={saving}>{translate("m_b7e193af95")}</AlertDialogCancel>
          <button type="button" className="primary-button" disabled={saving} onClick={()=>void start()}>{translate(saving?'start.saving':'m_f3af401917')}</button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
