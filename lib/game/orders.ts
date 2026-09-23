import { type Bag } from './data.ts';
import { bagValue } from './economy.ts';
import type { State } from './model.ts';

type OrderDefinition = {id: string; name: string; description: string; input: Bag; level: number; supplies?: Bag; seasons?: number[]};
export type DailyOrder = OrderDefinition & {token: string; day: number; gold: number; xp: number; value: number};
const stock: Record<string, {fresh: OrderDefinition[]; prepared: OrderDefinition[]}> = {
  narin: {
    fresh: [
      {id:'supper',name:'Sofraya taze havuç',description:'Akşam sofrasına ayırdığım sebzeleri tamamlayabilir misin?',input:{carrot:6},level:1,seasons:[0,2]},
      {id:'grain',name:'Yarınki öğütme',description:'Değirmene gidecek buğdayı bugün hazırlıyorum. Bir çuvalı senin tarladan dolduralım.',input:{wheat:9},level:1},
    ],
    prepared: [
      {id:'soup',name:'Tencereden sofraya',description:'Bu kez sebze yerine hazır çorba getir. Karşılığında gelecek ekimin için gübre ayırdım.',input:{soup:2},supplies:{fertilizer:2},level:4},
      {id:'jam',name:'Kavanozları dolduralım',description:'Meyve bahçenin ürününü marmelat olarak değerlendirelim. Yeni ekimin toprağına da katkım olsun.',input:{applejam:2},supplies:{fertilizer:3},level:4},
      {id:'cheese',name:'Çiftlikten sofraya',description:'İki peynirle ortak sofrayı tamamlayabiliriz. Hayvanlarına bir sonraki gün için yem hazırladım.',input:{cheese:2},supplies:{feed:4},level:6},
    ],
  },
  torin: {
    fresh: [
      {id:'repair',name:'Onarıma malzeme',description:'İşlenmemiş taş ve odun da işimi görür; kesimini ben tamamlarım.',input:{stone:8,wood:4},level:1},
      {id:'fiber',name:'Bağları yenile',description:'Malzeme demetlerini bağlamak için lif, dayanaklar için biraz odun gerekiyor.',input:{fiber:12,wood:8},level:1},
    ],
    prepared: [
      {id:'planks',name:'Ölçülü tahtalar',description:'Hazır kereste getirirsen daha çabuk işe koyulurum. Sana da bağlantı halatı ayırdım.',input:{plank:8},supplies:{rope:2},level:2},
      {id:'bricks',name:'Ocağın kenarı',description:'Pişmiş tuğla getir; karşılığında bir sonraki yapın için kereste vereyim.',input:{brick:6},supplies:{plank:2},level:3},
      {id:'rope',name:'Sağlam bağlantılar',description:'İşlenmiş halatla malzemeleri sabitleyelim. Yapı stoğun için kereste hazır.',input:{rope:8},supplies:{plank:3},level:3},
    ],
  },
  lale: {
    fresh: [
      {id:'catch',name:'Kıyıdan gelen',description:'Bugünün balık teslimatını birlikte tamamlayalım.',input:{fish:3},level:1},
      {id:'rivermeal',name:'Kıyıda öğle arası',description:'Balığın yanına birkaç orman meyvesi ekleyelim; kıyıda uzun bir gün var.',input:{fish:2,berry:4},level:1},
    ],
    prepared: [
      {id:'packedfish',name:'Yola hazır yemek',description:'Pişmiş balık getirirsen yemeği taşımak kolay olur. Keşif çantana bir sargı bırakırım.',input:{grilledfish:3},supplies:{bandage:1},level:2},
      {id:'bread',name:'Kıyı azığı',description:'Bugün balık yerine ekmek lazım. Uzun yürüyüşlerinde kullanman için sargı hazırladım.',input:{bread:3},supplies:{bandage:1},level:2},
    ],
  },
};

// Offers depend only on world seed and game day, never inventory, XP or render timing.
export function dailyOrders(s: Pick<State,'day'|'seed'>, npc: string, day = s.day): DailyOrder[] {
  if (!Object.hasOwn(stock, npc) || !Number.isSafeInteger(day) || day < 1 || day > 1_000_000) return [];
  const season = Math.floor((day - 1) / 7) % 4, entries = stock[npc];
  const offset = (s.seed >>> 0) + day - 1;
  return [entries.fresh.filter(o => !o.seasons || o.seasons.includes(season)), entries.prepared].map(pool => {
    const order = pool[offset % pool.length], value = bagValue(order.input);
    return {...order,token:`${day}:${npc}:${order.id}`,day,value,gold:Math.ceil(value * 1.25) - bagValue(order.supplies || {}),xp:40};
  });
}
export function validOrderToken(npc: string, token: unknown) {
  if (typeof token !== 'string' || token.length > 60 || !Object.hasOwn(stock, npc)) return false;
  const parts = token.split(':');
  return parts.length === 3 && /^[1-9]\d{0,6}$/.test(parts[0]) && Number(parts[0]) <= 1_000_000 && parts[1] === npc
    && [...stock[npc].fresh,...stock[npc].prepared].some(o => o.id === parts[2]);
}
