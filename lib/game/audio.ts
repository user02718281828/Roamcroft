// Sesler kullanıcı etkileşiminden sonra başlar; dış ses dosyası gerekmez.
import {spatialAmbience} from './ambience.ts';
import type {AcousticCamera} from './ambience.ts';
import {tileAt} from './model.ts';
import type {State} from './model.ts';
export type AudioLevels={music:number;ambience:number;effects:number};
export const DEFAULT_AUDIO:AudioLevels={music:.45,ambience:.7,effects:.65};
export type ActionSound='axe'|'pickaxe'|'hoe'|'harvest'|'seed'|'water'|'fish'|'sword';
export function cleanLevels(value:Partial<AudioLevels>):AudioLevels {
 return Object.fromEntries(Object.entries(DEFAULT_AUDIO).map(([key,fallback])=>{const n=value[key as keyof AudioLevels];return [key,typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback];})) as AudioLevels;
}
export class ValleyAudio {
 context:AudioContext|null=null;master:GainNode|null=null;enabled=false;
 levels={...DEFAULT_AUDIO};clock=0;note=0;lastBird=0;
 river:AudioBufferSourceNode|null=null;riverGain:GainNode|null=null;riverPan:StereoPannerNode|null=null;
 wind:AudioBufferSourceNode|null=null;windGain:GainNode|null=null;noiseBuffer:AudioBuffer|null=null;
 birdMix={gain:0,pan:0};stepDistance=0;lastPosition:{x:number;z:number}|null=null;voices=0;
 constructor(){try{this.levels=cleanLevels(JSON.parse(localStorage.getItem('roamcroft.audio.v1')||'{}'));}catch{}}
 setLevels(levels:Partial<AudioLevels>){this.levels=cleanLevels({...this.levels,...levels});try{localStorage.setItem('roamcroft.audio.v1',JSON.stringify(this.levels));}catch{}}
 async enable(value:boolean){
  this.enabled=value;
  if(value){try{
   if(!this.context){
    const c=this.context=new AudioContext();this.master=c.createGain();this.master.gain.value=.28;this.master.connect(c.destination);
    const noise=this.noiseBuffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),white=noise.getChannelData(0);
    const riverBuffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),water=riverBuffer.getChannelData(0);let smooth=0;
    for(let i=0;i<white.length;i++){white[i]=Math.random()*2-1;smooth=(smooth+white[i]*.045)/1.026;water[i]=smooth*3;}
    this.river=c.createBufferSource();this.river.buffer=riverBuffer;this.river.loop=true;
    const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=1400;
    this.riverGain=c.createGain();this.riverGain.gain.value=0;this.riverPan=c.createStereoPanner();
    this.river.connect(low).connect(this.riverGain).connect(this.riverPan).connect(this.master);this.river.start();
    this.wind=c.createBufferSource();this.wind.buffer=noise;this.wind.loop=true;
    const breeze=c.createBiquadFilter();breeze.type='lowpass';breeze.frequency.value=420;
    this.windGain=c.createGain();this.windGain.gain.value=0;this.wind.connect(breeze).connect(this.windGain).connect(this.master);this.wind.start();
   }
   await this.context.resume();this.master!.gain.setTargetAtTime(.28,this.context.currentTime,.2);
  }catch{this.enabled=false;}}
  else if(this.context&&this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.1);
  return this.enabled;
 }
 tone(frequency:number,duration:number,volume=.2,type:OscillatorType='sine',delay=0,pan=0,bus:keyof AudioLevels='effects'){
  if(!this.enabled||!this.context||!this.master||volume<=0||this.voices>=32)return;
  const c=this.context,o=c.createOscillator(),g=c.createGain(),stereo=c.createStereoPanner(),at=c.currentTime+delay;
  this.voices++;o.type=type;o.frequency.setValueAtTime(frequency,at);
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(Math.max(.0001,volume*this.levels[bus]),at+(bus==='music'?.16:.012));g.gain.exponentialRampToValueAtTime(.0001,at+duration);
  stereo.pan.value=pan;o.connect(g).connect(stereo).connect(this.master);o.start(at);o.stop(at+duration+.03);
  o.onended=()=>{this.voices--;o.disconnect();g.disconnect();stereo.disconnect();};
 }
 noise(duration:number,frequency:number,volume:number,type:BiquadFilterType='lowpass'){
  if(!this.enabled||!this.context||!this.master||!this.noiseBuffer||this.voices>=32)return;
  const c=this.context,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),at=c.currentTime;
  this.voices++;source.buffer=this.noiseBuffer;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.7;
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(Math.max(.0001,volume*this.levels.effects),at+.006);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  source.connect(filter).connect(gain).connect(this.master);source.start(at,Math.random()*2,duration);
  source.onended=()=>{this.voices--;source.disconnect();filter.disconnect();gain.disconnect();};
 }
 action(kind:ActionSound){
  if(kind==='axe'){this.noise(.18,1300,.45,'bandpass');this.tone(95,.18,.14,'triangle');}
  else if(kind==='pickaxe'){this.noise(.1,3200,.3,'highpass');this.tone(1350,.25,.12,'triangle');this.tone(2070,.12,.055);}
  else if(kind==='hoe'){this.noise(.25,620,.5);this.tone(80,.13,.1,'triangle');}
  else if(kind==='sword'){this.noise(.2,1600,.32,'bandpass');this.tone(210,.1,.07,'triangle');}
  else if(kind==='water'||kind==='fish')this.noise(.5,1400,.3);
  else {this.noise(.13,3500,.2,'highpass');if(kind==='harvest')this.tone(590,.28,.06);}
 }
 effect(kind:'good'|'bad'|'info'){
  if(kind==='bad')this.tone(155,.22,.12,'triangle');
  else if(kind==='good'){this.tone(523,.5,.075);this.tone(659,.65,.045,'sine',.09);}
 }
 footsteps(s:State){
  const p=s.player;
  if(!this.lastPosition){this.lastPosition={x:p.x,z:p.z};return;}
  const distance=Math.hypot(p.x-this.lastPosition.x,p.z-this.lastPosition.z);this.lastPosition={x:p.x,z:p.z};
  if(distance>2){this.stepDistance=0;return;}
  this.stepDistance+=distance;if(this.stepDistance<.48)return;this.stepDistance=0;
  const tile=tileAt(s,p.x,p.z),bridge=tile?.terrain==='path'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>tileAt(s,p.x+dx,p.z+dz)?.terrain==='water');
  this.noise(.085,bridge?170:tile?.terrain==='path'?480:tile?.terrain==='sand'?1000:2200,.13,bridge?'lowpass':'bandpass');
 }
 tick(dt:number,night:boolean){
  if(!this.enabled)return;this.clock+=dt;this.lastBird+=dt;
  if(this.clock>1.65){this.clock-=1.65;const notes=[0,4,7,11,7,4,2,7,9,7,4,2,0,7,4,2],n=notes[this.note++%notes.length],root=night?130.81:174.61,f=root*Math.pow(2,n/12);
   this.tone(f,2.8,.17,'sine',0,-.2,'music');this.tone(f*2,1.6,.025,'triangle',.02,.2,'music');
   if(this.note%4===0){this.tone(root/2,6,.15,'sine',0,0,'music');this.tone(root*.75,5.8,.085,'sine',.1,.3,'music');this.tone(root*1.25,5.4,.04,'sine',.2,-.3,'music');}
  }
  if(this.lastBird>6&&!night){this.lastBird=0;const {gain,pan}=this.birdMix;
   this.tone(1800,.15,.15*gain,'sine',0,pan,'ambience');this.tone(2300,.12,.1*gain,'sine',.15,pan,'ambience');this.tone(1950,.22,.1*gain,'sine',.29,pan,'ambience');
  }
 }
 ambience(s:State,camera:AcousticCamera,paused:boolean){
  const mix=spatialAmbience(s,camera);this.birdMix=paused?{gain:0,pan:0}:mix.birds;
  if(!this.context||!this.riverGain||!this.riverPan)return;
  const at=this.context.currentTime;this.riverGain.gain.setTargetAtTime(paused?0:mix.river.gain*.75*this.levels.ambience,at,.4);this.riverPan.pan.setTargetAtTime(mix.river.pan,at,.4);
  this.windGain?.gain.setTargetAtTime(paused||s.mine?0:(.12+mix.birds.gain*.09+Math.sin(at*.17)*.025)*(s.weather==='rain'?2:1)*this.levels.ambience,at,.8);
 }
 dispose(){this.river?.stop();this.wind?.stop();this.river?.disconnect();this.wind?.disconnect();this.river=null;this.wind=null;void this.context?.close();this.context=null;this.master=null;}
}
