export type InstallEvent=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
let prompt:InstallEvent|null=null,started=false,waiting:ServiceWorker|null=null;
export const installPrompt=()=>prompt;
export const pendingUpdate=()=>waiting;
// Oyun açıldıktan sonra önbellekle; ilk ekranda tüm motoru indirme.
export function preparePwa(){
  if(started)return;started=true;
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event as InstallEvent;window.dispatchEvent(new Event('roamcroft-install'));});
  window.addEventListener('appinstalled',()=>{prompt=null;window.dispatchEvent(new Event('roamcroft-install'));});
  if('serviceWorker' in navigator)void navigator.serviceWorker.register('/sw.js').then(registration=>{
    const changed=()=>{waiting=registration.waiting;window.dispatchEvent(new Event('roamcroft-install'));};
    changed();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',changed));
  }).catch(()=>{});
}
