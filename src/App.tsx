import React, { useState, useEffect } from 'react';
import { Send, Download, Code, Sparkles, RefreshCw, Layers, Library, Save, Share2, Settings, FolderOpen, BookMarked, Image, Video, Music, Upload } from 'lucide-react';
import TellyDevice from './components/TellyDevice';
import PrototypeLibrary from './components/PrototypeLibrary';
import PrototypeDetails from './components/PrototypeDetails';
import SaveModal from './components/SaveModal';
import ExportModal from './components/ExportModal';
import ShareModal from './components/ShareModal';
import ImportModal from './components/ImportModal';
import SaveZoneModal from './components/SaveZoneModal';
import LoadZoneModal from './components/LoadZoneModal';
import LEDControlPanel from './components/LEDControlPanel';
import { generateZoneCode, generateLEDPattern } from './services/aiService';
import { createPrototype, updatePrototype, getSharedPrototype, createZoneTemplate, deletePrototype } from './services/apiService';
import type { ZoneId, ZoneContent, Prototype, ChatMessage, LEDSettings } from './types';

const INITIAL_ZONE_CONTENT: ZoneContent = {
  A: '',
  B: '',
  C: '',
  D: '',
  E: '',
  F: '',
};

const INITIAL_LED_SETTINGS: LEDSettings = {
  enabled: false,
  color: '#6366f1',
  brightness: 70,
  pattern: 'solid',
  speed: 5,
};

type GenerationMode = 'code' | 'image' | 'video' | 'music';

