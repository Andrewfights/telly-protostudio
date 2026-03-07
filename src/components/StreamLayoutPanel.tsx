import React, { useState, useCallback, useEffect } from 'react';
import { Grid3X3, Play, X, Plus, Tv, Youtube, Link, Check, Monitor, PanelBottom, Save, FolderOpen, Trash2 } from 'lucide-react';
import type { StreamLayout, StreamLayoutPreset, StreamCell, VideoSourceConfig, ZoneId } from '../types';
import {
  createDefaultStreamLayout,
  getPresetConfig,
  createCellsForPreset,
  getPresetDisplayName,
  getVideoSourceName,
  generateStreamGridHTML,
  parseStreamLayoutFromHTML,
  isStreamLayout,
} from '../utils/streamLayoutUtils';
import VideoSourceModal from './VideoSourceModal';

interface SavedStreamPreset {
  id: string;
  name: string;
  layout: StreamLayout;
  screenPosition: 'top' | 'bottom';
  createdAt: string;
}

interface StreamLayoutPanelProps {
  selectedZone: ZoneId;
  currentZoneContent?: string;
  onApply: (html: string, zone: ZoneId) => void;
  onClose: () => void;
}

type ScreenPosition = 'top' | 'bottom';

const PRESETS: StreamLayoutPreset[] = ['full', '1x2', '1x3', '2x2', '2x3', '3x3'];
const STORAGE_KEY = 'telly-stream-presets';

