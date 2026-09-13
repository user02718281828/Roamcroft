import type {Tile} from './model.ts';
export function blocksTile(tile:Tile){return tile.terrain==='water'||tile.terrain==='wall'||!!tile.resource&&!['bush','mushroom'].includes(tile.resource);}
export function blocksPoint(tile:Tile,x:number,z:number){
 if(tile.resource==='tree'&&tile.terrain!=='water'&&tile.terrain!=='wall')return Math.hypot(x-tile.x,z-tile.z)<.32;
 return blocksTile(tile);
}
