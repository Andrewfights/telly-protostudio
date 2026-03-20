import React, { useEffect, useState } from 'react';
import type { PetSpecies, PetAnimationState, EvolutionStage } from '../../types/pet';

// Import sprite sheets
import catIdle from '../../assets/sprites/optimized/cat-idle.png';
import catWalk from '../../assets/sprites/optimized/cat-walk.png';
import catRun from '../../assets/sprites/optimized/cat-run.png';
import catJump from '../../assets/sprites/optimized/cat-jump.png';
import catSleep from '../../assets/sprites/optimized/cat-sleep.png';
import catHurt from '../../assets/sprites/optimized/cat-hurt.png';

import dogIdle from '../../assets/sprites/optimized/dog-idle.png';
import dogWalk from '../../assets/sprites/optimized/dog-walk.png';
import dogRun from '../../assets/sprites/optimized/dog-run.png';
import dogJump from '../../assets/sprites/optimized/dog-jump.png';
import dogSleep from '../../assets/sprites/optimized/dog-sleep.png';
import dogHurt from '../../assets/sprites/optimized/dog-hurt.png';

import bunnyIdle from '../../assets/sprites/optimized/bunny-idle.png';
import bunnyWalk from '../../assets/sprites/optimized/bunny-walk.png';
import bunnyRun from '../../assets/sprites/optimized/bunny-run.png';
import bunnyJump from '../../assets/sprites/optimized/bunny-jump.png';
import bunnySleep from '../../assets/sprites/optimized/bunny-sleep.png';
import bunnyHurt from '../../assets/sprites/optimized/bunny-hurt.png';

interface PetSpriteProps {
  species: PetSpecies;
  animation: PetAnimationState;
  evolution: EvolutionStage;
  size?: number;
}

// Sprite configuration for each species
interface SpriteConfig {
  sprite: string;
  frameWidth: number;
  frameCount: number;
  frameDuration: number; // ms per frame
}

// Map animation states to sprite sheets and configs
const SPRITE_CONFIGS: Record<PetSpecies, Record<string, SpriteConfig>> = {
  cat: {
    idle: { sprite: catIdle, frameWidth: 110, frameCount: 10, frameDuration: 100 },
    walk: { sprite: catWalk, frameWidth: 110, frameCount: 10, frameDuration: 80 },
    play: { sprite: catRun, frameWidth: 110, frameCount: 8, frameDuration: 60 },
    eat: { sprite: catJump, frameWidth: 110, frameCount: 8, frameDuration: 100 },
    sleep: { sprite: catSleep, frameWidth: 110, frameCount: 5, frameDuration: 200 },
    happy: { sprite: catJump, frameWidth: 110, frameCount: 8, frameDuration: 80 },
    sad: { sprite: catHurt, frameWidth: 110, frameCount: 5, frameDuration: 150 },
    sick: { sprite: catHurt, frameWidth: 110, frameCount: 5, frameDuration: 200 },
  },
  dog: {
    idle: { sprite: dogIdle, frameWidth: 109, frameCount: 10, frameDuration: 100 },
    walk: { sprite: dogWalk, frameWidth: 109, frameCount: 10, frameDuration: 80 },
    play: { sprite: dogRun, frameWidth: 109, frameCount: 8, frameDuration: 60 },
    eat: { sprite: dogJump, frameWidth: 109, frameCount: 8, frameDuration: 100 },
    sleep: { sprite: dogSleep, frameWidth: 109, frameCount: 5, frameDuration: 200 },
    happy: { sprite: dogJump, frameWidth: 109, frameCount: 8, frameDuration: 80 },
    sad: { sprite: dogHurt, frameWidth: 109, frameCount: 5, frameDuration: 150 },
    sick: { sprite: dogHurt, frameWidth: 109, frameCount: 5, frameDuration: 200 },
  },
  bunny: {
    idle: { sprite: bunnyIdle, frameWidth: 24, frameCount: 6, frameDuration: 120 },
    walk: { sprite: bunnyWalk, frameWidth: 24, frameCount: 6, frameDuration: 100 },
    play: { sprite: bunnyRun, frameWidth: 24, frameCount: 6, frameDuration: 80 },
    eat: { sprite: bunnyJump, frameWidth: 24, frameCount: 6, frameDuration: 100 },
    sleep: { sprite: bunnySleep, frameWidth: 24, frameCount: 6, frameDuration: 200 },
    happy: { sprite: bunnyJump, frameWidth: 24, frameCount: 6, frameDuration: 80 },
    sad: { sprite: bunnyHurt, frameWidth: 24, frameCount: 6, frameDuration: 150 },
    sick: { sprite: bunnyHurt, frameWidth: 24, frameCount: 6, frameDuration: 200 },
  },
};

// Evolution scale factors
const EVOLUTION_SCALE: Record<EvolutionStage, number> = {
  egg: 0.5,
  baby: 0.7,
  teen: 0.85,
  adult: 1,
  elder: 1.1,
};

export default function PetSprite({ species, animation, evolution, size = 96 }: PetSpriteProps) {
  const [frame, setFrame] = useState(0);

  // Get the config for this animation, fallback to idle
  const config = SPRITE_CONFIGS[species][animation] || SPRITE_CONFIGS[species].idle;
  const scale = EVOLUTION_SCALE[evolution];

  // Frame animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % config.frameCount);
    }, config.frameDuration);

    return () => clearInterval(interval);
  }, [config.frameCount, config.frameDuration]);

  // Reset frame when animation changes
  useEffect(() => {
    setFrame(0);
  }, [animation]);

  // Calculate sprite display size
  const displayHeight = size * scale;
  const aspectRatio = config.frameWidth / 96; // Original height is 96
  const displayWidth = displayHeight * aspectRatio;

  // For egg stage, show a simple egg emoji
  if (evolution === 'egg') {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="animate-pulse"
          style={{ fontSize: size * 0.6 }}
        >
          🥚
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size * 1.2, height: size * 1.2 }}
    >
      {/* Main sprite */}
      <div
        style={{
          width: displayWidth,
          height: displayHeight,
          backgroundImage: `url(${config.sprite})`,
          backgroundPosition: `-${frame * config.frameWidth * (displayWidth / config.frameWidth)}px 0`,
          backgroundSize: `${config.frameCount * displayWidth}px ${displayHeight}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: animation === 'sick' ? 'hue-rotate(60deg) saturate(0.7)' :
                  animation === 'sad' ? 'saturate(0.5)' :
                  animation === 'sleep' ? 'brightness(0.7)' : 'none',
          transform: animation === 'sleep' ? 'rotate(-10deg)' : 'none',
          transition: 'filter 0.3s, transform 0.3s',
        }}
      />

      {/* State indicators */}
      {animation === 'sleep' && (
        <span className="absolute -top-2 -right-2 text-lg animate-bounce">💤</span>
      )}
      {animation === 'eat' && (
        <span className="absolute -top-1 right-0 text-sm animate-ping">✨</span>
      )}
      {animation === 'play' && (
        <span className="absolute -top-2 -right-1 text-sm animate-spin">⭐</span>
      )}
      {animation === 'happy' && (
        <span className="absolute -top-3 right-0 text-sm animate-pulse">💕</span>
      )}
      {animation === 'sad' && (
        <span className="absolute bottom-2 left-0 text-xs animate-bounce">💧</span>
      )}
      {animation === 'sick' && (
        <span className="absolute -top-2 -right-2 text-lg">🤒</span>
      )}
    </div>
  );
}
