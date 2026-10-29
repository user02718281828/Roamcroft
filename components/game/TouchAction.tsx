'use client';
import {useEffect, useRef, type ReactNode} from 'react';
import {TouchPress} from '@/lib/ui/touch-controls';
/** One release inside = one action. Holding never repeats; cancel never fires. */
export default function TouchAction({disabled, label, shortLabel, className, onAction, children}: {disabled: boolean; label: string; shortLabel?:string; className: string; onAction: () => void; children: ReactNode}) {
  const press = useRef(new TouchPress());
  useEffect(() => {if (disabled) press.current.cancel();}, [disabled]);
  useEffect(() => {
    const cancel = () => press.current.cancel();
    window.addEventListener('blur',cancel); window.addEventListener('resize',cancel); document.addEventListener('visibilitychange',cancel);
    return () => {cancel();window.removeEventListener('blur',cancel);window.removeEventListener('resize',cancel);document.removeEventListener('visibilitychange',cancel);};
  }, []);
  return <button type="button" className={className} disabled={disabled} aria-label={label}
    onPointerDown={e => {e.stopPropagation();if (e.button===0 && !disabled && press.current.begin(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerUp={e => {e.stopPropagation();const b=e.currentTarget.getBoundingClientRect();const fire=press.current.end(e.pointerId,e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom);if (fire&&!disabled) onAction();}}
    onPointerCancel={() => press.current.cancel()} onLostPointerCapture={() => press.current.cancel()}
    onContextMenu={e => e.preventDefault()}
    onClick={e => {e.stopPropagation();if(e.detail===0&&!disabled) onAction();}}>
    {children}<small aria-hidden="true">{shortLabel??label}</small>
  </button>;
}
