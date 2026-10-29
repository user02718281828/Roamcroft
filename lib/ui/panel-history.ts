'use client';
import {useEffect, useRef} from 'react';
/** Same-URL history entry: Android/browser Back closes a panel before leaving. */
export function usePanelHistory(open: boolean, close: () => void) {
  const onClose=useRef(close); onClose.current=close;
  useEffect(() => {
    if (!open) return;
    const key='roamcroftPanel', token=crypto.randomUUID();
    history.pushState({...history.state,[key]:token}, '');
    const pop=() => {if (history.state?.[key]!==token) onClose.current();};
    window.addEventListener('popstate',pop);
    return () => {
      window.removeEventListener('popstate',pop);
      if(history.state?.[key]===token) history.back();
    };
  }, [open]);
}
