'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, getLocale, initializeLocale, subscribeLocale } from './locale.ts';

/** A locale update re-renders text without remounting the game or its effects. */
export function useLocale() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => DEFAULT_LOCALE);
  useEffect(initializeLocale, []);
  return locale;
}
