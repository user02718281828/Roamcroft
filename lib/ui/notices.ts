import type {Event} from '../game/model.ts';

export type HudNotice = Event & {id:number; count:number; created:number; expires:number};
const lifetime=(notice:Event)=>notice.celebration?3200:notice.kind==='bad'?2400:1800;
const same=(a:Event,b:Event)=>a.text===b.text&&a.kind===b.kind&&a.sound===b.sound;

// Presentation only: one visible entry, two waiting. Repeats never extend its life.
export function advanceNotices(previous:HudNotice[],events:readonly Event[],now:number,nextId:()=>number):HudNotice[]{
  if(!events.length&&(!previous.length||previous[0].expires>now))return previous;
  let queue=previous.filter((notice,index)=>index===0?notice.expires>now:now-notice.created<6000);
  for(const event of events){
    const duplicate=queue.findIndex(notice=>same(notice,event));
    if(duplicate>=0){queue=queue.map((notice,index)=>index===duplicate?{...notice,count:Math.min(99,notice.count+1)}:notice);continue;}
    const notice={...event,id:nextId(),count:1,created:now,expires:0};
    if(!queue.length)queue.push(notice);
    else if(event.kind==='bad')queue.splice(1,0,notice);
    else queue.push(notice);
    queue=queue.slice(0,3);
  }
  if(queue.length&&!queue[0].expires)queue[0]={...queue[0],expires:now+lifetime(queue[0])};
  return queue;
}
