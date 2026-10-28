'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import {useState} from 'react';
import {DEFAULT_AUDIO} from '@/lib/game/audio';
import type {ValleyAudio,AudioLevels} from '@/lib/game/audio';
export default function AudioSettings({audio}:{audio:ValleyAudio|null}){
  useLocale();
 const [levels,setLevels]=useState(audio?.levels||DEFAULT_AUDIO);
 return <div className="audio-levels">{([['music',sourceText("m_fd3b91f48b")],['ambience',sourceText("m_fb6ee4b998")],['effects',sourceText("m_f431f8bb90")]] as const).map(([key,label])=><label key={key}><span>{localize(label)} · %{Math.round(levels[key]*100)}</span><input aria-label={localize(sourceText("m_d3cecd084b", { p0: label }))} type="range" min="0" max="1" step="0.05" value={levels[key]} onChange={event=>{const next={...levels,[key]:Number(event.target.value)} as AudioLevels;setLevels(next);audio?.setLevels(next);}}/></label>)}</div>;
}
