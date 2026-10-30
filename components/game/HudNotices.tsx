'use client';
import {Check,Info} from 'lucide-react';
import type {HudNotice} from '@/lib/ui/notices';
import {localizeText} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import GameIcon from './GameIcon';

export default function HudNotices({notices,names}:{notices:HudNotice[];names:string[]}){
  const locale=useLocale(),notice=notices[0];
  return <div className="hud-notices" role="status" aria-live="polite" aria-atomic="true">
    {notice&&<div className={`hud-notice ${notice.kind}`} key={notice.id}>
      {notice.sound?<GameIcon id={notice.sound==='harvest'?'wheat':notice.sound==='fish'?'rod':notice.sound}/>:notice.kind==='good'?<Check aria-hidden="true"/>:<Info aria-hidden="true"/>}
      <span>{localizeText(notice.text,locale,0,names)}</span>
      {notice.count>1&&<b>×{notice.count}</b>}
    </div>}
  </div>;
}
