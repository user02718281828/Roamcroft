export type Bag = Record<string, number>;
export type Item = {
  name: string;
  icon: string;
  price: number;
  food?: number;
  energy?: number;
  heal?: number;
  category: string;
};
const resource = (name: string, icon: string, price: number): Item => ({
  name,
  icon,
  price,
  category: 'Kaynak',
});
const food = (
  name: string,
  icon: string,
  price: number,
  hunger: number,
  energy: number,
  heal = 0,
): Item => ({
  name,
  icon,
  price,
  food: hunger,
  energy,
  heal,
  category: 'Yiyecek',
});
const product = (name: string, icon: string, price: number): Item => ({
  name,
  icon,
  price,
  category: 'Ürün',
});
export const ITEMS: Record<string, Item> = {
  apple: food('Günışığı elması', 'apple', 28, 18, 14),
  pear: food('Bal armudu', 'pear', 36, 22, 18),
  applesapling: { ...product('Elma fidanı', 'appletree', 65), category: 'Fidan' },
  pearsapling: { ...product('Armut fidanı', 'peartree', 90), category: 'Fidan' },
  applejam: food('Elma marmeladı', 'applejam', 105, 35, 32),
  peartart: food('Armutlu köy tartı', 'peartart', 165, 65, 55, 15),
  sprinkler: product('Bakır fıskiye', 'water', 80),
  wood: resource('Odun', '🪵', 3),
  stone: resource('Taş', '🪨', 4),
  fiber: resource('Lif', '🌿', 2),
  coal: resource('Kömür', '◼', 8),
  copper: resource('Bakır cevheri', '🔶', 12),
  iron: resource('Demir cevheri', '⛏', 18),
  crystal: resource('Ay kristali', '💎', 70),
  plank: product('Kereste', '🪵', 10),
  brick: product('Tuğla', '🧱', 14),
  bar: product('Demir külçesi', '🔩', 55),
  copperbar: product('Bakır külçesi', '🔶', 32),
  rope: product('Halat', '🪢', 12),
  wheat: product('Buğday', '🌾', 12),
  carrot: food('Havuç', '🥕', 20, 12, 8),
  tomato: food('Domates', '🍅', 30, 15, 10),
  pumpkin: food('Balkabağı', '🎃', 60, 24, 15),
  corn: food('Mısır', '🌽', 28, 15, 10),
  potato: food('Patates', '🥔', 25, 12, 10),
  berry: food('Orman meyvesi', '🫐', 6, 10, 7),
  mushroom: food('Mantar', '🍄', 9, 8, 5),
  fish: product('Nehir balığı', '🐟', 24),
  egg: food('Yumurta', '🥚', 20, 12, 10),
  milk: food('Süt', '🥛', 35, 18, 15),
  wool: product('Yün', '🧶', 32),
  honey: food('Bal', '🍯', 42, 20, 20),
  flour: product('Un', '🌾', 32),
  bread: food('Köy ekmeği', '🍞', 45, 40, 35, 8),
  soup: food('Sebze çorbası', '🍲', 65, 60, 45, 20),
  grilledfish: food('Izgara balık', '🍢', 55, 45, 30, 12),
  cheese: food('Peynir', '🧀', 90, 35, 30),
  jam: food('Orman reçeli', '🫙', 60, 30, 25),
  feed: product('Hayvan yemi', '🌾', 10),
  bandage: food('Sargı bezi', '🩹', 25, 0, 0, 40),
  fertilizer: product('Gübre', '🍂', 18),
  wheatseed: { ...product('Buğday tohumu', '🌾', 4), category: 'Tohum' },
  carrotseed: { ...product('Havuç tohumu', '🥕', 7), category: 'Tohum' },
  tomatoseed: { ...product('Domates tohumu', '🍅', 12), category: 'Tohum' },
  pumpkinseed: { ...product('Balkabağı tohumu', '🎃', 22), category: 'Tohum' },
  cornseed: { ...product('Mısır tohumu', '🌽', 10), category: 'Tohum' },
  potatoseed: { ...product('Patates tohumu', '🥔', 9), category: 'Tohum' },
};
export const CROPS: Record<
  string,
  {
    name: string;
    seed: string;
    grow: number;
    yield: number;
    level: number;
    seasons: number[];
    color: number;
  }
