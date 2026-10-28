'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import type { Engine } from '@/lib/game/model';
import { sleepBlockReason } from '@/lib/game/rest';

export default function SharedSleep({engine}:{engine:Engine}) {
  useLocale();
  if(!engine.network?.shared)return null;
  const status=engine.network.sleep,blocked=sleepBlockReason(engine.s);
  return <section className="friend-lobby" aria-label={translate("m_e148cd26c3")}>
    <h3>{translate("m_6e37f09b64")}</h3>
    <p>{translate("m_40cf93279c")}</p>
    {status&&<p role="status">{translate("m_daefd0b42c")}{status.ready.length ? status.ready.join(', ') : translate("m_80754f3ebd")} {translate("m_070837f51e")}{status.waiting.length ? status.waiting.join(', ') : translate("m_513298f20e")}</p>}
    <button className="primary-button" disabled={!!blocked||!!status?.voted} onClick={()=>engine.sleep()}>{localize(status?.voted?sourceText("m_36145d3adc"):sourceText("m_2589171b35"))}</button>
    {status&&<button className="secondary-button" onClick={()=>engine.cancelSleep()}>{translate("m_2a46a55430")}</button>}
    <p>{localize(blocked||sourceText("m_3e5015cea3"))}</p>
  </section>;
}
