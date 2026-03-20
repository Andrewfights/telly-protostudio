import React, { useState } from 'react';
import type { PetItem, PetAnimationState } from '../../types/pet';

interface PetActionsProps {
  inventory: PetItem[];
  currentState: PetAnimationState;
  onFeed: (item: PetItem) => void;
  onPlay: (item: PetItem) => void;
  onSleep: () => void;
  onWake: () => void;
}

type ActionTab = 'feed' | 'play' | 'rest';

export default function PetActions({
  inventory,
  currentState,
  onFeed,
  onPlay,
  onSleep,
  onWake,
}: PetActionsProps) {
  const [activeTab, setActiveTab] = useState<ActionTab>('feed');

  const foodItems = inventory.filter(item => item.type === 'food');
  const toyItems = inventory.filter(item => item.type === 'toy');
  const isSleeping = currentState === 'sleep';
  const isBusy = currentState === 'eat' || currentState === 'play';

  const tabs: { id: ActionTab; label: string; icon: string }[] = [
    { id: 'feed', label: 'Feed', icon: '🍽️' },
    { id: 'play', label: 'Play', icon: '🎮' },
    { id: 'rest', label: 'Rest', icon: '😴' },
  ];

  return (
    <div className="space-y-3">
      {/* Tab buttons */}
      <div className="flex space-x-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[80px]">
        {activeTab === 'feed' && (
          <div className="grid grid-cols-4 gap-2">
            {foodItems.map(item => (
              <button
                key={item.id}
                onClick={() => onFeed(item)}
                disabled={isSleeping || isBusy}
                className="flex flex-col items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={`${item.name}: +${item.effect.amount} hunger`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] text-gray-400 mt-1">{item.name}</span>
              </button>
            ))}
            {foodItems.length === 0 && (
              <p className="col-span-4 text-xs text-gray-500 text-center py-4">
                No food items available
              </p>
            )}
          </div>
        )}

        {activeTab === 'play' && (
          <div className="grid grid-cols-4 gap-2">
            {toyItems.map(item => (
              <button
                key={item.id}
                onClick={() => onPlay(item)}
                disabled={isSleeping || isBusy}
                className="flex flex-col items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={`${item.name}: +${item.effect.amount} happiness`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] text-gray-400 mt-1">{item.name}</span>
              </button>
            ))}
            {toyItems.length === 0 && (
              <p className="col-span-4 text-xs text-gray-500 text-center py-4">
                No toys available
              </p>
            )}
          </div>
        )}

        {activeTab === 'rest' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            {isSleeping ? (
              <>
                <p className="text-sm text-gray-400">Your pet is sleeping... 💤</p>
                <button
                  onClick={onWake}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
                >
                  Wake Up
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">Put your pet to sleep to restore energy</p>
                <button
                  onClick={onSleep}
                  disabled={isBusy}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors disabled:opacity-50"
                >
                  Go to Sleep
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