> = {
  wheat: {
    name: 'Buğday',
    seed: 'wheatseed',
    grow: 65,
    yield: 3,
    level: 1,
    seasons: [0, 1, 2, 3],
    color: 0xe9bd4c,
  },
  carrot: {
    name: 'Havuç',
    seed: 'carrotseed',
    grow: 95,
    yield: 3,
    level: 1,
    seasons: [0, 2],
    color: 0xec8d38,
  },
  potato: {
    name: 'Patates',
    seed: 'potatoseed',
    grow: 120,
    yield: 3,
    level: 3,
    seasons: [0, 2, 3],
    color: 0xcab575,
  },
  tomato: {
    name: 'Domates',
    seed: 'tomatoseed',
    grow: 150,
    yield: 4,
    level: 4,
    seasons: [0, 1],
    color: 0xdf5147,
  },
  corn: {
    name: 'Mısır',
    seed: 'cornseed',
    grow: 180,
    yield: 4,
    level: 5,
    seasons: [1, 2],
    color: 0xe6c448,
  },
  pumpkin: {
    name: 'Balkabağı',
    seed: 'pumpkinseed',
    grow: 240,
    yield: 3,
    level: 7,
    seasons: [2],
    color: 0xe88c35,
  },
};
export type BuildingDef = {
  name: string;
  icon: string;
  desc: string;
  cost: Bag;
  level: number;
  hp: number;
  category: string;
  color: number;
  production?: { input: Bag; output: Bag; time: number };
  orchard?: { fruit: string; matureDays: number; seasons: number[] };
  unique?: boolean;
};
export const BUILDINGS: Record<string, BuildingDef> = {
  appletree: { name: 'Günışığı elma ağacı', icon: 'appletree', desc: 'Fidanı boş çayıra dik. 2 günde büyür; ilkbahar ve sonbaharda günde bir hasat verir. Sulama gerekmez. Yükseltme meyve sayısını artırır.', cost: { applesapling: 1, wood: 4 }, level: 1, hp: 120, category: 'Bahçe', color: 0xb74c37, orchard: { fruit: 'apple', matureDays: 2, seasons: [0, 2] } },
  peartree: { name: 'Bal armudu ağacı', icon: 'peartree', desc: '3 günde büyür; yaz ve sonbaharda günde bir hasat verir. Meyveler ağacın üstünde görünür. Sulama gerekmez.', cost: { pearsapling: 1, wood: 4 }, level: 2, hp: 140, category: 'Bahçe', color: 0xd4b34a, orchard: { fruit: 'pear', matureDays: 3, seasons: [1, 2] } },
  wall: {name:'Taş duvar', icon:'stone', desc:'Düz veya L köşe biçiminde yerleştir. Döndürerek avlu ve çevre duvarları kur.', cost:{stone:5}, level:2, hp:240, category:'Savunma', color:0x8b998a},
  sprinkler: {
    name: 'Bakır fıskiye',
    icon: 'water',
    desc: 'Önce üretim menüsünde hazırla. Bitişik 8 kareyi sürekli sular. Suyun yolu emaneti menzilini artırır.',
    cost: { sprinkler: 1 },
    level: 2,
    hp: 90,
    category: 'Köy',
    color: 0xa78b61,
  },
  feedmill: {
    name: 'Yem değirmeni',
    icon: 'feed',
    desc: '55 saniyede 3 buğdayı 9 yeme dönüştürür. Çiftliğin besleme döngüsünü otomatikleştirir.',
    cost: { plank: 18, stone: 25, copperbar: 4 },
    level: 4,
    hp: 180,
    category: 'Üretim',
    color: 0xc5a45c,
    production: { input: { wheat: 3 }, output: { feed: 9 }, time: 55 },
  },
  smokehouse: {
    name: 'Balık tütsühanesi',
    icon: 'grilledfish',
    desc: '60 saniyede 2 balık ve 1 odunla 3 porsiyon pişmiş balık hazırlar.',
    cost: { plank: 16, brick: 12, bar: 3 },
    level: 5,
    hp: 190,
    category: 'Üretim',
    color: 0x9c7154,
    production: {
      input: { fish: 2, wood: 1 },
      output: { grilledfish: 3 },
      time: 60,
    },
  },
  loom: {
    name: 'Dokuma atölyesi',
    icon: 'wool',
    desc: '65 saniyede 2 yün ve 1 liften 3 sargı bezi dokur. Koyunlardan keşif erzağına.',
    cost: { plank: 22, rope: 8, copperbar: 4 },
    level: 6,
    hp: 170,
    category: 'Üretim',
    color: 0xbb977e,
    production: {
      input: { wool: 2, fiber: 1 },
      output: { bandage: 3 },
      time: 65,
    },
  },
  home: {
    name: 'Ocak evi',
    icon: '🏡',
    desc: 'Vadinin kalbi. Burada uyuyarak ertesi güne geç.',
    cost: { wood: 60, stone: 35 },
    level: 1,
    hp: 300,
    category: 'Köy',
    color: 0xb96348,
    unique: true,
  },
  workshop: {
    name: 'Marangoz',
    icon: '🪚',
    desc: '35 saniyede 3 odunu 2 keresteye dönüştürür.',
    cost: { wood: 25, stone: 10 },
    level: 1,
    hp: 150,
    category: 'Üretim',
    color: 0x7b9270,
    production: { input: { wood: 3 }, output: { plank: 2 }, time: 35 },
  },
  campfire: {
    name: 'Kamp ateşi',
    icon: '🔥',
    desc: 'Yakınında dinlenmek enerji yeniler. Yemek tariflerini açar.',
    cost: { wood: 12, stone: 8 },
    level: 1,
    hp: 80,
    category: 'Köy',
    color: 0xe69542,
  },
  well: {
    name: 'Kuyu',
    icon: '🪣',
    desc: '3 kare yakınındaki tarlaları otomatik sular.',
    cost: { stone: 30, wood: 15 },
    level: 2,
    hp: 170,
    category: 'Köy',
    color: 0x8796a5,
  },
  coop: {
    name: 'Kümes',
    icon: '🐔',
    desc: 'Tavuk barınağı. Hayvan pazarından tavuk al.',
    cost: { wood: 25, stone: 12 },
    level: 1,
    hp: 150,
    category: 'Köy',
    color: 0xca8b55,
  },
  furnace: {
    name: 'Taş ocağı',
    icon: '♨',
    desc: '50 saniyede 4 taştan 2 tuğla. Külçe tariflerini açar.',
    cost: { stone: 35, wood: 15 },
    level: 3,
    hp: 200,
    category: 'Üretim',
    color: 0x8d9a9c,
    production: { input: { stone: 4 }, output: { brick: 2 }, time: 50 },
  },
  mill: {
    name: 'Yel değirmeni',
    icon: '🌬',
    desc: '45 saniyede 3 buğdaydan 2 un üretir.',
    cost: { wood: 45, stone: 25, plank: 10 },
    level: 3,
    hp: 200,
    category: 'Üretim',
    color: 0xe5ca92,
    production: { input: { wheat: 3 }, output: { flour: 2 }, time: 45 },
  },
  chest: {name:'Ortak depo sandığı',icon:'',desc:'1.200 ürün saklar. Yükseltmeyle büyür. Çanta dolunca fazla kaynakları otomatik toplar; bütün sandıklar aynı depoya erişir.',cost:{wood:12,stone:4},level:1,hp:160,category:'Köy',color:0xb27b43},
  fence: {
    name: 'Ahşap sur',
    icon: '🪵',
    desc: 'Akıncıların yolunu keser. Hasar alınca onar.',
    cost: { wood: 6 },
    level: 1,
    hp: 140,
    category: 'Savunma',
    color: 0x916a45,
  },
  tower: {
    name: 'Gözcü kulesi',
    icon: '🏹',
    desc: '5 kare içindeki akıncılara otomatik ok atar.',
    cost: { wood: 40, stone: 30, plank: 8 },
    level: 3,
    hp: 230,
    category: 'Savunma',
    color: 0x8e705a,
  },
  barn: {
    name: 'Ahır',
    icon: '🐄',
    desc: 'İnek ve koyun barınağı. Yemle süt ve yün üret.',
    cost: { wood: 70, stone: 35, plank: 12 },
    level: 3,
    hp: 250,
    category: 'Köy',
    color: 0xba5e4f,
  },
  apiary: {
    name: 'Arılık',
    icon: '🐝',
    desc: '150 saniyede 2 bal üretir.',
    cost: { wood: 45, plank: 10, fiber: 15 },
    level: 5,
    hp: 120,
    category: 'Üretim',
    color: 0xd2a75a,
    production: { input: {}, output: { honey: 2 }, time: 150 },
  },
  dairy: {
    name: 'Mandıra',
    icon: '🧀',
    desc: '80 saniyede 2 sütten 1 peynir üretir.',
    cost: { stone: 45, plank: 20, brick: 10 },
    level: 6,
    hp: 200,
    category: 'Üretim',
    color: 0x9cbbbc,
    production: { input: { milk: 2 }, output: { cheese: 1 }, time: 80 },
  },
  kitchen: {
    name: 'Köy mutfağı',
    icon: '🍲',
    desc: '70 saniyede 4 orman meyvesinden 2 reçel.',
    cost: { stone: 35, plank: 15, brick: 8 },
    level: 4,
    hp: 180,
    category: 'Üretim',
    color: 0x879869,
    production: { input: { berry: 4 }, output: { jam: 2 }, time: 70 },
  },
  greenhouse: {
    name: 'Sera',
    icon: '🌱',
    desc: '4 kare yakınındaki ekinler her mevsim %25 hızlı büyür.',
    cost: { plank: 30, bar: 10, crystal: 3 },
    level: 8,
    hp: 240,
    category: 'Köy',
    color: 0x8cb9ac,
  },
  beacon: {
    name: 'Kadim fener',
    icon: '🔮',
    desc: 'İnşa et ve 3. seviyeye yükselterek karanlığı dağıt.',
    cost: { stone: 100, bar: 25, crystal: 12, plank: 30 },
    level: 10,
    hp: 500,
    category: 'Köy',
    color: 0x9b8cc8,
    unique: true,
  },
  market: {
    name: 'Pazar tezgâhı',
    icon: '⚖',
    desc: 'Ürün sat, tohum ve malzeme satın al.',
    cost: { wood: 30, plank: 8 },
    level: 2,
    hp: 160,
    category: 'Köy',
    color: 0xe1aa58,
    unique: true,
  },
};
export const RECIPES: Record<
  string,
  {
    name: string;
    icon: string;
    input: Bag;
    output: Bag;
    level: number;
    station?: string;
    upgrade?: string;
  }
