import { sourceText } from '../i18n/source.ts';
import type {Engine,State} from '../game/model';
import type {Command,Peer,RoomSession,RoomInfo} from './protocol';
import {validCommand} from './protocol';
import {CoopAuthority,applySharedState} from './authority';
import type {WorldPacket} from './codec';
type Pulse={acceptedSeq?:number;members?:{id:string;name:string;pose:string}[];commands?:{id:number;member:string;payload:string}[];online?:boolean;revision?:number;snapshot?:string|null};
export class CoopClient {
  session:RoomSession|null=null;
  status=sourceText("m_e4085fe56e");
  connected=false;
  peers:Peer[]=[];
  queue:Command[]=[];
  authority=new CoopAuthority();
  previous:State|null=null;
  private worker:Worker|null=null;
  private pending=new Map<number,{resolve:(value:unknown)=>void;reject:(e:Error)=>void}>();
  private requestId=0;
  private commandId=0;
  private timer:ReturnType<typeof setTimeout>|null=null;
  private publishAt=0;
  private publishing:Promise<void>|null=null;
  private pulseAt=0;
  private lastMessage=0;
  private stopped=false;
  private inFlight:Promise<void>|null=null;
  constructor(private engine:()=>Engine|null,private switchWorld:(s:State)=>void,private changed:()=>void) {}
  get active(){return !!this.session;}
  async api<T>(body:Record<string,unknown>,session=this.session):Promise<T> {
    const response=await fetch('/api/coop',{method:'POST',headers:{'Content-Type':'application/json','X-Roamcroft':'1',...(session ? {Authorization:`Bearer ${session.token}`} : {})},body:JSON.stringify({...body,...(session ? {member:session.member} : {})}),signal:AbortSignal.timeout(12000)});
    const result=await response.json() as T & {error?:string;revision?:number};if(!response.ok) throw Object.assign(Error(result.error || sourceText("m_90c2b97993")),{revision:result.revision});return result;
  }
  list(){return this.api<{rooms:RoomInfo[]}>({op:'list'},null);}
  private codec<T>(op:'encode'|'decode',data:Record<string,unknown>):Promise<T> {
    if(!this.worker) {
      this.worker=new Worker(new URL('./codec.worker.ts',import.meta.url),{type:'module'});
      this.worker.onmessage=e=>{const request=this.pending.get(e.data.id);if(!request)return;this.pending.delete(e.data.id);if(e.data.error)request.reject(Error(e.data.error));else request.resolve(e.data.value);};
      this.worker.onerror=()=>{for(const p of this.pending.values())p.reject(Error(sourceText("m_eaf8816291")));this.pending.clear();};
    }
    const id=++this.requestId;
    return new Promise<T>((resolve,reject)=>{this.pending.set(id,{resolve:v=>resolve(v as T),reject});this.worker!.postMessage({id,op,...data});});
  }
  async start(op:'create'|'join'|'resume',name:string,room='') {
    if(this.active) throw Error(sourceText("m_6aface72b7"));
    const e=this.engine();if(!e)throw Error(sourceText("m_872e156b50"));
    const response=await this.api<RoomSession & {snapshot?:string;ack?:number}>({op,name,room,worldName:e.s.settlement.name},null);
    let decoded:WorldPacket|undefined;
    try {if(response.snapshot) decoded=await this.codec<WorldPacket>('decode',{encoded:response.snapshot});}
    catch(error){await this.api({op:'leave'},response).catch(()=>{});throw error;}
    this.previous=structuredClone(e.s);
    this.session=response;this.connected=true;this.stopped=false;this.commandId=0;this.queue=[];
    this.authority=new CoopAuthority();this.authority.ack=response.ack || 0;
    if(decoded) {
      this.peers=decoded.peers;
      if(response.role==='guest') {
        const spot=e.nearbyFree(decoded.state.player.x,decoded.state.player.z);
        if(spot)Object.assign(decoded.state.player,spot);
      }
      this.switchWorld(decoded.state);
    }
    this.bind(e);
    this.status=response.role==='host' ? sourceText("m_dfdceb2b49") : sourceText("m_afcded2e4c");
    this.publishAt=0;this.pulseAt=performance.now();this.changed();this.schedule(100);
  }
  bind(e:Engine) {
    if(!this.session){e.network=null;return;}
    e.network={guest:this.session.role==='guest',send:(method,args)=>this.send(method,args),peers:this.peers.filter(p=>p.id!==this.session?.member)};
  }
  send(method:string,args:unknown[]) {
    if(!this.connected || this.queue.length>=16) {this.engine()?.emit(sourceText("m_5595228da2"),'bad');return false;}
    const command={seq:++this.commandId,method,args};
    if(!validCommand(command)) {this.engine()?.emit(sourceText("m_c6c2ba0dde"),'info');return false;}
    this.queue.push(command);return true;
  }
  private schedule(delay:number){if(!this.stopped)this.timer=setTimeout(()=>{this.inFlight=this.pulse().finally(()=>{this.inFlight=null;});},delay);}
  private async pulse() {
    const session=this.session,e=this.engine();if(!session || !e || this.stopped)return;
    const started=performance.now(),outgoing=this.queue.slice(0,8);
    try {
      this.bind(e);
      const result=await this.api<Pulse>({op:'pulse',pose:{x:e.s.player.x,z:e.s.player.z,facing:e.s.player.facing,sprinting:e.sprinting},commands:outgoing,revision:session.revision});
      if(this.stopped || this.session!==session)return;
      if(session.role==='host')this.queue.splice(0,outgoing.length);
      else this.queue=this.queue.filter(c=>c.seq>(result.acceptedSeq||0));
      if(session.role==='host') {
        if(!result.members || !result.commands)throw Error(sourceText("m_02aa069bcd"));
        this.authority.update(e,session.member,result.members,result.commands,Math.min(.75,(started-this.pulseAt)/1000));
        this.peers=[...this.authority.peers.values()];
        if(started-this.publishAt>=650) {
          await this.publish();this.publishAt=started;
        }
        this.status=sourceText("m_576aa7c7f7", { p0: this.peers.length });
      } else {
        if(!result.online)throw Error(sourceText("m_ecfbc9b9ae"));
        if(result.snapshot && result.revision!==session.revision) {
          const packet=await this.codec<WorldPacket>('decode',{encoded:result.snapshot});
          if(this.stopped || this.session!==session)return;
          this.peers=packet.peers;
          const own=packet.peers.find(p=>p.id===session.member);
          applySharedState(e,packet.state,own);
          session.revision=result.revision!;
          if(own?.messageId && own.messageId!==this.lastMessage){this.lastMessage=own.messageId;e.emit(own.message || sourceText("m_e4cccb4431"),'info');}
        }
        this.status=sourceText("m_576aa7c7f7", { p0: this.peers.length });
      }
      this.connected=true;this.pulseAt=started;this.bind(e);
    } catch(error) {this.connected=false;this.status=error instanceof Error ? error.message : sourceText("m_0a3d617fb5");}
    this.changed();this.schedule(this.connected ? Math.max(150,300-(performance.now()-started)) : 2000);
  }
  publish():Promise<void> {
    if(this.publishing)return this.publishing;
    this.publishing=this.publishSnapshot().finally(()=>{this.publishing=null;});return this.publishing;
  }
  private async publishSnapshot() {
    const session=this.session,e=this.engine();if(!session || session.role!=='host' || !e)return;
    const ack=this.authority.ack;
    const snapshot=await this.codec<string>('encode',{packet:{state:e.s,peers:this.peers}});
    try {await this.api({op:'publish',snapshot,revision:session.revision+1,ack});}
    catch(error){const revision=(error as {revision?:number}).revision;if(!Number.isSafeInteger(revision)||revision!<session.revision)throw error;session.revision=revision!;await this.api({op:'publish',snapshot,revision:session.revision+1,ack});}
    session.revision++;
  }
  async leave(force=false) {
    this.stopped=true;if(this.timer)clearTimeout(this.timer);
    await this.inFlight;
    const session=this.session;if(!session)return;
    try {
      if(session.role==='host') await this.publish();
      await this.api({op:'leave'});
    } catch(error) {
      if(!force){this.stopped=false;this.schedule(1000);throw error;}
    }
    this.session=null;this.connected=false;this.peers=[];this.queue=[];
    const e=this.engine();if(e)e.network=null;
    if(this.previous)this.switchWorld(this.previous);
    this.previous=null;this.status=sourceText("m_e4085fe56e");this.changed();
  }
  dispose(){this.stopped=true;if(this.timer)clearTimeout(this.timer);this.worker?.terminate();this.worker=null;for(const p of this.pending.values())p.reject(Error(sourceText("m_5ab708ccf9")));this.pending.clear();}
}
