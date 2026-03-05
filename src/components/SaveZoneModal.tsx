import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { ZoneId } from '../types';

interface SaveZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  zoneId: ZoneId;
  zoneContent: string;
}

const ZONE_DESCRIPTIONS: Record<ZoneId, string> = {
  A: 'Main Screen (1920x1080)',
  B: 'Full Bottom Screen (1920x360)',
  C: 'Bottom Left Widget (1280x300)',
  D: 'Bottom Right Ad Block (640x300)',
  E: 'News Ticker (1920x60)',
  F: 'Combined C+D Area (1920x300)',
};

const SaveZoneModal: React.FC<SaveZoneModalProps> = ({
  isOpen,
  onClose,
  onSave,
  zoneId,
  zoneContent,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!zoneContent.trim()) {
      setError('Zone has no content to save');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save zone template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Save Zone Template</h2>
            <p className="text-sm text-gray-400 mt-1">Zone {zoneId}: {ZONE_DESCRIPTIONS[zoneId]}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this template"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template contains..."
              rows={3}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Preview
            </label>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3 h-32 overflow-auto">
              <pre className="text-xs text-gray-500 whitespace-pre-wrap break-all">
                {zoneContent.substring(0, 500)}
                {zoneContent.length > 500 && '...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !zoneContent.trim()}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveZoneModal;