> = {
  applejam: { name: 'Elma marmeladı kaynat', icon: 'applejam', input: { apple: 3, honey: 1 }, output: { applejam: 2 }, level: 4, station: 'kitchen' },
  peartart: { name: 'Armutlu köy tartı pişir', icon: 'peartart', input: { pear: 2, flour: 1, egg: 1 }, output: { peartart: 1 }, level: 4, station: 'kitchen' },
  sprinkler: {
    name: 'Bakır fıskiye',
    icon: 'water',
    input: { stone: 5, copperbar: 2, iron: 2 },
    output: { sprinkler: 1 },
    level: 2,
  },
  plank: {
    name: 'Kereste kes',
    icon: '🪵',
    input: { wood: 3 },
    output: { plank: 2 },
    level: 1,
  },
  rope: {
    name: 'Halat ör',
    icon: '🪢',
    input: { fiber: 4 },
    output: { rope: 2 },
    level: 1,
  },
  feed: {
    name: 'Yem hazırla',
    icon: '🌾',
    input: { wheat: 2 },
    output: { feed: 6 },
    level: 1,
  },
  bandage: {
    name: 'Sargı bezi',
    icon: '🩹',
    input: { fiber: 5, berry: 2 },
    output: { bandage: 1 },
    level: 1,
  },
  fertilizer: {
    name: 'Gübre hazırla',
    icon: '🍂',
    input: { fiber: 3, mushroom: 1 },
    output: { fertilizer: 3 },
    level: 2,
  },
  flour: {
    name: 'Buğday öğüt',
    icon: '🌾',
    input: { wheat: 3 },
    output: { flour: 2 },
    level: 2,
  },
  bread: {
    name: 'Köy ekmeği',
    icon: '🍞',
    input: { flour: 2, wood: 1 },
    output: { bread: 2 },
    level: 2,
    station: 'campfire',
  },
  grilledfish: {
    name: 'Balık pişir',
    icon: '🍢',
    input: { fish: 1, wood: 1 },
    output: { grilledfish: 1 },
    level: 1,
    station: 'campfire',
  },
  soup: {
    name: 'Sebze çorbası',
    icon: '🍲',
    input: { carrot: 2, mushroom: 2, wood: 1 },
    output: { soup: 2 },
    level: 3,
    station: 'campfire',
  },
  copperbar: {
    name: 'Bakır erit',
    icon: '🔶',
    input: { copper: 3, coal: 1 },
    output: { copperbar: 1 },
    level: 3,
    station: 'furnace',
  },
  bar: {
    name: 'Demir erit',
    icon: '🔩',
    input: { iron: 3, coal: 2 },
    output: { bar: 1 },
    level: 4,
    station: 'furnace',
  },
  brick: {
    name: 'Tuğla pişir',
    icon: '🧱',
    input: { stone: 4, coal: 1 },
    output: { brick: 3 },
    level: 3,
    station: 'furnace',
  },
  axe: {
    name: 'Baltayı geliştir',
    icon: '🪓',
    input: { wood: 15, copperbar: 3 },
    output: {},
    level: 3,
    upgrade: 'axe',
  },
  pickaxe: {
    name: 'Kazmayı geliştir',
    icon: '⛏',
    input: { wood: 15, bar: 3 },
    output: {},
    level: 4,
    upgrade: 'pickaxe',
  },
  sword: {
    name: 'Kılıcı geliştir',
    icon: '⚔',
    input: { bar: 5, plank: 5 },
    output: {},
    level: 4,
    upgrade: 'sword',
  },
  armor: {
    name: 'Zırhı geliştir',
    icon: '🛡',
    input: { bar: 8, wool: 5 },
    output: {},
    level: 6,
    upgrade: 'armor',
  },
};
export const QUESTS: {
  id: string;
  name: string;
  desc: string;
  stat: string;
  target: number;
  reward: { gold: number; xp: number; items: Bag };
}[] = [
  { id: 'orchard', name: 'Yarının gölgesi', desc: 'Pazardan bir fidan al; İnşa → Bahçe bölümünden dik.', stat: 'orchard', target: 1, reward: { gold: 45, xp: 35, items: { honey: 2 } } },
  { id: 'fruit', name: 'Daldan sofraya', desc: 'Kendi ağaçlarından 6 meyve topla. Elma ilkbahar ve sonbaharda ürün verir.', stat: 'fruit', target: 6, reward: { gold: 120, xp: 65, items: { pearsapling: 1, flour: 2 } } },
  {
    id: 'gather',
    name: 'Bir kök sal',
    desc: '12 odun topla.',
    stat: 'wood',
    target: 12,
    reward: { gold: 40, xp: 35, items: { carrotseed: 6 } },
  },
  {
    id: 'till',
    name: 'Toprağın çağrısı',
    desc: '4 kare toprağı çapala.',
    stat: 'till',
    target: 4,
    reward: { gold: 30, xp: 35, items: { wheatseed: 8 } },
  },
  {
    id: 'plant',
    name: 'Yarına bir tohum',
    desc: '6 ekin dik.',
    stat: 'plant',
    target: 6,
    reward: { gold: 50, xp: 45, items: { bread: 2 } },
  },
  {
    id: 'harvest',
    name: 'İlk hasadın',
    desc: '6 tarladan hasat topla.',
    stat: 'harvest',
    target: 6,
    reward: { gold: 80, xp: 70, items: { tomatoseed: 5 } },
  },
  {
    id: 'build',
    name: 'Bir köy yükseliyor',
    desc: '3 yeni yapı inşa et.',
    stat: 'build',
    target: 3,
    reward: { gold: 100, xp: 90, items: { plank: 10 } },
  },
  {
    id: 'craft',
    name: 'Usta eller',
    desc: '8 kez üretim yap.',
    stat: 'craft',
    target: 8,
    reward: { gold: 100, xp: 100, items: { copper: 12 } },
  },
  {
    id: 'fish',
    name: 'Nehirden sofraya',
    desc: '5 balık yakala.',
    stat: 'fish',
    target: 5,
    reward: { gold: 100, xp: 80, items: { bread: 3 } },
  },
  {
    id: 'sell',
    name: 'Vadinin tüccarı',
    desc: 'Satışlardan 300 altın kazan.',
    stat: 'sell',
    target: 300,
    reward: { gold: 150, xp: 100, items: { iron: 15 } },
  },
  {
    id: 'animals',
    name: 'Yeni dostlar',
    desc: '3 hayvan sahiplen.',
    stat: 'animals',
    target: 3,
    reward: { gold: 100, xp: 120, items: { feed: 30 } },
  },
  {
    id: 'combat',
    name: 'Gecenin bekçisi',
    desc: '10 akıncıyı yen.',
    stat: 'kills',
    target: 10,
    reward: { gold: 200, xp: 160, items: { crystal: 3 } },
  },
  {
    id: 'upgrade',
    name: 'Ustalık yolu',
    desc: '5 yapı veya alet yükselt.',
    stat: 'upgrade',
    target: 5,
    reward: { gold: 250, xp: 180, items: { bar: 5 } },
  },
  {
    id: 'survive',
    name: 'Mevsimler geçerken',
    desc: '14 gün hayatta kal.',
    stat: 'days',
    target: 14,
    reward: { gold: 400, xp: 250, items: { crystal: 5 } },
  },
  {
    id: 'beacon',
    name: 'Vadinin ışığı',
    desc: 'Kadim feneri 3. seviyeye yükselt.',
    stat: 'beacon',
    target: 3,
    reward: { gold: 1000, xp: 1000, items: { crystal: 20 } },
  },
  {
    id: 'ranchbirth',
    name: 'Yeni bir can',
    desc: 'Çiftliğinde ilk yavruyu yetiştir.',
    stat: 'births',
    target: 1,
    reward: { gold: 120, xp: 90, items: { feed: 15 } },
  },
  {
    id: 'animalcare',
    name: 'Birlikte büyümek',
    desc: 'Hayvanlarınla 6 kez günlük ilgi etkileşimi yap.',
    stat: 'care',
    target: 6,
    reward: { gold: 180, xp: 100, items: { wheatseed: 12 } },
  },
  {
    id: 'production',
    name: 'Çalışan bir köy',
    desc: 'Üretim yapılarında 40 üretim döngüsü tamamla.',
    stat: 'production',
    target: 40,
    reward: { gold: 300, xp: 180, items: { bar: 6 } },
  },
  {
    id: 'riverlife',
    name: 'Nehirle dostluk',
    desc: '25 nehir balığı yakala.',
    stat: 'fish',
    target: 25,
    reward: { gold: 250, xp: 160, items: { crystal: 3 } },
  },
  {
    id: 'depths',
    name: 'Dağın ötesi',
    desc: 'Madenin beşinci katını tamamlayıp ganimetini çıkar.',
    stat: 'minecomplete',
    target: 1,
    reward: { gold: 500, xp: 300, items: { bandage: 8 } },
  },
];
export const SEASONS = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];
export const TOOLS = [
  { id: 'hand', name: 'Keşfet', icon: '✋', key: '1' },
  { id: 'axe', name: 'Balta', icon: '🪓', key: '2' },
  { id: 'pickaxe', name: 'Kazma', icon: '⛏', key: '3' },
  { id: 'hoe', name: 'Çapa', icon: '⚒', key: '4' },
  { id: 'seed', name: 'Tohum', icon: '🌱', key: '5' },
  { id: 'water', name: 'Sula', icon: '💧', key: '6' },
  { id: 'sword', name: 'Kılıç', icon: '⚔', key: '7' },
  { id: 'fish', name: 'Olta', icon: '🎣', key: '8' },
];
export const ANIMALS: Record<
  string,
  {
    name: string;
    icon: string;
    cost: number;
    home: string;
    product: string;
    time: number;
  }
