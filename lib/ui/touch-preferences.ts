'use client';
import {useEffect, useSyncExternalStore} from 'react';
import {DEFAULT_TOUCH, readTouch, touchPreferences, TOUCH_KEY, type TouchPreferences} from './touch-controls';
let current = DEFAULT_TOUCH;
let initialized=false;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {listeners.add(fn); return () => {listeners.delete(fn);};};
function publish(value: TouchPreferences) {current = value; listeners.forEach(fn => fn());}
export function setTouch(value: TouchPreferences) {
  const next = touchPreferences(value);
  try {window.localStorage.setItem(TOUCH_KEY, JSON.stringify(next));} catch { /* Keep session controls usable. */ }
  publish(next);
}
export function useTouchPreferences() {
  const value = useSyncExternalStore(subscribe, () => current, () => DEFAULT_TOUCH);
  useEffect(() => {
    const read = () => {try {publish(readTouch(window.localStorage));} catch {publish({...DEFAULT_TOUCH});}};
    const storage = (event: StorageEvent) => {if (event.key === TOUCH_KEY || event.key === null) read();};
    if(!initialized){initialized=true;read();} window.addEventListener('storage', storage);
    return () => window.removeEventListener('storage', storage);
  }, []);
  return value;
}
