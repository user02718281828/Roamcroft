import { sourceText } from '../i18n/source.ts';
import type { State } from './model.ts';
import {structureEntrance} from './footprint.ts';

export type SleepStatus = { ready: string[]; waiting: string[]; voted: boolean };
export function sleepBlockReason(s: State, player = s.player): string | undefined {
  if(s.mine)return sourceText("m_255c00fe57");
  const nearHome=s.buildings.some(b=>{
    if(b.type==='home')return Math.hypot(player.x-b.x,player.z-b.z)<=3;
    if(b.type!=='farmhouse')return false;
    const door=structureEntrance(b);return Math.hypot(player.x-door.x,player.z-door.z)<=1.6;
  });
  if(!nearHome)return sourceText("m_fb071f45c7");
  if(s.enemies.length||(!s.won&&s.day>=3&&s.day%3===0&&s.raidDay!==s.day))return sourceText("m_b10d39057b");
  if(s.time>=.25&&s.time<.65)return sourceText("m_452f04b32a");
}
