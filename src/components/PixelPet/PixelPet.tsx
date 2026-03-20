import React, { useState } from 'react';
import { X, Settings, RotateCcw } from 'lucide-react';
import { usePetState } from '../../hooks/usePetState';
import PetSprite from './PetSprite';
import PetStats from './PetStats';
import PetActions from './PetActions';
import PetSetup from './PetSetup';

interface PixelPetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PixelPet({ isOpen, onClose }: PixelPetProps) {
  const {
    pet,
    isLoading,
    createPet,
    feedPet,
    playWithPet,
    putPetToSleep,
    wakePet,
    resetPet,
  } = usePetState();

  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your pet? This cannot be undone.')) {
      resetPet();
      setShowSettings(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-80 bg-[#0d0d15] rounded-2xl border border-white/10 shadow-2xl shadow-purple-900/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🐾</span>
            <h2 className="text-sm font-bold text-white">Pixel Pet</h2>
          </div>
          <div className="flex items-center space-x-1">
            {pet && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin text-4xl">🥚</div>
            <p className="text-xs text-gray-400 mt-2">Loading...</p>
          </div>
        ) : !pet ? (
          <PetSetup onCreatePet={createPet} />
        ) : showSettings ? (
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-bold text-white">Settings</h3>
            <div className="space-y-2">
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Pet</span>
              </button>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Pet display */}
            <div className="flex justify-center py-2 bg-gradient-to-b from-white/5 to-transparent rounded-xl">
              <PetSprite
                species={pet.species}
                animation={pet.state}
                evolution={pet.evolution}
                size={72}
              />
            </div>

            {/* Pet stats */}
            <PetStats
              stats={pet.stats}
              evolution={pet.evolution}
              age={pet.age}
              name={pet.name}
            />

            {/* Actions */}
            <PetActions
              inventory={pet.inventory}
              currentState={pet.state}
              onFeed={feedPet}
              onPlay={playWithPet}
              onSleep={putPetToSleep}
              onWake={wakePet}
            />
          </div>
        )}
      </div>
    </div>
  );
}
