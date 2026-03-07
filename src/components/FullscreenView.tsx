import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react';
import TellyRemote, { RemoteButton } from './TellyRemote';
import type { ZoneId, ZoneContent, LEDSettings } from '../types';
import { isStreamLayout } from '../utils/streamLayoutUtils';

interface FullscreenViewProps {
  zoneContent: ZoneContent;
  ledSettings?: LEDSettings;
  onExit: () => void;
}

const FullscreenView: React.FC<FullscreenViewProps> = ({
  zoneContent,
  ledSettings,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRemote, setShowRemote] = useState(true);
  const [activeScreen, setActiveScreen] = useState<'theater' | 'smart'>('theater');
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [scale, setScale] = useState(1);
  const [focusedZone, setFocusedZone] = useState<ZoneId>('A');
  const [streamModeActive, setStreamModeActive] = useState(false);

  // Check if focused zone has a stream layout
  const focusedZoneHasStream = useCallback(() => {
    const content = zoneContent[focusedZone];
    return content && isStreamLayout(content);
  }, [zoneContent, focusedZone]);

  // Forward key events to stream grid iframe
  const forwardToStreamGrid = useCallback((key: string) => {
    const iframe = document.querySelector(`iframe[title="Zone ${focusedZone}"]`) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'TELLY_REMOTE_KEY',
        key
      }, '*');
      return true;
    }
    return false;
  }, [focusedZone]);

  // Check if Zone B has content (overrides C+D+E+F)
  const hasZoneBContent = Boolean(zoneContent.B && zoneContent.B.trim());
  // Check if Zone F has content (overrides C+D, keeps E)
  const hasZoneFContent = Boolean(zoneContent.F && zoneContent.F.trim());

  // Get the current bottom zone layout
  const getBottomZones = (): ZoneId[] => {
    if (hasZoneBContent) return ['B'];
    if (hasZoneFContent) return ['F', 'E'];
    return ['C', 'D', 'E'];
  };

  // Toggle browser fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-scale the device
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - (showRemote ? 240 : 0);
        const containerHeight = containerRef.current.offsetHeight;
        const deviceWidth = 2000;
        const deviceHeight = 1600;

        const scaleX = (containerWidth - 80) / deviceWidth;
        const scaleY = (containerHeight - 80) / deviceHeight;

        setScale(Math.min(scaleX, scaleY, 1));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [showRemote]);

  // Handle remote button presses
  const handleRemotePress = useCallback((button: RemoteButton) => {
    const bottomZones = getBottomZones();

    switch (button) {
      case 'power':
        setIsPoweredOn(!isPoweredOn);
        break;

      case 'a':
        setActiveScreen('theater');
        setFocusedZone('A');
        setStreamModeActive(false);
        break;

      case 'b':
        setActiveScreen('smart');
        setFocusedZone(bottomZones[0]);
        setStreamModeActive(false);
        break;

      case 'mute':
        setIsMuted(!isMuted);
        break;

      case 'volume_up':
        setVolume(Math.min(100, volume + 5));
        break;

      case 'volume_down':
        setVolume(Math.max(0, volume - 5));
        break;

      case 'up':
        // Check if focused zone has stream layout - always forward navigation
        if (focusedZoneHasStream()) {
          setStreamModeActive(true);
          forwardToStreamGrid('ArrowUp');
        } else if (activeScreen === 'smart') {
          // Navigate up in bottom zones
          const currentIndex = bottomZones.indexOf(focusedZone);
          if (currentIndex > 0) {
            setFocusedZone(bottomZones[currentIndex - 1]);
          } else {
            // Switch to theater display
            setActiveScreen('theater');
            setFocusedZone('A');
          }
        }
        break;

      case 'down':
        // Check if focused zone has stream layout - always forward navigation
        if (focusedZoneHasStream()) {
          setStreamModeActive(true);
          forwardToStreamGrid('ArrowDown');
        } else if (activeScreen === 'theater') {
          // Switch to smart screen
          setActiveScreen('smart');
          setFocusedZone(bottomZones[0]);
        } else {
          // Navigate down in bottom zones
          const currentIndex = bottomZones.indexOf(focusedZone);
          if (currentIndex < bottomZones.length - 1) {
            setFocusedZone(bottomZones[currentIndex + 1]);
          }
        }
        break;

      case 'left':
        if (focusedZoneHasStream()) {
          setStreamModeActive(true);
          forwardToStreamGrid('ArrowLeft');
        } else if (activeScreen === 'smart' && !hasZoneBContent && !hasZoneFContent) {
          // Switch between C and D
          if (focusedZone === 'D') {
            setFocusedZone('C');
          }
        }
        break;

      case 'right':
        if (focusedZoneHasStream()) {
          setStreamModeActive(true);
          forwardToStreamGrid('ArrowRight');
        } else if (activeScreen === 'smart' && !hasZoneBContent && !hasZoneFContent) {
          // Switch between C and D
          if (focusedZone === 'C') {
            setFocusedZone('D');
          }
        }
        break;

      case 'select':
        if (focusedZoneHasStream()) {
          forwardToStreamGrid('Enter');
        } else {
          // Send select event to focused zone's iframe
          const iframes = document.querySelectorAll(`iframe[title="Zone ${focusedZone}"]`);
          iframes.forEach((iframe) => {
            (iframe as HTMLIFrameElement).contentWindow?.postMessage(
              { type: 'TELLY_REMOTE', action: 'select' },
              '*'
            );
          });
        }
        break;

      case 'back':
        if (focusedZoneHasStream() && streamModeActive) {
          forwardToStreamGrid('Escape');
          // Exit stream mode if back pressed at top level of grid
          setStreamModeActive(false);
        }
        break;

      case 'home':
        // Reset to default state
        setActiveScreen('theater');
        setFocusedZone('A');
        break;

      case 'menu':
        // Toggle remote visibility as a menu action
        setShowRemote(!showRemote);
        break;
    }
  }, [isPoweredOn, isMuted, volume, activeScreen, focusedZone, hasZoneBContent, hasZoneFContent, showRemote, focusedZoneHasStream, forwardToStreamGrid, streamModeActive]);

  // Generate LED glow styles
  const getLEDStyles = () => {
    if (!ledSettings?.enabled || !isPoweredOn) return {};

    const color = ledSettings.color;
    const brightness = ledSettings.brightness / 100;
    const speed = 11 - ledSettings.speed;

    let animation = '';
    let boxShadow = `0 0 ${80 * brightness}px ${40 * brightness}px ${color}${Math.round(brightness * 99).toString(16).padStart(2, '0')}`;

    switch (ledSettings.pattern) {
      case 'pulse':
        animation = `ledPulse ${speed * 0.5}s ease-in-out infinite`;
        break;
      case 'breathe':
        animation = `ledBreathe ${speed}s ease-in-out infinite`;
        break;
      case 'rainbow':
        animation = `ledRainbow ${speed * 2}s linear infinite`;
        boxShadow = `0 0 ${80 * brightness}px ${40 * brightness}px currentColor`;
        break;
      case 'wave':
        animation = `ledWave ${speed}s ease-in-out infinite`;
        break;
      case 'custom':
        if (ledSettings.customCSS) {
          return { boxShadow, animation: ledSettings.customCSS };
        }
        break;
    }

    return { boxShadow, animation };
  };

  const renderIframe = (zone: ZoneId, width: number, height: number) => {
    const content = zoneContent[zone];
    const isFocused = focusedZone === zone;

    // Use cyan ring when in stream mode, red otherwise
    const hasStream = content && isStreamLayout(content);
    const ringColor = isFocused && hasStream && streamModeActive
      ? 'ring-cyan-500'
      : 'ring-red-500';

    return (
      <div
        className={`relative transition-all duration-200 ${
          isFocused ? `ring-4 ${ringColor} z-10` : ''
        }`}
        style={{ width, height }}
      >
        <iframe
          title={`Zone ${zone}`}
          srcDoc={content || getDefaultContent(zone)}
          className="w-full h-full border-none bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  };

  const renderBottomSection = () => {
    if (hasZoneBContent) {
      return renderIframe('B', 1920, 360);
    }

    if (hasZoneFContent) {
      return (
        <>
          <div className="h-[300px] w-full">{renderIframe('F', 1920, 300)}</div>
          <div className="h-[60px] w-full">{renderIframe('E', 1920, 60)}</div>
        </>
      );
    }

    return (
      <>
        <div className="flex h-[300px] w-full">
          {renderIframe('C', 1280, 300)}
          {renderIframe('D', 640, 300)}
        </div>
        <div className="h-[60px] w-full">{renderIframe('E', 1920, 60)}</div>
      </>
    );
  };

  const ledStyles = getLEDStyles();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#0a0a0a] z-50 flex"
    >
      {/* LED Animation Keyframes */}
      <style>{`
        @keyframes ledPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes ledBreathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes ledRainbow {
          0% { color: #ff0000; }
          17% { color: #ff8800; }
          33% { color: #ffff00; }
          50% { color: #00ff00; }
          67% { color: #0088ff; }
          83% { color: #8800ff; }
          100% { color: #ff0000; }
        }
        @keyframes ledWave {
          0%, 100% { filter: blur(20px); }
          50% { filter: blur(40px); }
        }
      `}</style>

      {/* TV Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* LED Glow Layer */}
        {ledSettings?.enabled && isPoweredOn && (
          <div
            className="absolute rounded-2xl pointer-events-none"
            style={{
              width: (1920 + 32) * scale + 60,
              height: (1080 + 100 + 360 + 32 + 16) * scale + 60,
              ...ledStyles,
              zIndex: 0,
            }}
          />
        )}

        {/* TV Device */}
        <div
          className="relative bg-[#0a0a0a] shadow-2xl rounded-lg p-4 border border-gray-800"
          style={{
            width: 1920 + 32,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            zIndex: 1,
          }}
        >
          {/* Power off overlay */}
          {!isPoweredOn && (
            <div className="absolute inset-0 bg-black z-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-600 text-2xl">TV Off</p>
            </div>
          )}

          {/* Main Display (Zone A) */}
          <div className="flex justify-center mb-4">
            {renderIframe('A', 1920, 1080)}
          </div>

          {/* Soundbar / Grille Area */}
          <div className="w-[1920px] h-[100px] bg-gradient-to-b from-gray-800 to-gray-900 mx-auto mb-4 rounded-sm flex items-center justify-center relative">
            <div
              className="w-full h-full opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }}
            />
            <span className="absolute text-gray-600 font-bold tracking-widest opacity-50">
              TELLY AUDIO
            </span>
            {/* Mute indicator */}
            {isMuted && (
              <span className="absolute right-4 text-red-500 text-sm">MUTED</span>
            )}
          </div>

          {/* Bottom Display Container */}
          <div className="w-[1920px] h-[360px] mx-auto flex flex-col">
            {renderBottomSection()}
          </div>
        </div>

        {/* Controls overlay */}
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
          <button
            onClick={() => setShowRemote(!showRemote)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title={showRemote ? 'Hide Remote' : 'Show Remote'}
          >
            {showRemote ? (
              <EyeOff className="w-5 h-5 text-white" />
            ) : (
              <Eye className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={onExit}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Exit Preview"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Screen indicator */}
        <div className="absolute bottom-4 left-4 text-white/50 text-sm z-20">
          <span className="font-mono">
            Active: {activeScreen === 'theater' ? 'Theater Display (A)' : 'Smart Screen'} |
            Focus: Zone {focusedZone}
            {streamModeActive && focusedZoneHasStream() && (
              <span className="text-cyan-400"> | Stream Grid (use arrows)</span>
            )}
          </span>
        </div>
      </div>

      {/* Remote Panel */}
      {showRemote && (
        <div className="w-60 bg-[#1a1a1a] border-l border-white/10 p-4 flex flex-col items-center justify-center">
          <h3 className="text-white text-sm font-medium mb-4">Telly Remote</h3>
          <TellyRemote
            onButtonPress={handleRemotePress}
            activeScreen={activeScreen}
            isPoweredOn={isPoweredOn}
            isMuted={isMuted}
            volume={volume}
          />
        </div>
      )}
    </div>
  );
};

function getDefaultContent(zone: ZoneId): string {
  const colors: Record<ZoneId, string> = {
    A: '#1e293b',
    B: '#1e3a5f',
    C: '#0f172a',
    D: '#172554',
    E: '#020617',
    F: '#1e3a5f',
  };

  const dimensions: Record<ZoneId, string> = {
    A: '1920x1080',
    B: '1920x360',
    C: '1280x300',
    D: '640x300',
    E: '1920x60',
    F: '1920x300',
  };

  const descriptions: Record<ZoneId, string> = {
    A: 'Main Screen',
    B: 'Full Bottom Screen',
    C: 'Bottom Left Widget',
    D: 'Bottom Right Ad Block',
    E: 'News Ticker',
    F: 'Combined C+D Area',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center; background-color: ${colors[zone]}; color: white; font-family: sans-serif; overflow: hidden; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h1 class="text-4xl font-bold mb-2">Zone ${zone}</h1>
          <p class="text-sm text-gray-400 mb-1">${descriptions[zone]}</p>
          <p class="text-xs text-gray-500">${dimensions[zone]}</p>
        </div>
      </body>
    </html>
  `;
}

export default FullscreenView;
