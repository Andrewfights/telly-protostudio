import React, { useEffect, useRef, useState } from 'react';
import type { ZoneId, ZoneContent, LEDSettings } from '../types';

interface TellyDeviceProps {
  zoneContent: ZoneContent;
  selectedZone: ZoneId | null;
  onSelectZone: (zone: ZoneId) => void;
  ledSettings?: LEDSettings;
}

const TellyDevice: React.FC<TellyDeviceProps> = ({ zoneContent, selectedZone, onSelectZone, ledSettings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Generate LED glow styles
  const getLEDStyles = () => {
    if (!ledSettings?.enabled) return {};

    const color = ledSettings.color;
    const brightness = ledSettings.brightness / 100;
    const speed = 11 - ledSettings.speed; // Invert so higher = faster

    let animation = '';
    let boxShadow = `0 0 ${60 * brightness}px ${30 * brightness}px ${color}${Math.round(brightness * 99).toString(16).padStart(2, '0')}`;

    switch (ledSettings.pattern) {
      case 'pulse':
        animation = `ledPulse ${speed * 0.5}s ease-in-out infinite`;
        break;
      case 'breathe':
        animation = `ledBreathe ${speed}s ease-in-out infinite`;
        break;
      case 'rainbow':
        animation = `ledRainbow ${speed * 2}s linear infinite`;
        boxShadow = `0 0 ${60 * brightness}px ${30 * brightness}px currentColor`;
        break;
      case 'wave':
        animation = `ledWave ${speed}s ease-in-out infinite`;
        break;
      case 'custom':
        if (ledSettings.customCSS) {
          // Custom CSS animation from AI
          return {
            boxShadow,
            animation: ledSettings.customCSS
          };
        }
        break;
    }

    return { boxShadow, animation };
  };

  // Check if Zone B has content (overrides C+D+E+F)
  const hasZoneBContent = Boolean(zoneContent.B && zoneContent.B.trim());
  // Check if Zone F has content (overrides C+D, keeps E)
  const hasZoneFContent = Boolean(zoneContent.F && zoneContent.F.trim());

  // Auto-scale the device to fit the container
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const deviceWidth = 2000; // 1920 + bezel
        const deviceHeight = 1600; // 1080 + 100 + 360 + bezel

        const scaleX = (containerWidth - 40) / deviceWidth;
        const scaleY = (containerHeight - 40) / deviceHeight;

        setScale(Math.min(scaleX, scaleY, 1)); // Max scale 1
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const renderIframe = (zone: ZoneId, width: number, height: number) => {
    const isSelected = selectedZone === zone;
    const content = zoneContent[zone];

    return (
      <div
        className={`relative transition-all duration-200 ${isSelected ? 'ring-4 ring-blue-500 z-10' : 'hover:ring-2 hover:ring-blue-500/50'}`}
        style={{ width, height }}
        onClick={() => onSelectZone(zone)}
      >
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity z-20 pointer-events-none">
          Zone {zone} ({width}x{height})
        </div>
        <iframe
          title={`Zone ${zone}`}
          srcDoc={content || getDefaultContent(zone)}
          className="w-full h-full border-none bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        {/* Overlay to capture clicks for selection, disabled when active so we can interact with iframe */}
        {!isSelected && (
          <div className="absolute inset-0 bg-transparent cursor-pointer z-10" />
        )}
      </div>
    );
  };

  // Render bottom section based on zone priority: B > F > C+D+E
  // Also show B or F when selected (even without content) for preview
  const renderBottomSection = () => {
    // Show Zone B if it has content OR if it's selected
    if (hasZoneBContent || selectedZone === 'B') {
      // Zone B: Full Bottom Screen (overrides C+D+E+F)
      return renderIframe('B', 1920, 360);
    }

    // Show Zone F if it has content OR if it's selected
    if (hasZoneFContent || selectedZone === 'F') {
      // Zone F: Combined C+D area (keeps E visible)
      return (
        <>
          <div className="h-[300px] w-full">
            {renderIframe('F', 1920, 300)}
          </div>
          <div className="h-[60px] w-full">
            {renderIframe('E', 1920, 60)}
          </div>
        </>
      );
    }

    // Default: Individual C+D+E zones
    return (
      <>
        <div className="flex h-[300px] w-full">
          {renderIframe('C', 1280, 300)}
          {renderIframe('D', 640, 300)}
        </div>
        <div className="h-[60px] w-full">
          {renderIframe('E', 1920, 60)}
        </div>
      </>
    );
  };

  const ledStyles = getLEDStyles();

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-[#1a1a1a] overflow-hidden relative">
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

      {/* LED Glow Layer (behind the device) */}
      {ledSettings?.enabled && (
        <div
          className="absolute rounded-2xl pointer-events-none"
          style={{
            width: (1920 + 32) * scale + 40,
            height: (1080 + 100 + 360 + 32 + 16) * scale + 40,
            ...ledStyles,
            zIndex: 0,
          }}
        />
      )}

      <div
        className="relative bg-[#0a0a0a] shadow-2xl rounded-lg p-4 border border-gray-800"
        style={{
          width: 1920 + 32, // + padding
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          zIndex: 1,
        }}
      >
        {/* Main Display (Zone A) */}
        <div className="flex justify-center mb-4">
          {renderIframe('A', 1920, 1080)}
        </div>

        {/* Soundbar / Grille Area (Visual Only) */}
        <div className="w-[1920px] h-[100px] bg-gradient-to-b from-gray-800 to-gray-900 mx-auto mb-4 rounded-sm flex items-center justify-center">
          <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
          <span className="absolute text-gray-600 font-bold tracking-widest opacity-50">TELLY AUDIO</span>
        </div>

        {/* Bottom Display Container */}
        <div className="w-[1920px] h-[360px] mx-auto flex flex-col">
          {renderBottomSection()}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-white/50 text-sm font-mono">
        Scale: {(scale * 100).toFixed(0)}%
      </div>
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
          <p class="text-gray-500 mt-4">Waiting for prompt...</p>
        </div>
      </body>
    </html>
  `;
}

export default TellyDevice;
