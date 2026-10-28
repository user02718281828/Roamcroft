'use client';
import { useEffect } from 'react';
import { translateFor } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

export default function LanguageMetadata() {
  const locale = useLocale();
  useEffect(() => {
    const description = translateFor(locale, 'meta.description');
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
      document.querySelector(selector)?.setAttribute('content', description);
    }
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', locale === 'tr' ? 'tr_TR' : 'en_US');
    document.querySelector('link[rel="manifest"]')?.setAttribute('href', locale === 'tr' ? '/manifest.tr.json' : '/manifest.json');
  }, [locale]);
  return null;
}
