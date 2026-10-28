import { sourceText } from '../i18n/source.ts';
import type { State } from './model.ts';

export type SleepStatus = { ready: string[]; waiting: string[]; voted: boolean };
export function sleepBlockReason(s: State, player = s.player): string | undefined {
  if(s.mine)return sourceText("m_255c00fe57");
  const home=s.buildings.find(b=>b.type==='home');
  if(!home||Math.hypot(player.x-home.x,player.z-home.z)>3)return sourceText("m_fb071f45c7");
  if(s.enemies.length||(!s.won&&s.day>=3&&s.day%3===0&&s.raidDay!==s.day))return sourceText("m_b10d39057b");
  if(s.time>=.25&&s.time<.65)return sourceText("m_452f04b32a");
}