// Load saved presets from localStorage
const loadSavedPresets = (): SavedStreamPreset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save presets to localStorage
const savePresetsToStorage = (presets: SavedStreamPreset[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
};

const StreamLayoutPanel: React.FC<StreamLayoutPanelProps> = ({
  selectedZone,
  currentZoneContent,
  onApply,
  onClose,
}) => {
  const [layout, setLayout] = useState<StreamLayout>(createDefaultStreamLayout('2x2'));
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [screenPosition, setScreenPosition] = useState<ScreenPosition>('top');
  const [savedPresets, setSavedPresets] = useState<SavedStreamPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showLoadPresets, setShowLoadPresets] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load saved presets on mount
  useEffect(() => {
    setSavedPresets(loadSavedPresets());
  }, []);

  // Check if current zone has an existing stream layout to edit
  useEffect(() => {
    if (currentZoneContent && isStreamLayout(currentZoneContent)) {
      const existingLayout = parseStreamLayoutFromHTML(currentZoneContent);
      if (existingLayout) {
        setLayout(existingLayout);
        setIsEditing(true);
        // Set screen position based on selected zone
        setScreenPosition(selectedZone === 'A' ? 'top' : 'bottom');
      }
    }
  }, [currentZoneContent, selectedZone]);

  // Save current layout as preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;

    const newPreset: SavedStreamPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      layout: { ...layout },
      screenPosition,
      createdAt: new Date().toISOString(),
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
    setPresetName('');
    setShowSaveDialog(false);
  }, [layout, screenPosition, presetName, savedPresets]);

  // Load a saved preset
  const handleLoadPreset = useCallback((preset: SavedStreamPreset) => {
    setLayout(preset.layout);
    setScreenPosition(preset.screenPosition);
    setShowLoadPresets(false);
    setSelectedCellId(null);
  }, []);

  // Delete a saved preset
  const handleDeletePreset = useCallback((presetId: string) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
  }, [savedPresets]);

  // Handle preset change
  const handlePresetChange = useCallback((preset: StreamLayoutPreset) => {
    const { rows, cols } = getPresetConfig(preset);
    setLayout({
      ...layout,
      preset,
      rows,
      cols,
      cells: createCellsForPreset(preset),
    });
    setSelectedCellId(null);
  }, [layout]);

  // Handle cell click
  const handleCellClick = useCallback((cellId: number) => {
    setSelectedCellId(cellId);
  }, []);

  // Handle video source selection
  const handleVideoSelect = useCallback((config: VideoSourceConfig, name: string) => {
    if (selectedCellId === null) return;

    setLayout((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.id === selectedCellId
          ? { ...cell, videoConfig: config, label: name }
          : cell
      ),
    }));
    setShowVideoModal(false);
  }, [selectedCellId]);

  // Handle global option changes
  const handleOptionChange = useCallback((key: keyof StreamLayout['globalOptions'], value: boolean | number) => {
    setLayout((prev) => ({
      ...prev,
      globalOptions: {
        ...prev.globalOptions,
        [key]: value,
      },
    }));
  }, []);

  // Clear cell
  const handleClearCell = useCallback(() => {
    if (selectedCellId === null) return;

    setLayout((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.id === selectedCellId
          ? { ...cell, videoConfig: undefined, label: `Cell ${cell.id + 1}` }
          : cell
      ),
    }));
  }, [selectedCellId]);

  // Apply layout
  const handleApply = useCallback(() => {
    const html = generateStreamGridHTML(layout);
    const targetZone: ZoneId = screenPosition === 'top' ? 'A' : 'B';
    onApply(html, targetZone);
  }, [layout, onApply, screenPosition]);

  const selectedCell = selectedCellId !== null
    ? layout.cells.find((c) => c.id === selectedCellId)
    : null;

  const filledCellCount = layout.cells.filter((c) => c.videoConfig).length;

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Grid3X3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Stream Layout</h2>
          {isEditing && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              Editing
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLoadPresets(!showLoadPresets)}
            className={`p-1.5 rounded-lg transition-colors ${
              showLoadPresets ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
            title="Load Saved Preset"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Save as Preset"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="p-4 bg-purple-900/20 border-b border-purple-500/20">
          <label className="block text-sm text-gray-300 mb-2">Save as Preset</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setPresetName('');
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Presets List */}
      {showLoadPresets && (
        <div className="p-4 bg-white/5 border-b border-white/10 max-h-48 overflow-y-auto">
          <label className="block text-sm text-gray-400 mb-2">Saved Presets ({savedPresets.length})</label>
          {savedPresets.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No saved presets yet</p>
          ) : (
            <div className="space-y-2">
              {savedPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 text-left"
                  >
                    <span className="text-sm text-white font-medium">{preset.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {preset.layout.preset} / {preset.screenPosition === 'top' ? 'Top' : 'Bottom'}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id);
                    }}
                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Screen Position Selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Screen Position</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScreenPosition('top')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                screenPosition === 'top'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="font-medium">Top Screen</span>
            </button>
            <button
              onClick={() => setScreenPosition('bottom')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                screenPosition === 'bottom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <PanelBottom className="w-4 h-4" />
              <span className="font-medium">Bottom Screen</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {screenPosition === 'top' ? 'Zone A (1920x1080) - Main display area' : 'Zone B (1920x360) - Bottom panel'}
          </p>
        </div>

        {/* Preset Selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Layout Preset</label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  layout.preset === preset
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {getPresetDisplayName(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Preview */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Grid Preview <span className="text-gray-600">({filledCellCount}/{layout.cells.length} cells configured)</span>
          </label>
          <div
            className="aspect-video bg-black rounded-lg overflow-hidden p-1"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
              gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
              gap: '4px',
            }}
          >
            {layout.cells.map((cell) => (
              <button
                key={cell.id}
                onClick={() => handleCellClick(cell.id)}
                className={`relative rounded overflow-hidden transition-all ${
                  selectedCellId === cell.id
                    ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-black'
                    : 'hover:ring-1 hover:ring-white/30'
                }`}
              >
                {cell.videoConfig ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 flex items-center justify-center">
                    {cell.videoConfig.type === 'youtube' ? (
                      <Youtube className="w-6 h-6 text-red-400" />
                    ) : cell.videoConfig.type === 'plutotv' ? (
                      <Tv className="w-6 h-6 text-blue-400" />
                    ) : (
                      <Link className="w-6 h-6 text-green-400" />
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <span className="text-[10px] text-gray-400 truncate block">
                    {cell.id + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Cell Config */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            {selectedCell ? `Cell ${selectedCell.id + 1} Configuration` : 'Select a cell to configure'}
          </label>
          <div className="space-y-2">
            <button
              onClick={() => selectedCellId !== null && setShowVideoModal(true)}
              disabled={selectedCellId === null}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{selectedCell?.videoConfig ? 'Change Video Source' : 'Add Video Source'}</span>
            </button>

            {selectedCell?.videoConfig && (
              <>
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-300 truncate">
                    {getVideoSourceName(selectedCell.videoConfig)}
                  </span>
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                </div>
                <button
                  onClick={handleClearCell}
                  className="w-full px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 text-sm transition-colors"
                >
                  Clear Cell
                </button>
              </>
            )}
          </div>
        </div>

        {/* Global Options */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Global Options</label>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
              <span className="text-sm text-gray-300">Autoplay All</span>
              <input
                type="checkbox"
                checked={layout.globalOptions.autoplay}
                onChange={(e) => handleOptionChange('autoplay', e.target.checked)}
                className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
              <span className="text-sm text-gray-300">Mute All</span>
              <input
                type="checkbox"
                checked={layout.globalOptions.muted}
                onChange={(e) => handleOptionChange('muted', e.target.checked)}
                className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
              <span className="text-sm text-gray-300">Show Controls</span>
              <input
                type="checkbox"
                checked={layout.globalOptions.controls}
                onChange={(e) => handleOptionChange('controls', e.target.checked)}
                className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
            </label>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Cell Gap</span>
                <span className="text-sm text-gray-500">{layout.globalOptions.gap}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                value={layout.globalOptions.gap}
                onChange={(e) => handleOptionChange('gap', parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleApply}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white font-medium transition-colors"
        >
          <Grid3X3 className="w-4 h-4" />
          <span>Apply to {screenPosition === 'top' ? 'Top Screen (Zone A)' : 'Bottom Screen (Zone B)'}</span>
        </button>
      </div>

      {/* Video Source Modal */}
      <VideoSourceModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onSelect={handleVideoSelect}
        loop={false}
      />
    </div>
  );
};

export default StreamLayoutPanel;
