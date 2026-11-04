'use client';
import {useState} from 'react';
import {translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import {readPresentation,storePresentation} from '@/lib/ui/presentation-preferences';
import LanguageSettings from './LanguageSettings';
import AudioSettings from './AudioSettings';
import TouchSettings from './TouchSettings';
import {GuidanceSetting} from './FirstSteps';

export default function LauncherSettings({onClose}:{onClose:()=>void}){
 useLocale();const [value,setValue]=useState(readPresentation);
 const change=(next:Partial<typeof value>)=>{storePresentation(next);setValue(v=>({...v,...next}));};
 return <section className="launch-card launch-settings" aria-label={translate('m_80ad54ad05')}>
  <h1>{translate('m_80ad54ad05')}</h1><LanguageSettings/><TouchSettings/><GuidanceSetting/>
  <a href="/how-to-play">{translate('steps.title')}</a>
  <label><input type="checkbox" checked={value.quality} onChange={e=>change({quality:e.target.checked})}/>{translate('m_ee2de2a139')}</label>
  <h2>{translate('m_9ab936ba64')}</h2><AudioSettings audio={null}/>
  <label><input type="checkbox" checked={value.sound} onChange={e=>change({sound:e.target.checked})}/>{translate('m_9ab936ba64')}</label>
  <button type="button" onClick={onClose}>{translate('ui.close')}</button>
 </section>;
}
