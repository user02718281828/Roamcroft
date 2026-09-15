import {useEffect} from 'react';

export const MOBILE_QUERY='(pointer: coarse), (max-width: 600px), (max-height: 500px) and (max-width: 1100px)';
export function viewportBounds(width:number,height:number,visual?:{width:number;height:number;offsetTop:number;scale:number}){
  const useVisual=visual&&Math.abs(visual.scale-1)<.01;
  return {width:Math.max(1,Math.round(useVisual?Math.min(width,visual.width):width)),height:Math.max(1,Math.round(useVisual?Math.min(height,visual.height):height)),top:useVisual?Math.max(0,Math.round(visual.offsetTop)):0};
}
export function useGameViewport(){
  useEffect(()=>{
    let frame=0,settle=0,previous='';
    const update=()=>{
      frame=0;const size=viewportBounds(window.innerWidth,window.innerHeight,window.visualViewport||undefined),key=JSON.stringify(size);
      if(key===previous)return;previous=key;
      const style=document.documentElement.style;
      style.setProperty('--app-height',size.height+'px');style.setProperty('--app-width',size.width+'px');style.setProperty('--app-top',size.top+'px');
    };
    const queue=()=>{if(!frame)frame=requestAnimationFrame(update);};
    // Bazı telefonlar yön değişikliğinde yeni yüksekliği bir sonraki yerleşimde bildirir.
    const rotate=()=>{queue();clearTimeout(settle);settle=window.setTimeout(queue,250);};
    update();window.addEventListener('resize',queue);window.addEventListener('orientationchange',rotate);window.addEventListener('pageshow',rotate);
    document.addEventListener('fullscreenchange',rotate);window.visualViewport?.addEventListener('resize',queue);window.visualViewport?.addEventListener('scroll',queue);
    return()=>{cancelAnimationFrame(frame);clearTimeout(settle);window.removeEventListener('resize',queue);window.removeEventListener('orientationchange',rotate);window.removeEventListener('pageshow',rotate);document.removeEventListener('fullscreenchange',rotate);window.visualViewport?.removeEventListener('resize',queue);window.visualViewport?.removeEventListener('scroll',queue);};
  },[]);
}
export async function enterGameFullscreen(){
  if(document.fullscreenElement)return true;
  if(!document.documentElement.requestFullscreen)return window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
  try{
    await document.documentElement.requestFullscreen({navigationUI:'hide'});
    try{await (screen.orientation as ScreenOrientation&{lock?:(orientation:string)=>Promise<void>}).lock?.('landscape');}catch{}
    return true;
  }catch{return false;}
}
