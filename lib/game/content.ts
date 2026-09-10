import type { Bag } from './data.ts';
export type NPC = {
  id: string;
  name: string;
  role: string;
  color: number;
  x: number;
  z: number;
  dialogue: Record<string, string[]>;
  contract: {
    name: string;
    description: string;
    input: Bag;
    gold: number;
    xp: number;
  };
  gift: string;
};
export type Landmark = {
  id: string;
  name: string;
  description: string;
  x: number;
  z: number;
  reward: { items: Bag; gold: number; xp: number };
};
export const NPCS: NPC[] = [
  {
    id: 'narin',
    name: 'Narin',
    role: 'Tüccar ve Bahçıvan',
    color: 14979479,
    x: 18,
    z: 13,
    dialogue: {
      early: [
        'Şu avucundaki toprağa bak. Koyu renkliyse umut vardır; gerisi su, emek, biraz da sabır.',
        'İlk gün bütün tarlayı ekmeye kalkma. Bakabildiğin üç sıra, susuz bıraktığın on sıradan iyidir.',
        'Altı havuç yetiştirirsen getir. Akşama koca bir tencere çorba kuracağım; sofrada sana da yer var.',
      ],
      growing: [
        'Filizlerin boy atmış! İnsan ilk hasadını toplarken sessizleşir; kendi emeğine bakmanın bir ağırlığı var.',
        'Biraz ürünü sat, birazını mutfağa ayır. Kesesi dolu, karnı aç çiftçinin ertesi günü pek neşeli geçmez.',
        'Torin yine yağmur kokusu aldığını söylüyor. Ben gökyüzüne değil, toprağın kuruluğuna bakarım.',
      ],
      established: [
        'Tarlanın kenarından geçerken yavaşlıyorum artık. Her sırada senin elinin izi var.',
        'Eskiden burada yalnızca yabani otlar büyürdü. Şimdi akşamları ekmek kokusu geliyor; bir yer böyle yuva olur.',
        'Bol ürün almak güzel, ama her günü yarışa çevirme. Hasat bitince oturup bir havuç da kendin ye.',
      ],
      beacon: [
        'Işığı görünce elimdeki tohumu öylece tuttum. Bunca yıl beklediğimiz şeyin gerçekten olduğunu anlamam biraz sürdü.',
        'Artık vadiye dönenler yolu bulacak. Geldiklerinde önlerine koyacak ekmeğimiz de var, senin sayende.',
        'Kutlama sofrasını ben kurarım. Bu kez senden havuç değil, gelip bizimle oturmanı istiyorum.',
      ],
    },
    contract: {
      name: 'Akşamın Çorbası',
      description:
        "Narin'in ortak sofra için hazırladığı çorbaya 6 havuç getir.",
      input: {
        carrot: 6,
      },
      gold: 150,
      xp: 40,
    },
    gift: 'carrot',
  },
  {
    id: 'torin',
    name: 'Torin',
    role: 'Yapı Ustası',
    color: 11176285,
    x: 11,
    z: 16,
    dialogue: {
      early: [
        'Torin. Duvar, çatı, ocak; sağlam durması gereken şeylere bakarım. Sen de buraya kök salmaya gelmişsin galiba.',
        'Önce taşla odun biriktir. Güzel fikirler çoktur, onları ayakta tutacak malzeme daha az bulunur.',
        'Sekiz taşla dört odun getirirsen şu onarımı bitiririm. Emeğinin karşılığını da kuru teşekkürle ödemem.',
      ],
      growing: [
        'Yaptığın iş uzaktan belli oluyor. Dün boş duran yerde bugün bir düzen var; ustalık böyle başlar.',
        'Tezgâh başında acele etme. Bir malzemeyi işlerken yarın hangi işe gerekeceğini de düşün.',
        'Lale bütün taşların aynı olduğunu sanıyor. Ona göre bütün balıklar farklı tabii. Herkesin inadı kendi işinde.',
      ],
      established: [
        'Şu vadinin sesine kulak ver: kazma, su, hayvanlar... Eskiden yalnızca rüzgâr vardı.',
        'Artık bir şeyi onarman gerekince nereden başlayacağını biliyorsun. İyi ustayı aleti değil, o bakış ele verir.',
        'Bir gün tezgâhın başında sana danışacağım aklıma gelmezdi. Fazla sevinme; ölçüyü yine iki kere alacağız.',
      ],
      beacon: [
        'Temeli sağlam tutarsan üstüne ışık da kurulurmuş. Bunu söyleyeceğim günü bekliyordum.',
        'Fener yanıyor. Malzemeyi saydık, taşı taşıdık, işi bitirdik. Ama şu manzarayı hiçbir hesaba sığdıramadım.',
        'Bu akşam çekiç burada kalacak. Narin sofrayı kurmuş; usta dediğin ne zaman işi bırakacağını da bilmeli.',
      ],
    },
    contract: {
      name: 'Sağlam Bir Başlangıç',
      description: "Torin'in onarım işine 8 taş ve 4 odun sağla.",
      input: {
        stone: 8,
        wood: 4,
      },
      gold: 80,
      xp: 40,
    },
    gift: 'copper',
  },
  {
    id: 'lale',
    name: 'Lale',
    role: 'Balıkçı',
    color: 5948067,
    x: 21,
    z: 21,
    dialogue: {
      early: [
        'Yeni yüz, yeni hikâye! Ben Lale. Nehirde benden çok vakit geçiren tek kişi var, o da sandığım kadarıyla bir sazan.',
        'Oltanı suya bırakınca omuzlarını da indir. Balık tutmak bazen akşama kadar hiçbir yere yetişmemeyi öğrenmektir.',
        'Üç balık getir, bugünün siparişini beraber çıkaralım. Büyük olanı kaçırdım dersen bu kez kanıt isterim.',
      ],
      growing: [
        'Oltayı artık tanıdık bir dost gibi taşıyorsun. İlk günkü gibi suyu korkutmuyorsundur umarım.',
        'Vadiyi dolaşırken kıyıdan da geç. İşlerin arasında kısa bir balık molası iyi gelir; bazen akşam yemeği de çıkar.',
        'Narin çorbasına balık koymamı istemiyor. Torin de tarif tartışırken kendi çorbasını çoktan bitiriyor.',
      ],
      established: [
        'Sen gelmeden önce günleri tuttuğum balıklarla sayardım. Şimdi her gün anlatacak başka bir şey çıkıyor.',
        'Bazen su durulunca fenerin sönük nehirgesi görünüyor. Bir gün gerçek ışığını burada seyredeceğimize inanıyorum.',
        'Bunca işin arasında hâlâ nehre uğruyorsun ya, hoşuma gidiyor. Bir yerin kıymetini yalnızca kazandırdığıyla ölçmemeli.',
      ],
      beacon: [
        'Gördün mü? Fenerin ışığı suya kadar uzanıyor! Sazan şimdi benim kadar güzel bir manzaraya sahip.',
        'Bu gece oltayı topladım. Yakalayacağım en iyi şey zaten karşımda: vadinin yeniden canlanması.',
        'Yarın yine balığa çıkarız. Büyük işler bitince küçük güzel şeylere dönmek lazım.',
      ],
    },
    contract: {
      name: 'Kıyının Bereketi',
      description: "Lale'nin günlük siparişini tamamlaması için 3 balık getir.",
      input: {
        fish: 3,
      },
      gold: 100,
      xp: 40,
    },
    gift: 'grilledfish',
  },
];
export const LANDMARKS: Landmark[] = [
  {
    id: 'grove',
    name: 'Fısıltı Korusu',
    description:
      'Yaşlı ağaçların arasında rüzgâr hafifliyor. Köklerin dibindeki eski erzak bohçası hâlâ sağlam.',
    x: 6,
    z: 28,
    reward: {
      items: {
        berry: 5,
        mushroom: 3,
        honey: 1,
      },
      gold: 100,
      xp: 60,
    },
  },
  {
    id: 'ruins',
    name: 'Eski Gözcü Harabeleri',
    description:
      'Yıkık duvarlarda feneri gösteren bir işaret var. Taşların arasındaki sandıkta iki kristal solgun bir ışık saçıyor.',
    x: 7,
    z: 5,
    reward: {
      items: {
        crystal: 2,
      },
      gold: 100,
      xp: 80,
    },
  },
  {
    id: 'outlook',
    name: 'Gündoğumu Sırtı',
    description:
      'Vadi buradan avucunun içine sığıyor. Bir yolcunun taş altına bıraktığı azık, tırmanışın yorgunluğunu alıyor.',
    x: 32,
    z: 8,
    reward: {
      items: {
        bread: 2,
        bandage: 2,
      },
      gold: 100,
      xp: 70,
    },
  },
];
export const ACHIEVEMENTS: {
  id: string;
  name: string;
  description: string;
  stat: string;
  target: number;
  rewardGold: number;
}[] = [
  {
    id: 'woodland_hand',
    name: 'Ormanın Emektarı',
    description: 'Toplam 300 odun topla.',
    stat: 'wood',
    target: 300,
    rewardGold: 250,
  },
  {
    id: 'soil_keeper',
    name: 'Toprağın Dilinden',
    description: 'Toplam 80 kez toprağı sür.',
    stat: 'till',
    target: 80,
    rewardGold: 180,
  },
  {
    id: 'seed_of_tomorrow',
    name: 'Yarına Tohum',
    description: 'Toplam 150 ekim yap.',
    stat: 'plant',
    target: 150,
    rewardGold: 220,
  },
  {
    id: 'full_baskets',
    name: 'Dolu Sepetler',
    description: '100 tarladan hasat topla.',
    stat: 'harvest',
    target: 100,
    rewardGold: 250,
  },
  {
    id: 'valley_builder',
    name: 'Vadiye Kök Salan',
    description: 'Toplam 25 yapı inşa et.',
    stat: 'build',
    target: 25,
    rewardGold: 300,
  },
  {
    id: 'skilled_hands',
    name: 'El Emeği',
    description: 'Toplam 100 üretim tamamla.',
    stat: 'craft',
    target: 100,
    rewardGold: 250,
  },
  {
    id: 'lake_regular',
    name: 'Nehrin Gediklisi',
    description: 'Toplam 40 balık yakala.',
    stat: 'fish',
    target: 40,
    rewardGold: 220,
  },
  {
    id: 'market_friend',
    name: 'Pazarın Tanıdığı',
    description: 'Satışlardan toplam 3.000 altın kazan.',
    stat: 'sell',
    target: 3000,
    rewardGold: 250,
  },
  {
    id: 'lively_barn',
    name: 'Şenlikli Ahır',
    description: 'Toplam 8 çiftlik hayvanı edin.',
    stat: 'animals',
    target: 8,
    rewardGold: 300,
  },
  {
    id: 'valley_guardian',
    name: 'Vadinin Bekçisi',
    description: 'Toplam 50 düşmanı yen.',
    stat: 'kills',
    target: 50,
    rewardGold: 350,
  },
  {
    id: 'better_every_day',
    name: 'Ustalığa Doğru',
    description: 'Toplam 6 geliştirme tamamla.',
    stat: 'upgrade',
    target: 6,
    rewardGold: 300,
  },
  {
    id: 'a_month_at_home',
    name: 'Otuz Günlük Yuva',
    description: '30 gün hayatta kal.',
    stat: 'days',
    target: 30,
    rewardGold: 400,
  },
];
