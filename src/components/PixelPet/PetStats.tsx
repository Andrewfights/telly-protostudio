import React from 'react';
import type { PetStats as PetStatsType, EvolutionStage } from '../../types/pet';

interface PetStatsProps {
  stats: PetStatsType;
  evolution: EvolutionStage;
  age: number;
  name: string;
}

const EVOLUTION_LABELS: Record<EvolutionStage, string> = {
  egg: 'Egg',
  baby: 'Baby',
  teen: 'Teen',
  adult: 'Adult',
  elder: 'Elder',
};

function StatBar({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const getBarColor = () => {
    if (value > 60) return color;
    if (value > 30) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm w-5">{icon}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${value}%`,
            backgroundColor: getBarColor(),
          }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

export default function PetStats({ stats, evolution, age, name }: PetStatsProps) {
  return (
    <div className="space-y-3">
      {/* Pet name and evolution */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">{name}</h3>
          <p className="text-xs text-gray-400">
            {EVOLUTION_LABELS[evolution]} • Day {age + 1}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          {['egg', 'baby', 'teen', 'adult', 'elder'].map((stage, idx) => {
            const isReached = ['egg', 'baby', 'teen', 'adult', 'elder'].indexOf(evolution) >= idx;
            return (
              <div
                key={stage}
                className={`w-2 h-2 rounded-full ${
                  isReached ? 'bg-purple-500' : 'bg-white/20'
                }`}
                title={stage}
              />
            );
          })}
        </div>
      </div>

      {/* Stat bars */}
      <div className="space-y-2">
        <StatBar label="Hunger" value={stats.hunger} icon="🍖" color="#22c55e" />
        <StatBar label="Happiness" value={stats.happiness} icon="💖" color="#ec4899" />
        <StatBar label="Energy" value={stats.energy} icon="⚡" color="#3b82f6" />
      </div>
    </div>
  );
}
