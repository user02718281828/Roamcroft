import { CircleHelp } from 'lucide-react';
import OrchardIcon from './OrchardIcon';
import {itemArt, ORCHARD_ART} from '@/lib/ui/item-art';
export default function GameIcon({id,className=''}:{id:string;className?:string}) {
  const base=id.replace(/[123]$/, '');
  if(ORCHARD_ART.includes(base))return <OrchardIcon id={base} className={className}/>;
  const entry=itemArt(id);
  if(!entry)return <CircleHelp className={`game-icon ${className}`} aria-hidden="true"/>;
  return <svg className={`game-icon game-icon-art ${className}`} aria-hidden="true" focusable="false"
    viewBox={`0 0 ${entry.width} ${entry.height}`} preserveAspectRatio="xMidYMid meet" overflow="hidden">
    <svg width={entry.width} height={entry.height} viewBox={`${entry.x} ${entry.y} ${entry.width} ${entry.height}`} overflow="hidden">
      <image href={`/art/farm-icons-${entry.sheet}.webp`} width="768" height="768"/>
    </svg>
  </svg>;
}
