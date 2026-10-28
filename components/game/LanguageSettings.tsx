'use client';
import { translate } from '@/lib/i18n/core';
import { setLocale, isLocale } from '@/lib/i18n/locale';
import { useLocale } from '@/lib/i18n/react';

export default function LanguageSettings() {
  const locale = useLocale();
  return <label className="quality-setting">
    <span>{translate('settings.language')}</span>
    <select aria-label={translate('settings.language')} value={locale} onChange={event => {
      if (isLocale(event.target.value)) setLocale(event.target.value);
    }}>
      <option value="tr" lang="tr">Türkçe</option>
      <option value="en" lang="en">English</option>
    </select>
  </label>;
}
