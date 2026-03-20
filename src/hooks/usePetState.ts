import { useState, useEffect, useCallback } from 'react';
import type {
  Pet,
  PetAnimationState,
  PetStats,
  PetItem,
  EvolutionStage,
  PetSpecies,
} from '../types/pet';
import {
  createNewPet,
  STAT_DECAY_RATES,
  EVOLUTION_THRESHOLDS,
} from '../types/pet';

const STORAGE_KEY = 'telly_pixel_pet';
const DECAY_INTERVAL = 60000; // Check every minute

interface UsePetStateReturn {
  pet: Pet | null;
  isLoading: boolean;
  createPet: (name: string, species: PetSpecies) => void;
  feedPet: (item: PetItem) => void;
  playWithPet: (item: PetItem) => void;
  putPetToSleep: () => void;
  wakePet: () => void;
  resetPet: () => void;
  getCurrentAnimation: () => PetAnimationState;
}

export function usePetState(): UsePetStateReturn {
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load pet from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedPet = JSON.parse(stored) as Pet;
        // Calculate stat decay since last session
        const decayedPet = applyOfflineDecay(parsedPet);
        setPet(decayedPet);
      } catch (e) {
        console.error('Failed to parse pet data:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save pet to localStorage whenever it changes
  useEffect(() => {
    if (pet) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
    }
  }, [pet]);

  // Stat decay over time
  useEffect(() => {
    if (!pet || pet.state === 'sleep') return;

    const interval = setInterval(() => {
      setPet(currentPet => {
        if (!currentPet || currentPet.state === 'sleep') return currentPet;

        const newStats: PetStats = {
          hunger: Math.max(0, currentPet.stats.hunger - STAT_DECAY_RATES.hunger),
          happiness: Math.max(0, currentPet.stats.happiness - STAT_DECAY_RATES.happiness),
          energy: Math.max(0, currentPet.stats.energy - STAT_DECAY_RATES.energy),
        };

        // Determine new state based on stats
        const newState = determineState(newStats, currentPet.state);

        // Check for evolution
        const newEvolution = checkEvolution(currentPet);

        return {
          ...currentPet,
          stats: newStats,
          state: newState,
          evolution: newEvolution,
        };
      });
    }, DECAY_INTERVAL);

    return () => clearInterval(interval);
  }, [pet?.state]);

  // Apply decay for time spent offline
  const applyOfflineDecay = (storedPet: Pet): Pet => {
    const now = new Date();
    const lastUpdate = new Date(storedPet.lastFed);
    const minutesOffline = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);

    if (minutesOffline <= 0) return storedPet;

    // Cap decay at 8 hours (480 minutes) to be fair
    const cappedMinutes = Math.min(minutesOffline, 480);

    const decayedStats: PetStats = {
      hunger: Math.max(0, storedPet.stats.hunger - (STAT_DECAY_RATES.hunger * cappedMinutes)),
      happiness: Math.max(0, storedPet.stats.happiness - (STAT_DECAY_RATES.happiness * cappedMinutes)),
      energy: Math.max(0, storedPet.stats.energy - (STAT_DECAY_RATES.energy * cappedMinutes)),
    };

    // Calculate age in days
    const ageInDays = Math.floor(
      (now.getTime() - new Date(storedPet.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...storedPet,
      stats: decayedStats,
      state: determineState(decayedStats, storedPet.state),
      age: ageInDays,
    };
  };

  // Determine pet state based on stats
  const determineState = (stats: PetStats, currentState: PetAnimationState): PetAnimationState => {
    // Keep sleep state if sleeping
    if (currentState === 'sleep') return 'sleep';

    // Sick if any stat is critically low
    if (stats.hunger < 20 || stats.happiness < 20 || stats.energy < 20) {
      return 'sick';
    }

    // Sad if stats are low
    if (stats.hunger < 40 || stats.happiness < 40) {
      return 'sad';
    }

    // Happy if all stats are high
    if (stats.hunger > 80 && stats.happiness > 80 && stats.energy > 60) {
      return 'happy';
    }

    return 'idle';
  };

  // Check if pet should evolve
  const checkEvolution = (currentPet: Pet): EvolutionStage => {
    const stages: EvolutionStage[] = ['egg', 'baby', 'teen', 'adult', 'elder'];
    const currentIndex = stages.indexOf(currentPet.evolution);

    if (currentIndex >= stages.length - 1) return currentPet.evolution;

    const nextStage = stages[currentIndex + 1];
    const threshold = EVOLUTION_THRESHOLDS[nextStage];

    if (currentPet.age >= threshold.minAge && currentPet.totalCarePoints >= threshold.minCare) {
      return nextStage;
    }

    return currentPet.evolution;
  };

  const createPet = useCallback((name: string, species: PetSpecies) => {
    const newPet = createNewPet(name, species);
    setPet(newPet);
  }, []);

  const feedPet = useCallback((item: PetItem) => {
    if (!pet || item.type !== 'food') return;

    setPet(currentPet => {
      if (!currentPet) return currentPet;

      const newHunger = Math.min(100, currentPet.stats.hunger + item.effect.amount);
      const now = new Date().toISOString();

      return {
        ...currentPet,
        stats: {
          ...currentPet.stats,
          hunger: newHunger,
        },
        state: 'eat',
        lastFed: now,
        totalCarePoints: currentPet.totalCarePoints + item.effect.amount,
      };
    });

    // Return to idle after eating animation
    setTimeout(() => {
      setPet(currentPet => {
        if (!currentPet || currentPet.state !== 'eat') return currentPet;
        return {
          ...currentPet,
          state: determineState(currentPet.stats, 'idle'),
        };
      });
    }, 2000);
  }, [pet]);

  const playWithPet = useCallback((item: PetItem) => {
    if (!pet || item.type !== 'toy') return;

    setPet(currentPet => {
      if (!currentPet) return currentPet;

      const newHappiness = Math.min(100, currentPet.stats.happiness + item.effect.amount);
      const newEnergy = Math.max(0, currentPet.stats.energy - 5); // Playing uses energy
      const now = new Date().toISOString();

      return {
        ...currentPet,
        stats: {
          ...currentPet.stats,
          happiness: newHappiness,
          energy: newEnergy,
        },
        state: 'play',
        lastPlayed: now,
        totalCarePoints: currentPet.totalCarePoints + item.effect.amount,
      };
    });

    // Return to idle after play animation
    setTimeout(() => {
      setPet(currentPet => {
        if (!currentPet || currentPet.state !== 'play') return currentPet;
        return {
          ...currentPet,
          state: determineState(currentPet.stats, 'idle'),
        };
      });
    }, 3000);
  }, [pet]);

  const putPetToSleep = useCallback(() => {
    if (!pet) return;

    setPet(currentPet => {
      if (!currentPet) return currentPet;

      const now = new Date().toISOString();

      return {
        ...currentPet,
        state: 'sleep',
        lastSlept: now,
      };
    });
  }, [pet]);

  const wakePet = useCallback(() => {
    if (!pet || pet.state !== 'sleep') return;

    setPet(currentPet => {
      if (!currentPet) return currentPet;

      // Restore energy when waking up
      const sleepDuration = Date.now() - new Date(currentPet.lastSlept).getTime();
      const minutesSlept = sleepDuration / 60000;
      const energyRestored = Math.min(minutesSlept * 2, 100 - currentPet.stats.energy);

      return {
        ...currentPet,
        stats: {
          ...currentPet.stats,
          energy: Math.min(100, currentPet.stats.energy + energyRestored),
        },
        state: 'idle',
        totalCarePoints: currentPet.totalCarePoints + Math.floor(energyRestored / 2),
      };
    });
  }, [pet]);

  const resetPet = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPet(null);
  }, []);

  const getCurrentAnimation = useCallback((): PetAnimationState => {
    if (!pet) return 'idle';
    return pet.state;
  }, [pet]);

  return {
    pet,
    isLoading,
    createPet,
    feedPet,
    playWithPet,
    putPetToSleep,
    wakePet,
    resetPet,
    getCurrentAnimation,
  };
}
