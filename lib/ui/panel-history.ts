'use client';
import {useEffect, useRef} from 'react';
// A close traversal must finish before a freshly opened panel pushes its entry.
// Otherwise a rapid reopen can consume the new entry with the old Back request.
let closing:Promise<void>|null=null;
/** Same-URL history entry: Android/browser Back closes a panel before leaving. */
export function usePanelHistory(open: boolean, close: () => void) {
  const onClose=useRef(close); onClose.current=close;
  useEffect(() => {
    if (!open) return;
    const key='roamcroftPanel';let token:string|undefined,canceled=false;
    const pop=() => {if (token&&history.state?.[key]!==token) onClose.current();};
    void (async()=>{
      if(closing)await closing;
      if(canceled)return;
      token=crypto.randomUUID();history.pushState({...history.state,[key]:token}, '');
      window.addEventListener('popstate',pop);
    })();
    return () => {
      canceled=true;window.removeEventListener('popstate',pop);
      if(token&&history.state?.[key]===token){
        let finish!:()=>void;
        const traversal=new Promise<void>(resolve=>{finish=resolve;});closing=traversal;
        window.addEventListener('popstate',()=>{if(closing===traversal)closing=null;finish();},{once:true});
        history.back();
      }
    };
  }, [open]);
}
