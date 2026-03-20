// Pet species available
export type PetSpecies = 'cat' | 'dog' | 'bunny';

// Pet animation states
export type PetAnimationState =
  | 'idle'
  | 'walk'
  | 'eat'
  | 'play'
  | 'sleep'
  | 'happy'
  | 'sad'
  | 'sick';

// Evolution stages
export type EvolutionStage = 'egg' | 'baby' | 'teen' | 'adult' | 'elder';

// Pet stats
export interface PetStats {
  hunger: number;    // 0-100, lower is hungrier
  happiness: number; // 0-100
  energy: number;    // 0-100
}

// Inventory item types
export type ItemType = 'food' | 'toy' | 'decoration';

// Inventory item definition
export interface PetItem {
  id: string;
  name: string;
  type: ItemType;
  icon: string;       // Emoji or sprite reference
  effect: {
    stat: keyof PetStats;
    amount: number;
  };
  description: string;
}

// Pet data structure
export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  state: PetAnimationState;
  stats: PetStats;
  evolution: EvolutionStage;
  age: number;           // Days since creation
  totalCarePoints: number; // Accumulated care quality
  inventory: PetItem[];
  createdAt: string;
  lastFed: string;
  lastPlayed: string;
  lastSlept: string;
}

// Pet configuration for sprite animations
export interface PetSpriteConfig {
  species: PetSpecies;
  frameWidth: number;
  frameHeight: number;
  animations: {
    [K in PetAnimationState]: {
      row: number;          // Row in sprite sheet
      frames: number;       // Number of frames
      duration: number;     // Total animation duration in ms
      loop: boolean;
    };
  };
}

// Default items available in the shop/rewards
export const DEFAULT_ITEMS: PetItem[] = [
  // Food items
  {
    id: 'apple',
    name: 'Apple',
    type: 'food',
    icon: '🍎',
    effect: { stat: 'hunger', amount: 15 },
    description: 'A fresh, crunchy apple',
  },
  {
    id: 'fish',
    name: 'Fish',
    type: 'food',
    icon: '🐟',
    effect: { stat: 'hunger', amount: 25 },
    description: 'Delicious grilled fish',
  },
  {
    id: 'cake',
    name: 'Cake',
    type: 'food',
    icon: '🍰',
    effect: { stat: 'hunger', amount: 40 },
    description: 'Special birthday cake',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    type: 'food',
    icon: '🥕',
    effect: { stat: 'hunger', amount: 20 },
    description: 'Bunny\'s favorite snack',
  },
  // Toy items
  {
    id: 'ball',
    name: 'Ball',
    type: 'toy',
    icon: '⚽',
    effect: { stat: 'happiness', amount: 20 },
    description: 'A bouncy play ball',
  },
  {
    id: 'yarn',
    name: 'Yarn',
    type: 'toy',
    icon: '🧶',
    effect: { stat: 'happiness', amount: 25 },
    description: 'Cats love yarn!',
  },
  {
    id: 'bone',
    name: 'Bone',
    type: 'toy',
    icon: '🦴',
    effect: { stat: 'happiness', amount: 25 },
    description: 'A chew toy for dogs',
  },
  {
    id: 'feather',
    name: 'Feather',
    type: 'toy',
    icon: '🪶',
    effect: { stat: 'happiness', amount: 15 },
    description: 'A colorful feather toy',
  },
];

// Evolution thresholds
export const EVOLUTION_THRESHOLDS: Record<EvolutionStage, { minAge: number; minCare: number }> = {
  egg: { minAge: 0, minCare: 0 },
  baby: { minAge: 1, minCare: 50 },
  teen: { minAge: 3, minCare: 200 },
  adult: { minAge: 7, minCare: 500 },
  elder: { minAge: 14, minCare: 1000 },
};

// Stat decay rates (per minute)
export const STAT_DECAY_RATES: Record<keyof PetStats, number> = {
  hunger: 0.5,    // Loses 0.5 hunger per minute
  happiness: 0.3, // Loses 0.3 happiness per minute
  energy: 0.2,    // Loses 0.2 energy per minute
};

// Create a new pet
export function createNewPet(name: string, species: PetSpecies): Pet {
  const now = new Date().toISOString();
  return {
    id: `pet_${Date.now()}`,
    name,
    species,
    state: 'idle',
    stats: {
      hunger: 100,
      happiness: 100,
      energy: 100,
    },
    evolution: 'egg',
    age: 0,
    totalCarePoints: 0,
    inventory: [...DEFAULT_ITEMS.slice(0, 4)], // Start with some items
    createdAt: now,
    lastFed: now,
    lastPlayed: now,
    lastSlept: now,
  };
}
