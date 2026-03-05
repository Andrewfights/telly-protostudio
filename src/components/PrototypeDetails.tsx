import React, { useState } from 'react';
import { ArrowLeft, Save, Trash2, Download, Share2, Check } from 'lucide-react';
import type { Prototype, ZoneId } from '../types';

interface PrototypeDetailsProps {
  prototype: Prototype;
  onBack: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  onDelete: () => void;
  onExport: () => void;
  onShare: () => void;
}

const ZONE_INFO: Record<ZoneId, { description: string; dimensions: string }> = {
  A: { description: 'Main Screen', dimensions: '1920x1080' },
  B: { description: 'Full Bottom Screen', dimensions: '1920x360' },
  C: { description: 'Bottom Left Widget', dimensions: '1280x300' },
  D: { description: 'Bottom Right Ad', dimensions: '640x300' },
  E: { description: 'News Ticker', dimensions: '1920x60' },
  F: { description: 'Combined C+D Area', dimensions: '1920x300' },
};

const PrototypeDetails: React.FC<PrototypeDetailsProps> = ({
  prototype,
  onBack,
  onSave,
  onDelete,
  onExport,
  onShare,
}) => {
  const [name, setName] = useState(prototype.name);
  const [description, setDescription] = useState(prototype.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const isDirty = name !== prototype.name || description !== (prototype.description || '');

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(name, description);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this prototype? This action cannot be undone.')) {
      onDelete();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getActiveZones = () => {
    return (['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]).filter(
      zone => prototype.zoneContent[zone]?.trim()
    );
  };

  return (
    <div className="flex-1 bg-[#111] overflow-auto">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-white/10 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Prototype Details</h1>
              <p className="text-sm text-gray-500">Edit metadata and view zone information</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onShare}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
            <button
              onClick={onExport}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving || !name.trim()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDirty && name.trim()
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              {savedMessage ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Basic Info */}
        <section className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Prototype Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter prototype name"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your prototype..."
                rows={4}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Zone Overview */}
        <section className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Zone Overview</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]).map((zone) => {
              const hasContent = prototype.zoneContent[zone]?.trim();
              const info = ZONE_INFO[zone];

              return (
                <div
                  key={zone}
                  className={`p-4 rounded-lg border ${
                    hasContent
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-bold ${hasContent ? 'text-blue-400' : 'text-gray-500'}`}>
                      Zone {zone}
                    </span>
                    {hasContent && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{info.description}</div>
                  <div className="text-xs text-gray-600 mt-1">{info.dimensions}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-500">
            {getActiveZones().length} of 6 zones have content
          </div>
        </section>

        {/* Metadata */}
        <section className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Metadata</h2>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-gray-500">Created</span>
              <p className="text-white mt-1">{formatDate(prototype.createdAt)}</p>
            </div>
            <div>
              <span className="text-gray-500">Last Updated</span>
              <p className="text-white mt-1">{formatDate(prototype.updatedAt)}</p>
            </div>
            <div>
              <span className="text-gray-500">Prototype ID</span>
              <p className="text-white mt-1 font-mono text-xs">{prototype.id}</p>
            </div>
            <div>
              <span className="text-gray-500">Favorite</span>
              <p className="text-white mt-1">{prototype.isFavorite ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 rounded-xl border border-red-500/20 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-400 mb-4">
            Permanently delete this prototype. This action cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Prototype</span>
          </button>
        </section>
      </div>
    </div>
  );
};

export default PrototypeDetails;
