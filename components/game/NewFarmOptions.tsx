'use client';
import type {StartProfile} from '@/lib/game/new-farm';
import {translate} from '@/lib/i18n/core';

export default function NewFarmOptions({value,onChange,disabled}: {
  value:StartProfile;onChange:(profile:StartProfile)=>void;disabled:boolean;
}) {
  return <fieldset className="new-farm-options" disabled={disabled}>
    <legend>{translate('start.title')}</legend>
    {(['standard','lean'] as const).map(profile=><label key={profile}>
      <input type="radio" name="new-farm-profile" value={profile} checked={value===profile} onChange={()=>onChange(profile)}/>
      <span><strong>{translate(profile==='standard'?'start.standard':'start.lean')}</strong>
        <small>{translate(profile==='standard'?'start.standardHelp':'start.leanHelp')}</small></span>
    </label>)}
    <p>{translate('start.scope')}</p>
  </fieldset>;
}
