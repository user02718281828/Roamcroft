import {validCommand,validPose,type Command,type Pose} from '../coop/protocol.ts';
export function validServerCommand(value:unknown):value is Command {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const c=value as Command;
  if(Object.keys(c).some(key=>!['seq','method','args'].includes(key)))return false;
  if(!Number.isSafeInteger(c.seq)||c.seq<1||!Array.isArray(c.args))return false;
  if(['returnHome','descendMine','leaveMine','sleep'].includes(c.method))return c.args.length===0;
  if(c.method==='enterMine')return c.args.length===1&&Number.isInteger(c.args[0])&&Number(c.args[0])>=1&&Number(c.args[0])<=5;
  if(c.method==='renameSettlement')return c.args.length===1&&typeof c.args[0]==='string'&&c.args[0].length<=32;
  if(['talk','gift','completeContract'].includes(c.method)&&typeof c.args[0]!=='string')return false;
  if(c.method==='act'&&(!Number.isInteger(c.args[0])||!Number.isInteger(c.args[1])||typeof c.args[2]!=='string'))return false;
  if(c.method==='build'&&(!Number.isInteger(c.args[1])||!Number.isInteger(c.args[2])))return false;
  return validCommand(c);
}
export function validPulse(value:unknown):value is {seq:number;pose:Pose;commands:Command[];paused:boolean} {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const p=value as {seq:number;pose:Pose;commands:Command[];paused:boolean};
  return Object.keys(p).every(key=>['seq','pose','commands','paused'].includes(key))&&Number.isSafeInteger(p.seq)&&p.seq>0&&typeof p.paused==='boolean'&&validPose(p.pose)&&Array.isArray(p.commands)&&p.commands.length<=8&&p.commands.every(validServerCommand);
}
