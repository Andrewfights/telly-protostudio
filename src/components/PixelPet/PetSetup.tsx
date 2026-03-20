import React, { useState } from 'react';
import type { PetSpecies } from '../../types/pet';

interface PetSetupProps {
  onCreatePet: (name: string, species: PetSpecies) => void;
}

const SPECIES_OPTIONS: { id: PetSpecies; emoji: string; label: string }[] = [
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'bunny', emoji: '🐰', label: 'Bunny' },
];

export default function PetSetup({ onCreatePet }: PetSetupProps) {
  const [name, setName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>('cat');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreatePet(name.trim(), selectedSpecies);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-1">Create Your Pet!</h3>
        <p className="text-xs text-gray-400">Choose a species and give your pet a name</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Species selection */}
        <div className="grid grid-cols-3 gap-2">
          {SPECIES_OPTIONS.map(species => (
            <button
              key={species.id}
              type="button"
              onClick={() => setSelectedSpecies(species.id)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                selectedSpecies === species.id
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0a0a0a]'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <span className="text-4xl mb-1">{species.emoji}</span>
              <span className="text-sm font-medium">{species.label}</span>
            </button>
          ))}
        </div>

        {/* Name input */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Pet Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter a name..."
            maxLength={12}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
          />
        </div>

        {/* Create button */}
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Hatch Your Pet! 🥚
        </button>
      </form>
    </div>
  );
}
