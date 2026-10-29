import type {Engine} from '../game/model.ts';
import {inventoryCapacity, inventoryUsed} from '../game/progression.ts';
/** Presentation quote only. Engine/server revalidate on every actual transfer. */
export function storageQuote(engine: Engine, id: string, deposit: boolean) {
  const s=engine.s, bag=s.inventory[id]||0, stored=s.storage[id]||0;
  const used=Object.values(s.storage).reduce((n,v)=>n+v,0), capacity=engine.storageCapacity();
  const room=deposit?capacity-used:inventoryCapacity(s)-inventoryUsed(s);
  const amount=Math.max(0,Math.min(deposit?bag:stored,room));
  return {id,deposit,amount,signature:JSON.stringify([id,deposit,bag,stored,room,capacity])};
}