> = {
  chicken: {
    name: 'Tavuk',
    icon: '🐔',
    cost: 65,
    home: 'coop',
    product: 'egg',
    time: 100,
  },
  cow: {
    name: 'İnek',
    icon: '🐄',
    cost: 180,
    home: 'barn',
    product: 'milk',
    time: 140,
  },
  sheep: {
    name: 'Koyun',
    icon: '🐑',
    cost: 150,
    home: 'barn',
    product: 'wool',
    time: 180,
  },
};
export const TALENTS: Record<
  string,
  { name: string; icon: string; desc: string }
> = {
  harvest: {
    name: 'Bereket',
    icon: '🌾',
    desc: 'Her 2 puanda hasada +1 ürün. Her puanda ekin büyümesi +%5.',
  },
  forage: {
    name: 'Ormanın armağanı',
    icon: '🌲',
    desc: 'Her puanda her kaynak darbesinden +1 malzeme.',
  },
  artisan: {
    name: 'Usta zanaatkâr',
    icon: '⚒',
    desc: 'Her puanda tüm üretim hızı +%12.',
  },
  defender: {
    name: 'Demir irade',
    icon: '🛡',
    desc: 'Her puanda alınan hasar −1 ve kule hasarı +%15.',
  },
  vigor: {
    name: 'Dinç adımlar',
    icon: '⚡',
    desc: 'Her puanda araçların enerji tüketimi −%8.',
  },
  angler: {
    name: 'Nehir bilgeliği',
    icon: '🎣',
    desc: 'Her puanda balık yakalama şansı +%3. Balık tutarken kristal bulma şansı kazan.',
  },
};
