import React from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ isFavorite, onClick, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${padding} rounded-lg transition-all ${
        isFavorite
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-red-400'
      }`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`${sizeClasses} ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
};

export default FavoriteButton;
