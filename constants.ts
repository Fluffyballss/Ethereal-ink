
import { CharacterClass, Item, Location, Rarity, Pet, LootItem } from './types';

export const CLASSES: CharacterClass[] = [
  {
    id: 'warrior',
    name: '방패지기',
    description: '강인한 힘과 인내심으로 아군을 보호하는 정예 보병입니다.',
    stats: { strength: 15, intelligence: 8, dexterity: 10 },
    icon: '⚔️'
  },
  {
    id: 'mage',
    name: '에테르 학자',
    description: '보이지 않는 예술의 탐구자로, 지성을 이용해 현실을 뒤틉니다.',
    stats: { strength: 6, intelligence: 16, dexterity: 11 },
    icon: '✨'
  },
  {
    id: 'rogue',
    name: '그림자 추적자',
    description: '민첩함과 정밀함의 대가로, 어둠 속에서 가장 강력한 위력을 발휘합니다.',
    stats: { strength: 9, intelligence: 10, dexterity: 15 },
    icon: '🗡️'
  },
  {
    id: 'paladin',
    name: '신성한 맹약자',
    description: '빛의 맹세를 수호하며, 정의로운 힘으로 적을 심판합니다.',
    stats: { strength: 13, intelligence: 12, dexterity: 8 },
    icon: '🛡️'
  },
  {
    id: 'archer',
    name: '숲의 파수꾼',
    description: '자연의 부름을 듣고 먼 거리에서 필멸의 화살을 날립니다.',
    stats: { strength: 8, intelligence: 10, dexterity: 16 },
    icon: '🏹'
  },
  {
    id: 'bard',
    name: '영혼의 연주자',
    description: '선율 속에 마력을 실어 아군을 독려하고 적을 교란합니다.',
    stats: { strength: 7, intelligence: 14, dexterity: 13 },
    icon: '🎻'
  }
];

export const PETS: Pet[] = [
  {
    id: 'owl',
    name: '유령 부엉이',
    description: '지혜의 상징이며 주인의 정신 집중을 돕습니다.',
    icon: '🦉',
    effectDescription: '지능 판정 시 보너스 +2',
    bonus: { stat: 'intelligence', value: 2 }
  },
  {
    id: 'hound',
    name: '황금 사냥개',
    description: '용맹하고 충성스러운 동반자로 힘든 전투를 돕습니다.',
    icon: '🐕',
    effectDescription: '힘 판정 시 보너스 +2',
    bonus: { stat: 'strength', value: 2 }
  },
  {
    id: 'cat',
    name: '그림자 고양이',
    description: '어둠 속을 소리 없이 누비며 주인의 발걸음을 가볍게 합니다.',
    icon: '🐈',
    effectDescription: '민첩 판정 시 보너스 +2',
    bonus: { stat: 'dexterity', value: 2 }
  },
  {
    id: 'dragon',
    name: '작은 불용',
    description: '강력한 마력의 편린으로 주인의 생명력을 보호합니다.',
    icon: '🐲',
    effectDescription: '최대 생명력 +10',
    bonus: { value: 10 }
  }
];

export const SHOP_ITEMS: LootItem[] = [
  {
    id: 'shop_1',
    name: '강철 판금 갑옷',
    description: '어떤 칼날도 뚫기 힘든 견고한 갑옷입니다.',
    rarity: '희귀',
    type: '방어구',
    statBonuses: { strength: 3 },
    price: 150
  },
  {
    id: 'shop_2',
    name: '지혜의 서클릿',
    description: '착용자의 정신을 맑게 해주는 고대 마법 물품입니다.',
    rarity: '매우 희귀',
    type: '장신구',
    statBonuses: { intelligence: 5 },
    price: 300
  },
  {
    id: 'shop_3',
    name: '바람의 장화',
    description: '구름 위를 걷는 듯한 가벼움을 선사합니다.',
    rarity: '희귀',
    type: '장신구',
    statBonuses: { dexterity: 3 },
    price: 180
  },
  {
    id: 'shop_4',
    name: '파괴의 대검',
    description: '거대한 바위도 단숨에 으스러뜨리는 파괴적인 무기입니다.',
    rarity: '전설',
    type: '무기',
    statBonuses: { strength: 8 },
    price: 600
  }
];

export const RARITY_COLORS: Record<Rarity, string> = {
  '보통': '#9ca3af',
  '희귀': '#3b82f6',
  '매우 희귀': '#a855f7',
  '전설': '#f59e0b',
  '신화': '#ef4444'
};

export const ITEMS: Item[] = [
  { id: 'lamp', name: '영원의 등불', description: '절대 꺼지지 않으며 숨겨진 흔적을 드러내는 신비한 등불입니다.' },
  { id: 'rope', name: '실크 밧줄', description: '강철보다 강하지만 깃털처럼 가벼운 마법의 밧줄입니다.' },
  { id: 'vial', name: '황금 엘릭서', description: '깊은 상처를 즉시 치유하는 전설적인 물약입니다.' },
  { id: 'key', name: '만능 열쇠', description: '인간이 만든 어떤 자물쇠든 열 수 있다고 전해집니다.' },
  { id: 'compass', name: '별무리 나침반', description: '북쪽 대신 사용자의 운명이 향하는 길을 가리킵니다.' },
  { id: 'herb', name: '꿈의 잎사귀', description: '태우면 예지력을 얻을 수 있는 환각을 일으킵니다.' },
  { id: 'dagger', name: '뼈 단검', description: '고대 괴수의 뼈로 깎아 만든, 상상할 수 없을 만큼 날카로운 단검입니다.' },
  { id: 'cloak', name: '안개 망토', description: '희미한 빛 아래에서 착용자의 실루엣을 흐릿하게 만듭니다.' }
];

export const LOCATIONS: Location[] = [
  { id: 'ruins', name: '침몰한 성소', icon: '🏛️', x: 25, y: 30, description: '한때 경배의 대상이었으나 이제는 바다에 잠긴 고대의 사원입니다.' },
  { id: 'forest', name: '속삭이는 숲', icon: '🌲', x: 65, y: 25, description: '나무들이 이해할 수 없는 언어로 속삭이는 신비한 숲입니다.' },
  { id: 'mountains', name: '강철 이빨 산맥', icon: '🏔️', x: 80, y: 70, description: '용들이 둥지를 틀었다고 전해지는 험준하고 가파른 절벽지대입니다.' },
  { id: 'citadel', name: '칠흑의 요새', icon: '🏰', x: 15, y: 75, description: '영원한 겨울에 갇힌, 검은 돌로 지어진 거대한 요새입니다.' }
];
