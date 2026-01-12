
export enum GamePhase {
  CLASS_SELECT,
  PET_SELECT,
  ITEM_SELECT,
  WORLD_MAP,
  ADVENTURE,
  VEO_ANIMATOR
}

export type Rarity = '보통' | '희귀' | '매우 희귀' | '전설' | '신화';

export interface StatBonuses {
  strength?: number;
  intelligence?: number;
  dexterity?: number;
}

export interface LootItem {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  statBonuses: StatBonuses;
  type: '무기' | '방어구' | '장신구';
  price?: number;
}

export interface Pet {
  id: string;
  name: string;
  description: string;
  icon: string;
  effectDescription: string;
  bonus?: {
    stat?: keyof StatBonuses;
    value: number;
  };
}

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  stats: {
    strength: number;
    intelligence: number;
    dexterity: number;
  };
  icon: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
}

export interface SpecialInteraction {
  type: 'quiz' | 'dialogue';
  question?: string; // For quiz
  answer?: string;   // For quiz
  npcName?: string;  // For dialogue
  npcPersonality?: string; // For dialogue
  npcDialogue?: string;    // For dialogue
}

export interface GameState {
  characterClass: CharacterClass | null;
  selectedItems: Item[];
  pet: Pet | null;
  inventory: LootItem[];
  equipped: {
    무기?: LootItem;
    방어구?: LootItem;
    장신구?: LootItem;
  };
  location: string | null;
  history: LogEntry[];
  hp: number;
  maxHp: number;
  karma: number; // -100 to 100
  gold: number;
}

export interface LogEntry {
  type: 'narrative' | 'action' | 'roll' | 'outcome' | 'choice';
  text: string;
  timestamp: number;
  success?: boolean;
}

export interface Location {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  description: string;
}
