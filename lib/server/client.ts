import type {Engine,State,Event} from '../game/model.ts';
import type {Command} from '../coop/protocol.ts';
import {applySharedState} from '../coop/authority.ts';
import {validServerCommand} from './protocol.ts';
import {applyDelta,type WorldDelta} from './delta.ts';

type Packet={state?:State;delta?:WorldDelta;nonce:string;seq:number;commandSeq:number;events?:Event[];error?:string};
export class ServerWorldClient {
  connected=false;status='Sunucuya bağlanıyor…';
  private nonce='';private seq=0;private commandSeq=0;private queue:Command[]=[];
  private timer:ReturnType<typeof setTimeout>|undefined;private stopped=false;
  private pending:{body:string;nonce:string}|null=null;private flight:Promise<void>|null=null;
  private lastPaused=false;
  private state:State|null=null;
  private engine:()=>Engine|null;private paused:()=>boolean;private changed:()=>void;
  constructor(engine:()=>Engine|null,paused:()=>boolean,changed:()=>void){this.engine=engine;this.paused=paused;this.changed=changed;}
  private accept(packet:Packet){
    if(packet.state)this.state=packet.state;
    else if(packet.delta&&this.state)this.state=applyDelta(this.state,packet.delta,this.seq);
    else throw Object.assign(Error('Dünya verisi eksik.'),{status:409});
    return structuredClone(this.state);
  }
  private async request(body:string,nonce=''){
    const response=await fetch('/api/world',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...(nonce?{'X-Roamcroft-Nonce':nonce}:{})},body,signal:AbortSignal.timeout(12000)});
    const packet=await response.json() as Packet;
    if(!response.ok)throw Object.assign(Error(packet.error||'Sunucu yanıt vermedi.'),{status:response.status});
    return packet;
  }
  async start(){
    const packet=await this.request(JSON.stringify({op:'session'}));
    this.nonce=packet.nonce;this.seq=packet.seq;this.commandSeq=packet.commandSeq;this.connected=true;this.status='Sunucu dünyası · kaydedildi';
    this.schedule();return this.accept(packet);
  }
  bind(engine:Engine){engine.network={guest:true,server:true,peers:[],send:(method,args)=>this.send(method,args)};}
  send(method:string,args:unknown[]){
    const command={seq:this.commandSeq+1,method,args};
    if(!this.connected||this.queue.length>=16||!validServerCommand(command)){this.engine()?.emit('Bu işlem şu anda sunucuya gönderilemiyor.','bad');return false;}
    this.commandSeq++;this.queue.push(command);return true;
  }
  private schedule(){if(!this.stopped)this.timer=setTimeout(()=>{this.flight=this.pulse().finally(()=>{this.flight=null;this.schedule();});},this.connected?500:2000);}
  private async pulse(){
    const engine=this.engine();if(!engine||this.stopped)return;
    if(this.connected&&this.paused()&&this.lastPaused&&!this.pending&&!this.queue.length)return;
    if(!this.pending){const p=engine.s.player;this.pending={nonce:this.nonce,body:JSON.stringify({op:'pulse',pulse:{seq:this.seq+1,paused:this.paused(),pose:{x:p.x,z:p.z,facing:p.facing,sprinting:engine.sprinting},commands:this.queue.slice(0,8)}})};}
    try{
      const packet=await this.request(this.pending.body,this.pending.nonce);if(this.stopped)return;
      const state=this.accept(packet),current=this.engine();if(current){applySharedState(current,state,{id:'self',name:'Gezgin',player:state.player});for(const event of packet.events||[])current.events.push(event);}
      this.lastPaused=JSON.parse(this.pending.body).pulse.paused;
      this.seq=packet.seq;this.nonce=packet.nonce;this.queue=this.queue.filter(c=>c.seq>packet.commandSeq);this.pending=null;
      this.connected=true;this.status='Sunucu dünyası · kaydedildi';
    }catch(error){
      this.connected=false;this.status=error instanceof Error?error.message:'Bağlantı bekleniyor.';
      if([403,409].includes((error as {status:number}).status)){
        try{const packet=await this.request(JSON.stringify({op:'session'}));if(this.stopped)return;
          this.seq=packet.seq;this.nonce=packet.nonce;this.commandSeq=packet.commandSeq;this.queue=[];this.pending=null;
          const state=this.accept(packet),current=this.engine();if(current){applySharedState(current,state);current.emit('Dünya sunucuyla eşitlendi. Son işlemini kontrol et.','info');}
          this.connected=true;this.status='Sunucu dünyası · kaydedildi';
        }catch{}
      }
    }
    this.changed();
  }
  async flush(){
    await this.flight;if(this.timer)clearTimeout(this.timer);
    do{await this.pulse();}while(this.connected&&(this.queue.length>0||this.pending));
    this.schedule();if(!this.connected)throw Error(this.status);
  }
  dispose(){this.stopped=true;if(this.timer)clearTimeout(this.timer);}
}
