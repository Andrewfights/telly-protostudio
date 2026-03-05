import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import type { LEDSettings, LEDPattern } from '../types';

interface LEDControlPanelProps {
  settings: LEDSettings;
  onChange: (settings: LEDSettings) => void;
  onGeneratePattern: () => void;
  isGenerating: boolean;
}

const PATTERNS: { id: LEDPattern; name: string; description: string }[] = [
  { id: 'solid', name: 'Solid', description: 'Static color' },
  { id: 'pulse', name: 'Pulse', description: 'Fade in/out' },
  { id: 'breathe', name: 'Breathe', description: 'Slow breathing effect' },
  { id: 'rainbow', name: 'Rainbow', description: 'Color cycling' },
  { id: 'wave', name: 'Wave', description: 'Moving wave pattern' },
  { id: 'custom', name: 'Custom', description: 'AI-generated' },
];

const PRESET_COLORS = [
  '#ff0000', '#ff6600', '#ffcc00', '#00ff00',
  '#00ffcc', '#0066ff', '#6600ff', '#ff00ff',
  '#ffffff', '#ff3366', '#00ff66', '#3366ff',
];

const LEDControlPanel: React.FC<LEDControlPanelProps> = ({
  settings,
  onChange,
  onGeneratePattern,
  isGenerating,
}) => {
  const updateSetting = <K extends keyof LEDSettings>(key: K, value: LEDSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="p-4 border-b border-white/10">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className={`w-4 h-4 ${settings.enabled ? 'text-yellow-400' : 'text-gray-500'}`} />
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Backlight LED
          </label>
        </div>
        <button
          onClick={() => updateSetting('enabled', !settings.enabled)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            settings.enabled ? 'bg-blue-600' : 'bg-white/10'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <div className="space-y-4">
          {/* Color picker */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={settings.color}
                onChange={(e) => updateSetting('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateSetting('color', color)}
                    className={`w-5 h-5 rounded-sm transition-transform hover:scale-110 ${
                      settings.color === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0a0a0a]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Brightness slider */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Brightness</span>
              <span>{settings.brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.brightness}
              onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>

          {/* Pattern selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">Pattern</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => updateSetting('pattern', pattern.id)}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${
                    settings.pattern === pattern.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  title={pattern.description}
                >
                  {pattern.name}
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider (for animated patterns) */}
          {settings.pattern !== 'solid' && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Speed</span>
                <span>{settings.speed}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.speed}
                onChange={(e) => updateSetting('speed', parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
              />
            </div>
          )}

          {/* AI Generate button */}
          <button
            onClick={onGeneratePattern}
            disabled={isGenerating}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'AI Generate Pattern'}</span>
          </button>

          {settings.pattern === 'custom' && settings.customCSS && (
            <div className="text-xs text-gray-500 bg-white/5 rounded p-2">
              <span className="text-purple-400">Custom pattern active</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LEDControlPanel;
