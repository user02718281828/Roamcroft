'use client';
import { translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import {useEffect,useRef} from 'react';
import {JoystickInput} from '@/lib/game/joystick';
import type {StickVector} from '@/lib/game/joystick';

export default function Joystick({disabled,onMove,sensitivity=1}:{disabled:boolean;onMove:(vector:StickVector)=>void;sensitivity?:number}){
  useLocale();
  const input=useRef(new JoystickInput()),knob=useRef<HTMLSpanElement>(null),base=useRef<HTMLDivElement>(null),output=useRef(onMove);
  const radius=useRef(30);
  output.current=onMove;
  const draw=(x:number,y:number)=>{knob.current?.style.setProperty('transform',`translate(${x*radius.current}px,${y*radius.current}px)`);output.current({x,y});};
  const reset=()=>{const id=input.current.pointer;input.current.reset();if(id!==null&&base.current?.hasPointerCapture(id))base.current.releasePointerCapture(id);base.current?.removeAttribute('data-held');draw(0,0);};
  useEffect(()=>{reset();},[disabled,sensitivity]);
  useEffect(()=>{
    const release=()=>reset();
    window.addEventListener('blur',release);window.addEventListener('resize',release);document.addEventListener('visibilitychange',release);
    return()=>{window.removeEventListener('blur',release);window.removeEventListener('resize',release);document.removeEventListener('visibilitychange',release);output.current({x:0,y:0});};
  },[]);
  return <div ref={base} className="joystick" role="group" aria-label={translate("m_98ae69620f")} aria-disabled={disabled} tabIndex={0}
    onPointerDown={event=>{event.preventDefault();event.stopPropagation();if(disabled||event.button!==0)return;const box=event.currentTarget.getBoundingClientRect();radius.current=Math.max(20,box.width/2-35);if(!input.current.begin(event.pointerId,box.x+box.width/2,box.y+box.height/2))return;event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.dataset.held='true';const v=input.current.move(event.pointerId,event.clientX,event.clientY,radius.current/sensitivity);if(v)draw(v.x,v.y);}}
    onPointerMove={event=>{event.stopPropagation();if(disabled)return;const v=input.current.move(event.pointerId,event.clientX,event.clientY,radius.current/sensitivity);if(v){event.preventDefault();draw(v.x,v.y);}}}
    onPointerUp={event=>{if(input.current.end(event.pointerId))reset();}}
    onPointerCancel={event=>{if(input.current.end(event.pointerId))reset();}}
    onLostPointerCapture={event=>{if(input.current.end(event.pointerId))reset();}}
    onKeyDown={event=>{const vectors:Record<string,StickVector>={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};const v=vectors[event.key];if(v&&!disabled){event.preventDefault();event.stopPropagation();draw(v.x,v.y);}}}
    onKeyUp={event=>{if(event.key.startsWith('Arrow')){event.stopPropagation();reset();}}}
    onBlur={reset}>
    <span className="joystick-ring"/><span className="joystick-axis joystick-axis-x"/><span className="joystick-axis joystick-axis-y"/>
    <span ref={knob} className="joystick-knob"><span/></span>
    <span className="joystick-label">{translate("m_199e9beead")}</span>
  </div>;
}
