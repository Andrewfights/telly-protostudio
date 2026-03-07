import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, Code, Sparkles, RefreshCw, Layers, Library, Save, Share2, Settings, FolderOpen, BookMarked, Image, Video, Music, Upload, Maximize2, Monitor, ChevronDown, ChevronRight, Repeat, FolderOpen as FolderIcon, Tv, History, Grid3X3, MessageSquare, Lock } from 'lucide-react';
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
import FullscreenView from './components/FullscreenView';
import MediaLibrary from './components/MediaLibrary';
import VideoSourceModal from './components/VideoSourceModal';
import VersionHistoryPanel from './components/VersionHistoryPanel';
import VersionDiffModal from './components/VersionDiffModal';
import StreamLayoutPanel from './components/StreamLayoutPanel';
import PlanModePanel from './components/PlanModePanel';
import SettingsModal from './components/SettingsModal';
import ThinkingPanel from './components/ThinkingPanel';
import { generateZoneCode, generateLEDPattern, generateImage, generateVideo, generateMusic, analyzePrompt, generateWithThinking } from './services/aiService';
import type { GenerationProgress, PromptAnalysis } from './services/aiService';
import { uploadFile } from './services/mediaService';
import { createPrototype, updatePrototype, getSharedPrototype, createZoneTemplate, deletePrototype } from './services/apiService';
import type { ZoneId, ZoneContent, Prototype, ChatMessage, LEDSettings, MediaItem, MediaType, VideoSourceConfig, PrototypeVersion } from './types';

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
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showVideoSource, setShowVideoSource] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showVersionDiff, setShowVersionDiff] = useState(false);
  const [diffVersions, setDiffVersions] = useState<{ v1: number; v2: number } | null>(null);
  const [showStreamPanel, setShowStreamPanel] = useState(false);
  const [showPlanMode, setShowPlanMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Thinking/reasoning state
  const [showThinking, setShowThinking] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysis | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<string[] | null>(null);
  const [askModeEnabled, setAskModeEnabled] = useState(true); // Ask Mode on by default

  // Zone D lock for ads (project-wide setting)
  const [zoneDLocked, setZoneDLocked] = useState(false);

  // Media/content options
  const [loopMedia, setLoopMedia] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Generate HTML code to embed media in a zone
  const generateMediaEmbed = (mediaItem: MediaItem, loop: boolean): string => {
    const ZONE_DIMENSIONS: Record<ZoneId, { width: number; height: number }> = {
      A: { width: 1920, height: 1080 },
      B: { width: 1920, height: 360 },
      C: { width: 1280, height: 300 },
      D: { width: 640, height: 300 },
      E: { width: 1920, height: 60 },
      F: { width: 1920, height: 300 },
    };

    const dim = ZONE_DIMENSIONS[selectedZone];

    if (mediaItem.type === 'image') {
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${dim.width}px;
      height: ${dim.height}px;
      overflow: hidden;
      background: #000;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <img src="${mediaItem.url}" alt="${mediaItem.name}" />
</body>
</html>`;
    }

    if (mediaItem.type === 'video') {
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${dim.width}px;
      height: ${dim.height}px;
      overflow: hidden;
      background: #000;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  <video src="${mediaItem.url}" autoplay ${loop ? 'loop' : ''} muted playsinline></video>
</body>
</html>`;
    }

    if (mediaItem.type === 'audio') {
      return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${dim.width}px;
      height: ${dim.height}px;
      overflow: hidden;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .visualizer {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 60%;
    }
    .bar {
      width: 8px;
      background: linear-gradient(to top, #4f46e5, #818cf8);
      border-radius: 4px;
      animation: pulse 0.5s ease-in-out infinite alternate;
    }
    .bar:nth-child(1) { animation-delay: 0s; height: 30%; }
    .bar:nth-child(2) { animation-delay: 0.1s; height: 50%; }
    .bar:nth-child(3) { animation-delay: 0.2s; height: 80%; }
    .bar:nth-child(4) { animation-delay: 0.3s; height: 60%; }
    .bar:nth-child(5) { animation-delay: 0.4s; height: 40%; }
    .bar:nth-child(6) { animation-delay: 0.15s; height: 70%; }
    .bar:nth-child(7) { animation-delay: 0.25s; height: 55%; }
    .bar:nth-child(8) { animation-delay: 0.35s; height: 45%; }
    @keyframes pulse {
      to { height: 100%; opacity: 0.8; }
    }
  </style>
</head>
<body>
  <div class="visualizer">
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
  </div>
  <audio src="${mediaItem.url}" autoplay ${loop ? 'loop' : ''} id="audio"></audio>
</body>
</html>`;
    }

    return '';
  };

  // Generate HTML code to embed streaming video (YouTube, Pluto TV)
  const generateStreamEmbed = (config: VideoSourceConfig): string => {
    const ZONE_DIMENSIONS: Record<ZoneId, { width: number; height: number }> = {
      A: { width: 1920, height: 1080 },
      B: { width: 1920, height: 360 },
      C: { width: 1280, height: 300 },
      D: { width: 640, height: 300 },
      E: { width: 1920, height: 60 },
      F: { width: 1920, height: 300 },
    };

    const dim = ZONE_DIMENSIONS[selectedZone];

    if (config.type === 'youtube' && config.videoId) {
      const params = new URLSearchParams();
      if (config.autoplay) params.set('autoplay', '1');
      if (config.muted) params.set('mute', '1');
      if (config.loop) {
        params.set('loop', '1');
        params.set('playlist', config.videoId);
      }
      if (!config.controls) params.set('controls', '0');
      params.set('rel', '0'); // Don't show related videos

      return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${config.videoId}?${params.toString()}"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen>
  </iframe>
</body>
</html>`;
    }

    if (config.type === 'plutotv' && config.channelSlug) {
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://pluto.tv/live-tv/${config.channelSlug}"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen>
  </iframe>
</body>
</html>`;
    }

    if (config.type === 'custom-url' && config.customUrl) {
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="${config.customUrl}"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen>
  </iframe>
</body>
</html>`;
    }

    return '';
  };

  // Handle selecting video source from modal
  const handleSelectVideoSource = (config: VideoSourceConfig, name: string) => {
    const code = generateStreamEmbed(config);
    setZoneContent(prev => ({
      ...prev,
      [selectedZone]: code
    }));
    setChatHistory(prev => [...prev, { role: 'ai', text: `Added stream to Zone ${selectedZone}: ${name}` }]);
    setIsDirty(true);
    setShowVideoSource(false);
  };

  // Handle applying stream grid layout
  const handleApplyStreamLayout = (html: string, zone: ZoneId) => {
    setZoneContent(prev => ({
      ...prev,
      [zone]: html
    }));
    setSelectedZone(zone);
    setChatHistory(prev => [...prev, { role: 'ai', text: `Applied stream grid layout to Zone ${zone} (${zone === 'A' ? 'Top Screen' : 'Bottom Screen'})` }]);
    setIsDirty(true);
    setShowStreamPanel(false);
  };

  // Handle selecting media from library
  const handleSelectMedia = (mediaItem: MediaItem) => {
    const code = generateMediaEmbed(mediaItem, loopMedia);
    setZoneContent(prev => ({
      ...prev,
      [selectedZone]: code
    }));
    setChatHistory(prev => [...prev, { role: 'ai', text: `Added ${mediaItem.type} to Zone ${selectedZone}: ${mediaItem.name}` }]);
    setIsDirty(true);
    setShowMediaLibrary(false);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setChatHistory(prev => [...prev, { role: 'user', text: `Uploading: ${file.name}` }]);

    try {
      const mediaItem = await uploadFile(file);
      const code = generateMediaEmbed(mediaItem, loopMedia);
      setZoneContent(prev => ({
        ...prev,
        [selectedZone]: code
      }));
      setChatHistory(prev => [...prev, { role: 'ai', text: `Added ${mediaItem.type} to Zone ${selectedZone}: ${mediaItem.name}` }]);
      setIsDirty(true);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: `Upload failed: ${error}` }]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get accepted file types based on generation mode
  const getAcceptedFileTypes = (): string => {
    switch (generationMode) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'music': return 'audio/*';
      default: return 'image/*,video/*,audio/*';
    }
  };

  // Get media type filter for library
  const getMediaTypeFilter = (): MediaType | undefined => {
    switch (generationMode) {
      case 'image': return 'image';
      case 'video': return 'video';
      case 'music': return 'audio';
      default: return undefined;
    }
  };

  const handleGenerate = async (additionalContext?: string) => {
    const userPrompt = additionalContext || prompt.trim();
    if (!userPrompt) return;

    setIsGenerating(true);
    const userMessage = userPrompt;
    if (!additionalContext) {
      setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
      setPrompt('');
    }

    try {
      if (generationMode === 'code') {
        // For code generation, use the thinking flow
        setShowThinking(true);
        setGenerationProgress({ phase: 'analyzing', progress: 5, thinking: ['Starting analysis...'], currentStep: 'Analyzing your request' });

        // Step 1: Analyze prompt for clarification needs (only if Ask Mode is enabled)
        if (askModeEnabled && !additionalContext) {
          try {
            const analysis = await analyzePrompt(userMessage, selectedZone);
            setPromptAnalysis(analysis);

            if (analysis.needsClarification && analysis.questions.length > 0) {
              // Show clarification questions
              setPendingQuestions(analysis.questions);
              setGenerationProgress(null);
              setIsGenerating(false);
              return;
            }
          } catch (error) {
            console.log('Skipping analysis, proceeding directly:', error);
          }
        }

        // Step 2: Generate with thinking visualization
        const code = await generateWithThinking(
          selectedZone,
          userMessage,
          (progress) => {
            setGenerationProgress(progress);
          },
          zoneContent[selectedZone]
        );

        setZoneContent(prev => ({
          ...prev,
          [selectedZone]: code
        }));
        setChatHistory(prev => [...prev, { role: 'ai', text: `Generated code for Zone ${selectedZone}.` }]);
        setShowThinking(false);
        setGenerationProgress(null);
        setPromptAnalysis(null);
        setPendingQuestions(null);
      } else if (generationMode === 'image') {
        setChatHistory(prev => [...prev, { role: 'ai', text: 'Generating image with Nano Banana 2...' }]);
        const mediaItem = await generateImage(userMessage);
        const code = generateMediaEmbed(mediaItem, loopMedia);
        setZoneContent(prev => ({
          ...prev,
          [selectedZone]: code
        }));
        setChatHistory(prev => [...prev, { role: 'ai', text: `Generated image for Zone ${selectedZone}.` }]);
      } else if (generationMode === 'video') {
        setChatHistory(prev => [...prev, { role: 'ai', text: 'Generating video with Veo 3...' }]);
        const mediaItem = await generateVideo(userMessage);
        const code = generateMediaEmbed(mediaItem, loopMedia);
        setZoneContent(prev => ({
          ...prev,
          [selectedZone]: code
        }));
        setChatHistory(prev => [...prev, { role: 'ai', text: `Generated video for Zone ${selectedZone}.` }]);
      } else if (generationMode === 'music') {
        setChatHistory(prev => [...prev, { role: 'ai', text: 'Generating music with MusicFX...' }]);
        const mediaItem = await generateMusic(userMessage);
        const code = generateMediaEmbed(mediaItem, loopMedia);
        setZoneContent(prev => ({
          ...prev,
          [selectedZone]: code
        }));
        setChatHistory(prev => [...prev, { role: 'ai', text: `Generated audio for Zone ${selectedZone}.` }]);
      }
      setIsDirty(true);
    } catch (error) {
      console.error('Generation error:', error);
      setChatHistory(prev => [...prev, { role: 'ai', text: `Error: ${error}` }]);
    } finally {
      // Always reset all thinking/generating states
      setIsGenerating(false);
      setShowThinking(false);
      setGenerationProgress(null);
      setPromptAnalysis(null);
    }
  };

  // Handle answering clarification questions
  const handleAnswerQuestions = (answers: Record<string, string>) => {
    // Build enhanced prompt with answers
    const answerContext = Object.entries(answers)
      .map(([question, answer]) => `${question}: ${answer}`)
      .join('\n');

    const enhancedPrompt = `${prompt}\n\nUser clarifications:\n${answerContext}`;

    setPendingQuestions(null);
    setShowThinking(true);

    // Continue generation with answers
    handleGenerate(enhancedPrompt);
  };

  const handleSave = async (name: string, description: string, options: { createVersion: boolean; commitMessage: string }) => {
    const prototypeData = {
      name,
      description,
      zoneContent,
      ledSettings,
      createVersion: options.createVersion,
      commitMessage: options.commitMessage,
    };

    if (currentPrototype) {
      // Update existing
      const result = await updatePrototype(currentPrototype.id, prototypeData);
      setCurrentPrototype(result.data);
      const versionMsg = options.createVersion ? ` (v${result.data.totalVersions || 1})` : '';
      setChatHistory(prev => [...prev, { role: 'ai', text: `Updated prototype: ${name}${versionMsg}` }]);
    } else {
      // Create new
      const result = await createPrototype(prototypeData);
      setCurrentPrototype(result.data);
      setChatHistory(prev => [...prev, { role: 'ai', text: `Created prototype: ${name} (v1)` }]);
    }

    setIsDirty(false);
  };

  // Handle rollback from version history
  const handleVersionRollback = (prototype: Prototype) => {
    setCurrentPrototype(prototype);
    setZoneContent(prototype.zoneContent);
    if (prototype.ledSettings) {
      setLedSettings(prototype.ledSettings);
    }
    setChatHistory(prev => [...prev, { role: 'ai', text: `Rolled back to version ${prototype.currentVersion}` }]);
    setShowVersionHistory(false);
  };

  // Handle preview from version history
  const handleVersionPreview = (version: PrototypeVersion) => {
    // Temporarily show the version content without saving
    setZoneContent(version.zoneContent);
    if (version.ledSettings) {
      setLedSettings(version.ledSettings);
    }
    setChatHistory(prev => [...prev, { role: 'ai', text: `Previewing version ${version.versionNumber} - Save to keep or rollback to restore` }]);
    setShowVersionHistory(false);
    setIsDirty(true);
  };

  // Handle compare versions
  const handleVersionCompare = (v1: number, v2: number) => {
    setDiffVersions({ v1, v2 });
    setShowVersionDiff(true);
    setShowVersionHistory(false);
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
              onClick={() => setShowFullscreen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm transition-colors text-white"
              title="Preview with remote control"
            >
              <Monitor className="w-4 h-4" />
              <span>Preview</span>
            </button>
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
              <>
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm transition-colors border border-white/10"
                  title="Version History"
                >
                  <History className="w-4 h-4" />
                  <span>v{currentPrototype.currentVersion || 1}</span>
                </button>
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
              </>
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
            {/* PROMINENT INPUT AREA - Always at top */}
            <div className="p-4 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] border-b border-white/10">
              {/* Zone + Mode selector row */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex-1 flex space-x-1">
                  {(['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]).map((zone) => {
                    const disabled = isZoneDisabled(zone);
                    const isZoneDLocked = zone === 'D' && zoneDLocked;
                    return (
                      <button
                        key={zone}
                        onClick={() => !disabled && setSelectedZone(zone)}
                        disabled={disabled}
                        className={`flex-1 h-8 rounded text-xs font-bold transition-all relative ${
                          selectedZone === zone
                            ? 'bg-blue-600 text-white'
                            : isZoneDLocked
                            ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/50'
                            : disabled
                            ? 'bg-white/5 text-gray-700 cursor-not-allowed'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                        title={isZoneDLocked ? 'Zone D locked for ads' : undefined}
                      >
                        {isZoneDLocked ? (
                          <span className="flex items-center justify-center">
                            <Lock className="w-3 h-3 mr-0.5" />
                            {zone}
                          </span>
                        ) : zone}
                      </button>
                    );
                  })}
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex space-x-1">
                  {[
                    { id: 'code' as GenerationMode, icon: Code },
                    { id: 'image' as GenerationMode, icon: Image },
                    { id: 'video' as GenerationMode, icon: Video },
                    { id: 'music' as GenerationMode, icon: Music },
                  ].map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setGenerationMode(id)}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                        generationMode === id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                      title={id.charAt(0).toUpperCase() + id.slice(1)}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={() => setShowStreamPanel(true)}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                      showStreamPanel
                        ? 'bg-purple-600 text-white'
                        : 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-400 hover:from-purple-600/50 hover:to-indigo-600/50'
                    }`}
                    title="Stream Grid Layout"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowPlanMode(true)}
                    className="w-8 h-8 rounded flex items-center justify-center transition-all bg-gradient-to-r from-cyan-600/30 to-purple-600/30 text-cyan-400 hover:from-cyan-600/50 hover:to-purple-600/50"
                    title="Plan Mode - AI Assistant"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-8 h-8 rounded flex items-center justify-center transition-all bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    title="Settings - API Key"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main input */}
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
                  placeholder={
                    generationMode === 'code'
                      ? `Describe UI for Zone ${selectedZone}...`
                      : generationMode === 'image'
                      ? 'Describe the image to generate...'
                      : generationMode === 'video'
                      ? 'Describe the video to generate with Veo 3...'
                      : 'Describe the music to generate...'
                  }
                  className="w-full bg-[#0d0d15] border-2 border-blue-500/30 rounded-xl pl-4 pr-14 py-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none h-28 shadow-lg shadow-blue-900/10"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute bottom-3 right-3 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Content mode controls - Upload, Library, Stream, Loop */}
              {generationMode !== 'code' && (
                <div className="mt-3 space-y-2">
                  {/* Upload, Library, and Stream buttons */}
                  <div className="flex space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={getAcceptedFileTypes()}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={() => setShowMediaLibrary(true)}
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      <FolderIcon className="w-4 h-4" />
                      <span>Library</span>
                    </button>
                    {generationMode === 'video' && (
                      <button
                        onClick={() => setShowVideoSource(true)}
                        className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-gradient-to-r from-red-600/80 to-blue-600/80 hover:from-red-500 hover:to-blue-500 text-white transition-colors text-sm"
                      >
                        <Tv className="w-4 h-4" />
                        <span>Stream</span>
                      </button>
                    )}
                  </div>

                  {/* Loop toggle for video/music */}
                  {(generationMode === 'video' || generationMode === 'music') && (
                    <button
                      onClick={() => setLoopMedia(!loopMedia)}
                      className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors text-xs ${
                        loopMedia
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                          : 'bg-white/5 text-gray-500 border border-white/10'
                      }`}
                    >
                      <Repeat className={`w-3.5 h-3.5 ${loopMedia ? 'text-purple-400' : ''}`} />
                      <span>{loopMedia ? 'Loop Enabled' : 'Loop Disabled'}</span>
                    </button>
                  )}

                  {/* AI generation hint */}
                  <p className="text-xs text-purple-400 flex items-center justify-center pt-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {generationMode === 'image' && 'Generate with Nano Banana 2'}
                    {generationMode === 'video' && 'Generate with Veo 3'}
                    {generationMode === 'music' && 'Generate with MusicFX'}
                  </p>
                </div>
              )}
            </div>

            {/* Scrollable controls area */}
            <div className="flex-1 overflow-y-auto">
              {/* Thinking Panel - Shows when generating with thinking */}
              {(showThinking || pendingQuestions) && (
                <div className="p-4 border-b border-white/10">
                  <ThinkingPanel
                    isVisible={true}
                    progress={generationProgress}
                    analysis={promptAnalysis}
                    onAnswerQuestions={handleAnswerQuestions}
                    pendingQuestions={pendingQuestions || undefined}
                  />
                </div>
              )}

              {/* Ask Mode Toggle */}
              {generationMode === 'code' && (
                <div className="px-4 py-2 border-b border-white/10">
                  <button
                    onClick={() => setAskModeEnabled(!askModeEnabled)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                      askModeEnabled
                        ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Ask Mode</span>
                    </span>
                    <span className="text-xs opacity-70">
                      {askModeEnabled ? 'ON - AI will ask clarifying questions' : 'OFF - Generate directly'}
                    </span>
                  </button>
                </div>
              )}

              {/* Chat History */}
              <div className="p-4 space-y-3 min-h-[120px]">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-6 opacity-50">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-xs text-gray-500">Your conversation will appear here</p>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white/10 text-gray-300 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Collapsible Controls */}
              <div className="border-t border-white/10">
                {/* Zone Templates - Collapsible */}
                <details className="group">
                  <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center">
                      <BookMarked className="w-3.5 h-3.5 mr-2" />
                      Zone Templates
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-3 pb-3 flex space-x-2">
                    <button
                      onClick={() => setShowSaveZoneModal(true)}
                      disabled={!zoneContent[selectedZone]?.trim()}
                      className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs disabled:opacity-50"
                    >
                      Save Zone
                    </button>
                    <button
                      onClick={() => setShowLoadZoneModal(true)}
                      className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs"
                    >
                      Load Template
                    </button>
                  </div>
                </details>

                {/* LED Control - Collapsible */}
                <details className="group border-t border-white/10">
                  <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${ledSettings.enabled ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                      LED Backlight
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="pb-2">
                    <LEDControlPanel
                      settings={ledSettings}
                      onChange={setLedSettings}
                      onGeneratePattern={handleGenerateLEDPattern}
                      isGenerating={isGeneratingLED}
                    />
                  </div>
                </details>
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
        currentVersion={currentPrototype?.currentVersion || 1}
        totalVersions={currentPrototype?.totalVersions || 1}
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

      {/* Media Library for selecting content */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleSelectMedia}
        filterType={getMediaTypeFilter()}
      />

      {/* Video Source Modal for YouTube/Pluto TV */}
      <VideoSourceModal
        isOpen={showVideoSource}
        onClose={() => setShowVideoSource(false)}
        onSelect={handleSelectVideoSource}
        loop={loopMedia}
      />

      {/* Version History Panel */}
      {currentPrototype && (
        <VersionHistoryPanel
          prototype={currentPrototype}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          onPreviewVersion={handleVersionPreview}
          onRollback={handleVersionRollback}
          onCompare={handleVersionCompare}
        />
      )}

      {/* Version Diff Modal */}
      {currentPrototype && diffVersions && (
        <VersionDiffModal
          prototypeId={currentPrototype.id}
          version1={diffVersions.v1}
          version2={diffVersions.v2}
          isOpen={showVersionDiff}
          onClose={() => {
            setShowVersionDiff(false);
            setDiffVersions(null);
          }}
        />
      )}

      {/* Stream Layout Panel */}
      {showStreamPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60"
            onClick={() => setShowStreamPanel(false)}
          />
          <div className="w-96 animate-slide-in-right">
            <StreamLayoutPanel
              selectedZone={selectedZone}
              currentZoneContent={zoneContent[selectedZone]}
              onApply={handleApplyStreamLayout}
              onClose={() => setShowStreamPanel(false)}
              zoneDLocked={zoneDLocked}
              onZoneDLockChange={setZoneDLocked}
            />
          </div>
        </div>
      )}

      {/* Plan Mode Panel */}
      <PlanModePanel
        isOpen={showPlanMode}
        onClose={() => setShowPlanMode(false)}
        zoneContent={zoneContent}
        selectedZone={selectedZone}
        onApplyCode={(zone, code) => {
          setZoneContent(prev => ({ ...prev, [zone]: code }));
          setIsDirty(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Fullscreen Preview with Remote */}
      {showFullscreen && (
        <FullscreenView
          zoneContent={zoneContent}
          ledSettings={ledSettings}
          onExit={() => setShowFullscreen(false)}
        />
      )}
    </div>
  );
}
