'use client';
import {translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import {setTouch, useTouchPreferences} from '@/lib/ui/touch-preferences';
export default function TouchSettings() {
  useLocale(); const value = useTouchPreferences();
  return <section className="touch-settings settings-section">
    <h3>{translate('touch.settings')}</h3><p>{translate('touch.settingsHelp')}</p>
    <fieldset><legend>{translate('touch.hand')}</legend>
      {(['right','left'] as const).map(hand => <button type="button" className="secondary-button" key={hand} aria-pressed={value.hand===hand} onClick={() => setTouch({...value, hand})}>{translate(hand==='right'?'touch.right':'touch.left')}</button>)}
    </fieldset>
    <fieldset><legend>{translate('touch.size')}</legend>
      {(['regular','large'] as const).map(size => <button type="button" className="secondary-button" key={size} aria-pressed={value.size===size} onClick={() => setTouch({...value, size})}>{translate(size==='large'?'touch.large':'touch.regular')}</button>)}
    </fieldset>
    <label>{translate('touch.sensitivity')} · {Math.round(value.sensitivity*100)}%
      <input aria-label={translate('touch.sensitivity')} type="range" min="0.8" max="1.2" step="0.1" value={value.sensitivity} onChange={e => setTouch({...value, sensitivity:Number(e.target.value)})}/>
    </label>
  </section>;
}
