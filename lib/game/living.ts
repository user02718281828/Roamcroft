export type HumanAction = 'idle' | 'standing' | 'walking' | 'running' | 'working' | 'harvesting' | 'eating' | 'fishing' | 'sitting' | 'sleeping' | 'talking' | 'greeting';
export type AnimalAction = 'grazing' | 'walking' | 'running' | 'following' | 'sleeping' | 'lying' | 'happy' | 'fleeing';
export function sunlight(time:number) {
  const hour=((time%1)+1)%1*24;
  const daylight=Math.max(0,Math.sin((hour-6)/13*Math.PI))*(hour>=6&&hour<=19?1:0);
  return {daylight,ambient:.18+daylight*1.75,direct:.22+daylight*2.8,x:Math.cos((hour-6)/13*Math.PI)*26,y:12+daylight*24,night:daylight<.08};
}
export function schedule(index:number,time:number,home:{x:number;z:number}) {
  const hour=time*24;
  if(hour<6||hour>=22)return {x:11+index*2,z:16,action:'sleeping' as HumanAction,label:'Evde dinleniyor'};
  if(hour<8)return {x:13+index,z:18,action:'sitting' as HumanAction,label:'Kahvaltı molasında'};
  if(hour>=12&&hour<14)return {x:15+index,z:19,action:'talking' as HumanAction,label:'Köy meydanında'};
  if(hour>=18)return {x:14+index,z:18,action:'sitting' as HumanAction,label:'Akşam buluşmasında'};
  return {...home,action:'working' as HumanAction,label:'İşinin başında'};
}
export function timedGreeting(time:number) {
  const hour=time*24;
  return hour<6||hour>=22?'Geç oldu. Yarın yeniden görüşelim.':hour<10?'Günaydın! Yeni bir güne hazır mısın?':hour<17?'İşler nasıl gidiyor? Biraz soluklanalım.':'Akşam serinliği çöktü. Meydandaki sofraya uğra.';
}
export function humanPose(action:HumanAction,time:number) {
  const wave=Math.sin(time*(action==='running'?18:11)),breath=Math.sin(time*2);
  const p={leftLeg:0,rightLeg:0,leftArm:0,rightArm:0,armSide:0,lean:0,height:breath*.008};
  if(action==='walking'||action==='running'){const stride=action==='running'?.8:.5;Object.assign(p,{leftLeg:wave*stride,rightLeg:-wave*stride,leftArm:-wave*.4,rightArm:wave*.4,height:Math.abs(wave)*.04,lean:action==='running'?.12:0});}
  if(action==='working')Object.assign(p,{rightArm:-.7-Math.sin(time*9)*.6,lean:.12});
  if(action==='harvesting')Object.assign(p,{leftArm:-.8,rightArm:-.8,lean:.5,height:-.13});
  if(action==='eating')Object.assign(p,{rightArm:-1.7+Math.sin(time*5)*.2});
  if(action==='fishing')Object.assign(p,{leftArm:-.75,rightArm:-1.1+breath*.06});
  if(action==='standing'){const lift=1-Math.min(1,Math.max(0,time));Object.assign(p,{leftLeg:-1.2*lift,rightLeg:-1.2*lift,height:-.25*lift});}
  if(action==='sitting')Object.assign(p,{leftLeg:-1.2,rightLeg:-1.2,height:-.25});
  if(action==='sleeping')Object.assign(p,{lean:-1.35,height:-.22});
  if(action==='talking')Object.assign(p,{rightArm:-.3+Math.sin(time*4)*.25,armSide:.2});
  if(action==='greeting')Object.assign(p,{rightArm:-2.6+Math.sin(time*7)*.25,armSide:.3});
  return p;
}
export function animalPose(action:AnimalAction,time:number) {
  const walking=['walking','running','following','fleeing'].includes(action),fast=action==='running'||action==='fleeing';
  return {height:action==='happy'?Math.abs(Math.sin(time*8))*.17:walking?Math.abs(Math.sin(time*(fast?18:10)))*(fast?.07:.025):0,
    pitch:action==='grazing'?.08+Math.sin(time*2)*.06:action==='fleeing'?-.1:0,
    roll:action==='lying'?.25:action==='happy'?Math.sin(time*8)*.07:0,
    squash:action==='sleeping'?.68+Math.sin(time*1.6)*.015:action==='lying'?.76:1+Math.sin(time*1.8)*.012};
}
