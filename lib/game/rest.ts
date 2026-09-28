import type { State } from './model.ts';

export type SleepStatus = { ready: string[]; waiting: string[]; voted: boolean };
export function sleepBlockReason(s: State, player = s.player): string | undefined {
  if(s.mine)return 'Uyumak için yüzeydeki evine dön.';
  const home=s.buildings.find(b=>b.type==='home');
  if(!home||Math.hypot(player.x-home.x,player.z-home.z)>3)return 'Uyumak için Ocak evinin yakınına gel.';
  if(s.enemies.length||(!s.won&&s.day>=3&&s.day%3===0&&s.raidDay!==s.day))return 'Akın tehlikesi varken uyuyamazsın. Önce köyü savun.';
  if(s.time>=.25&&s.time<.65)return 'Uyumak için akşamı bekle. Dinlen düğmesini kullanabilirsin.';
}
