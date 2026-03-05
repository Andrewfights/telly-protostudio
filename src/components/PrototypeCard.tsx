import React from 'react';
import { Trash2, ExternalLink, Share2, Settings } from 'lucide-react';
import type { Prototype } from '../types';
import FavoriteButton from './FavoriteButton';

interface PrototypeCardProps {
  prototype: Prototype;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onEdit: () => void;
}

const PrototypeCard: React.FC<PrototypeCardProps> = ({
  prototype,
  onSelect,
  onDelete,
  onToggleFavorite,
  onShare,
  onEdit,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getZoneStatus = () => {
    const zones = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
    return zones.filter(zone => prototype.zoneContent[zone]?.trim()).length;
  };

  return (
    <div className="group bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
      {/* Thumbnail / Preview */}
      <div
        onClick={onSelect}
        className="relative aspect-video bg-[#0a0a0a] cursor-pointer overflow-hidden"
      >
        {prototype.thumbnail ? (
          <img
            src={prototype.thumbnail}
            alt={prototype.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-white/10 mb-2">
                {prototype.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex justify-center space-x-1">
                {(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((zone) => (
                  <div
                    key={zone}
                    className={`w-5 h-5 rounded text-xs flex items-center justify-center ${
                      prototype.zoneContent[zone]?.trim()
                        ? 'bg-blue-500/30 text-blue-400'
                        : 'bg-white/5 text-gray-600'
                    }`}
                  >
                    {zone}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center space-x-2 text-white">
            <ExternalLink className="w-5 h-5" />
            <span className="text-sm font-medium">Open</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{prototype.name}</h3>
            {prototype.description && (
              <p className="text-sm text-gray-400 truncate">{prototype.description}</p>
            )}
          </div>
          <FavoriteButton
            isFavorite={prototype.isFavorite || false}
            onClick={onToggleFavorite}
            size="sm"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(prototype.updatedAt)}</span>
          <span>{getZoneStatus()} zones</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Edit details"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this prototype?')) {
                onDelete();
              }
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrototypeCard;
