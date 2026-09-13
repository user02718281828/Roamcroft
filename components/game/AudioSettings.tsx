'use client';
import {useState} from 'react';
import {DEFAULT_AUDIO} from '@/lib/game/audio';
import type {ValleyAudio,AudioLevels} from '@/lib/game/audio';
export default function AudioSettings({audio}:{audio:ValleyAudio|null}){
 const [levels,setLevels]=useState(audio?.levels||DEFAULT_AUDIO);
 return <div className="audio-levels">{([['music','Müzik'],['ambience','Doğa ve ortam'],['effects','Aksiyon ve adımlar']] as const).map(([key,label])=><label key={key}><span>{label} · %{Math.round(levels[key]*100)}</span><input aria-label={label+' ses seviyesi'} type="range" min="0" max="1" step="0.05" value={levels[key]} onChange={event=>{const next={...levels,[key]:Number(event.target.value)} as AudioLevels;setLevels(next);audio?.setLevels(next);}}/></label>)}</div>;
}