export default function App() {
  // View state
  const [view, setView] = useState<'editor' | 'library' | 'details'>('editor');
  const [detailsPrototype, setDetailsPrototype] = useState<Prototype | null>(null);

  // Current prototype state
  const [currentPrototype, setCurrentPrototype] = useState<Prototype | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneId>('A');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoneContent, setZoneContent] = useState<ZoneContent>(INITIAL_ZONE_CONTENT);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // LED state
  const [ledSettings, setLedSettings] = useState<LEDSettings>(INITIAL_LED_SETTINGS);
  const [isGeneratingLED, setIsGeneratingLED] = useState(false);

  // Generation mode (code vs content)
  const [generationMode, setGenerationMode] = useState<GenerationMode>('code');

  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaveZoneModal, setShowSaveZoneModal] = useState(false);
  const [showLoadZoneModal, setShowLoadZoneModal] = useState(false);
  const [sharePrototype, setSharePrototype] = useState<Prototype | null>(null);

  // Check for shared prototype in URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const code = path.replace('/share/', '');
      loadSharedPrototype(code);
    }
  }, []);

  const loadSharedPrototype = async (code: string) => {
    try {
      const result = await getSharedPrototype(code);
      const proto = result.data.prototype;
      setZoneContent(proto.zoneContent);
      setChatHistory([{ role: 'ai', text: `Loaded shared prototype: ${proto.name}` }]);
      setView('editor');
      // Clear the URL
      window.history.replaceState({}, '', '/');
    } catch (error) {
      console.error('Failed to load shared prototype:', error);
    }
  };

  // Handle global event bus for the "hardware bridge"
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TELLY_EVENT') {
        console.log('Telly Event Bus:', event.data.payload);

        // Broadcast to all iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          if (iframe.contentWindow && iframe.contentWindow !== event.source) {
            iframe.contentWindow.postMessage(event.data, '*');
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const userMessage = prompt;
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setPrompt('');

    try {
      const code = await generateZoneCode(selectedZone, userMessage, zoneContent[selectedZone]);

      setZoneContent(prev => ({
        ...prev,
        [selectedZone]: code
      }));

      setChatHistory(prev => [...prev, { role: 'ai', text: `Generated code for Zone ${selectedZone}.` }]);
      setIsDirty(true);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: `Error generating code: ${error}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (name: string, description: string) => {
    const prototypeData = {
      name,
      description,
      zoneContent,
    };

    if (currentPrototype) {
      // Update existing
      const result = await updatePrototype(currentPrototype.id, prototypeData);
      setCurrentPrototype(result.data);
    } else {
      // Create new
      const result = await createPrototype(prototypeData);
      setCurrentPrototype(result.data);
    }

    setIsDirty(false);
    setChatHistory(prev => [...prev, { role: 'ai', text: `Saved prototype: ${name}` }]);
  };

  const handleSelectPrototype = (prototype: Prototype) => {
    if (isDirty && !confirm('You have unsaved changes. Continue without saving?')) {
      return;
    }

    setCurrentPrototype(prototype);
    setZoneContent(prototype.zoneContent);
    setChatHistory([{ role: 'ai', text: `Loaded: ${prototype.name}` }]);
    setIsDirty(false);
    setView('editor');
  };

  const handleNewPrototype = () => {
    if (isDirty && !confirm('You have unsaved changes. Continue without saving?')) {
      return;
    }

    setCurrentPrototype(null);
    setZoneContent(INITIAL_ZONE_CONTENT);
    setChatHistory([]);
    setIsDirty(false);
    setView('editor');
  };

  const handleImport = async (data: { name: string; description?: string; zoneContent: ZoneContent }) => {
    const result = await createPrototype({
      name: data.name,
      description: data.description,
      zoneContent: data.zoneContent,
    });

    setCurrentPrototype(result.data);
    setZoneContent(result.data.zoneContent);
    setChatHistory([{ role: 'ai', text: `Imported: ${result.data.name}` }]);
    setIsDirty(false);
    setView('editor');
  };

  const handleShareFromLibrary = (prototype: Prototype) => {
    setSharePrototype(prototype);
    setShowShareModal(true);
  };

  const handleEditPrototype = (prototype: Prototype) => {
    setDetailsPrototype(prototype);
    setView('details');
  };

  const handleSaveDetails = async (name: string, description: string) => {
    if (!detailsPrototype) return;

    const result = await updatePrototype(detailsPrototype.id, { name, description });
    setDetailsPrototype(result.data);

    // If this is also the current prototype, update it
    if (currentPrototype?.id === detailsPrototype.id) {
      setCurrentPrototype(result.data);
    }
  };

  const handleDeleteFromDetails = async () => {
    if (!detailsPrototype) return;

    await deletePrototype(detailsPrototype.id);

    // If this was the current prototype, clear it
    if (currentPrototype?.id === detailsPrototype.id) {
      setCurrentPrototype(null);
      setZoneContent(INITIAL_ZONE_CONTENT);
    }

    setDetailsPrototype(null);
    setView('library');
  };

  const getExportPrototype = (): Prototype => {
    if (currentPrototype) {
      return { ...currentPrototype, zoneContent };
    }
    return {
      id: 'unsaved',
      name: 'Unsaved Prototype',
      zoneContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveZoneTemplate = async (name: string, description: string) => {
    await createZoneTemplate({
      name,
      zoneId: selectedZone,
      content: zoneContent[selectedZone],
      description: description || undefined,
    });
    setChatHistory(prev => [...prev, { role: 'ai', text: `Saved Zone ${selectedZone} as template: ${name}` }]);
  };

  const handleLoadZoneTemplate = (content: string) => {
    setZoneContent(prev => ({
      ...prev,
      [selectedZone]: content
    }));
    setIsDirty(true);
    setChatHistory(prev => [...prev, { role: 'ai', text: `Loaded template into Zone ${selectedZone}` }]);
  };

  const handleGenerateLEDPattern = async () => {
    const userPrompt = prompt.trim() || 'Create a cool ambient lighting effect';
    setIsGeneratingLED(true);
    setChatHistory(prev => [...prev, { role: 'user', text: `LED: ${userPrompt}` }]);

    try {
      const { animation, keyframes } = await generateLEDPattern(userPrompt, ledSettings);

      // Inject keyframes into document if provided
      if (keyframes) {
        const styleEl = document.createElement('style');
        styleEl.textContent = keyframes;
        document.head.appendChild(styleEl);
      }

      setLedSettings(prev => ({
        ...prev,
        pattern: 'custom',
        customCSS: animation
      }));

      setChatHistory(prev => [...prev, { role: 'ai', text: 'Generated custom LED pattern!' }]);
      setPrompt('');
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: `Error: ${error}` }]);
    } finally {
      setIsGeneratingLED(false);
    }
  };

  // Determine zone availability based on B and F content
  const hasZoneBContent = Boolean(zoneContent.B && zoneContent.B.trim());
  const hasZoneFContent = Boolean(zoneContent.F && zoneContent.F.trim());

  // Zone disable logic:
  // - Zone B active: disable C, D, E, F
  // - Zone F active: disable C, D (but keep E enabled)
  const isZoneDisabled = (zone: ZoneId): boolean => {
    if (hasZoneBContent && zone !== 'A' && zone !== 'B') return true;
    if (hasZoneFContent && !hasZoneBContent && (zone === 'C' || zone === 'D')) return true;
    return false;
  };

  if (view === 'library') {
    return (
      <div className="flex h-screen bg-[#111] text-white font-sans overflow-hidden">
        {/* Sidebar */}
        <div className="w-16 bg-[#0a0a0a] border-r border-white/10 flex flex-col items-center py-6 space-y-6 z-20">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Layers className="text-white w-6 h-6" />
          </div>
          <div className="flex-1 w-full flex flex-col items-center space-y-4">
            <button
              onClick={() => setView('editor')}
              className="p-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Editor"
            >
              <Code className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('library')}
              className="p-3 rounded-lg bg-blue-600/20 text-blue-400 transition-colors"
              title="Library"
            >
              <Library className="w-5 h-5" />
            </button>
          </div>
        </div>

        <PrototypeLibrary
          onSelectPrototype={handleSelectPrototype}
          onNewPrototype={handleNewPrototype}
          onImport={() => setShowImportModal(true)}
          onShare={handleShareFromLibrary}
          onEditPrototype={handleEditPrototype}
        />

        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />

        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSharePrototype(null);
          }}
          prototype={sharePrototype}
        />
      </div>
    );
  }

  if (view === 'details' && detailsPrototype) {
    return (
      <div className="flex h-screen bg-[#111] text-white font-sans overflow-hidden">
        {/* Sidebar */}
        <div className="w-16 bg-[#0a0a0a] border-r border-white/10 flex flex-col items-center py-6 space-y-6 z-20">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Layers className="text-white w-6 h-6" />
          </div>
          <div className="flex-1 w-full flex flex-col items-center space-y-4">
            <button
              onClick={() => setView('editor')}
              className="p-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Editor"
            >
              <Code className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('library')}
              className="p-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Library"
            >
              <Library className="w-5 h-5" />
            </button>
            <button
              className="p-3 rounded-lg bg-blue-600/20 text-blue-400 transition-colors"
              title="Details"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <PrototypeDetails
          prototype={detailsPrototype}
          onBack={() => setView('library')}
          onSave={handleSaveDetails}
          onDelete={handleDeleteFromDetails}
          onExport={() => {
            setSharePrototype(detailsPrototype);
            setShowExportModal(true);
          }}
          onShare={() => {
            setSharePrototype(detailsPrototype);
            setShowShareModal(true);
          }}
        />

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          prototype={detailsPrototype}
          selectedZone={selectedZone}
        />

        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSharePrototype(null);
          }}
          prototype={sharePrototype}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#111] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 bg-[#0a0a0a] border-r border-white/10 flex flex-col items-center py-6 space-y-6 z-20">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Layers className="text-white w-6 h-6" />
        </div>
        <div className="flex-1 w-full flex flex-col items-center space-y-4">
          <button
            onClick={() => setView('editor')}
            className="p-3 rounded-lg bg-blue-600/20 text-blue-400 transition-colors"
            title="Editor"
          >
            <Code className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('library')}
            className="p-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Library"
          >
            <Library className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold tracking-tight">Telly ProtoStudio</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">v0.2.0</span>
            {currentPrototype && (
              <span className="text-sm text-gray-400">
                {currentPrototype.name}
                {isDirty && <span className="text-yellow-400 ml-1">*</span>}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {currentPrototype && (
              <button
                onClick={() => {
                  setSharePrototype(currentPrototype);
                  setShowShareModal(true);
                }}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex min-h-0">
          {/* Device Preview (Left/Center) */}
          <div className="flex-1 bg-[#1a1a1a] relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
              <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-xs text-gray-300">
                Active Zone: <span className="text-blue-400 font-bold">Zone {selectedZone}</span>
              </div>
              {hasZoneBContent && selectedZone !== 'B' && selectedZone !== 'A' && (
                <div className="bg-yellow-500/20 backdrop-blur-md px-3 py-1.5 rounded-md border border-yellow-500/20 text-xs text-yellow-400">
                  Zone B active - C/D/E/F hidden
                </div>
              )}
              {hasZoneFContent && !hasZoneBContent && (selectedZone === 'C' || selectedZone === 'D') && (
                <div className="bg-yellow-500/20 backdrop-blur-md px-3 py-1.5 rounded-md border border-yellow-500/20 text-xs text-yellow-400">
                  Zone F active - C/D hidden
                </div>
              )}
            </div>
            <TellyDevice
              zoneContent={zoneContent}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              ledSettings={ledSettings}
            />
          </div>

          {/* AI Chat / Controls (Right Panel) */}
          <div className="w-96 bg-[#0a0a0a] border-l border-white/10 flex flex-col">
            {/* Zone Selector */}
            <div className="p-4 border-b border-white/10">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Target Zone</label>
              <div className="grid grid-cols-6 gap-2">
                {(['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]).map((zone) => {
                  const disabled = isZoneDisabled(zone);
                  const getDisabledReason = () => {
                    if (hasZoneBContent && zone !== 'A' && zone !== 'B') return 'Clear Zone B to enable';
                    if (hasZoneFContent && (zone === 'C' || zone === 'D')) return 'Clear Zone F to enable';
                    return '';
                  };
                  return (
                    <button
                      key={zone}
                      onClick={() => !disabled && setSelectedZone(zone)}
                      disabled={disabled}
                      className={`h-10 rounded-md text-sm font-medium transition-all ${
                        selectedZone === zone
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                          : disabled
                          ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                      title={disabled ? getDisabledReason() : `Zone ${zone}`}
                    >
                      {zone}
                    </button>
                  );
                })}
              </div>
              {hasZoneBContent && (
                <p className="text-xs text-gray-500 mt-2">Zone B is active. Clear it to use C/D/E/F.</p>
              )}
              {hasZoneFContent && !hasZoneBContent && (
                <p className="text-xs text-gray-500 mt-2">Zone F is active. Clear it to use C/D.</p>
              )}

              {/* Zone Template Actions */}
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setShowSaveZoneModal(true)}
                  disabled={!zoneContent[selectedZone]?.trim()}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save current zone as template"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Save Zone</span>
                </button>
                <button
                  onClick={() => setShowLoadZoneModal(true)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs"
                  title="Load zone template"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Load Template</span>
                </button>
              </div>
            </div>

            {/* LED Control Panel */}
            <LEDControlPanel
              settings={ledSettings}
              onChange={setLedSettings}
              onGeneratePattern={handleGenerateLEDPattern}
              isGenerating={isGeneratingLED}
            />

            {/* Generation Mode Selector */}
            <div className="p-4 border-b border-white/10">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Generation Mode</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'code' as GenerationMode, icon: Code, label: 'Code' },
                  { id: 'image' as GenerationMode, icon: Image, label: 'Image' },
                  { id: 'video' as GenerationMode, icon: Video, label: 'Video' },
                  { id: 'music' as GenerationMode, icon: Music, label: 'Music' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setGenerationMode(id)}
                    className={`flex flex-col items-center py-2 rounded-lg text-xs transition-colors ${
                      generationMode === id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    {label}
                  </button>
                ))}
              </div>
              {generationMode !== 'code' && (
                <p className="text-xs text-yellow-400/80 mt-2">
                  {generationMode === 'image' && 'Uses Imagen to generate images'}
                  {generationMode === 'video' && 'Uses Veo 3 to generate videos'}
                  {generationMode === 'music' && 'Uses MusicFX to generate audio'}
                </p>
              )}
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center mt-10 opacity-50">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm text-gray-400">Select a zone and describe what you want to build.</p>
                  <p className="text-xs text-gray-600 mt-2">"Create a weather widget with a dark gradient background"</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white/10 text-gray-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-xs text-gray-400">Generating vibe code...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={`Describe UI for Zone ${selectedZone}...`}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        initialName={currentPrototype?.name || ''}
        initialDescription={currentPrototype?.description || ''}
        isUpdate={!!currentPrototype}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        prototype={getExportPrototype()}
        selectedZone={selectedZone}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSharePrototype(null);
        }}
        prototype={sharePrototype || currentPrototype}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <SaveZoneModal
        isOpen={showSaveZoneModal}
        onClose={() => setShowSaveZoneModal(false)}
        onSave={handleSaveZoneTemplate}
        zoneId={selectedZone}
        zoneContent={zoneContent[selectedZone]}
      />

      <LoadZoneModal
        isOpen={showLoadZoneModal}
        onClose={() => setShowLoadZoneModal(false)}
        onLoad={handleLoadZoneTemplate}
        zoneId={selectedZone}
      />
    </div>
  );
}
