import React, { useEffect, useCallback } from 'react';
import {
  Power,
  Mic,
  ArrowLeft,
  Home,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  VolumeX,
  Volume2,
  Menu,
  MonitorUp,
  Monitor
} from 'lucide-react';

export type RemoteButton =
  | 'power'
  | 'input'
  | 'mic'
  | 'back'
  | 'home'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'select'
  | 'a'
  | 'b'
  | 'mute'
  | 'volume_up'
  | 'volume_down'
  | 'menu';

interface TellyRemoteProps {
  onButtonPress: (button: RemoteButton) => void;
  activeScreen: 'theater' | 'smart'; // A = theater (top), B = smart (bottom)
  isPoweredOn: boolean;
  isMuted: boolean;
  volume: number;
}

const TellyRemote: React.FC<TellyRemoteProps> = ({
  onButtonPress,
  activeScreen,
  isPoweredOn,
  isMuted,
  volume,
}) => {
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default for navigation keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace'].includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowUp':
        onButtonPress('up');
        break;
      case 'ArrowDown':
        onButtonPress('down');
        break;
      case 'ArrowLeft':
        onButtonPress('left');
        break;
      case 'ArrowRight':
        onButtonPress('right');
        break;
      case 'Enter':
        onButtonPress('select');
        break;
      case 'Escape':
      case 'Backspace':
        onButtonPress('back');
        break;
      case 'h':
      case 'H':
        onButtonPress('home');
        break;
      case 'a':
      case 'A':
        if (!e.ctrlKey && !e.metaKey) onButtonPress('a');
        break;
      case 'b':
      case 'B':
        if (!e.ctrlKey && !e.metaKey) onButtonPress('b');
        break;
      case 'm':
      case 'M':
        onButtonPress('mute');
        break;
      case '+':
      case '=':
        onButtonPress('volume_up');
        break;
      case '-':
      case '_':
        onButtonPress('volume_down');
        break;
      case 'p':
      case 'P':
        onButtonPress('power');
        break;
    }
  }, [onButtonPress]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const RemoteButton: React.FC<{
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
    title?: string;
    active?: boolean;
  }> = ({ onClick, className = '', children, title, active }) => (
    <button
      onClick={onClick}
      title={title}
      className={`
        flex items-center justify-center transition-all duration-150
        active:scale-95 active:brightness-75
        ${active ? 'ring-2 ring-red-500' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col items-center">
      {/* Remote body */}
      <div
        className="relative bg-gradient-to-b from-[#4a4a4a] to-[#3a3a3a] rounded-[40px] p-6 shadow-2xl"
        style={{ width: '180px' }}
      >
        {/* Mic hole */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/50 rounded-full" />

        {/* Top row - Power and Input */}
        <div className="flex justify-between mb-4">
          <RemoteButton
            onClick={() => onButtonPress('power')}
            className={`w-10 h-10 rounded-full ${isPoweredOn ? 'bg-[#2a2a2a]' : 'bg-red-600'} hover:brightness-110`}
            title="Power (P)"
          >
            <Power className={`w-5 h-5 ${isPoweredOn ? 'text-gray-400' : 'text-white'}`} />
          </RemoteButton>
          <RemoteButton
            onClick={() => onButtonPress('input')}
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:brightness-110"
            title="Input"
          >
            <MonitorUp className="w-5 h-5 text-gray-400" />
          </RemoteButton>
        </div>

        {/* Mic button */}
        <div className="flex justify-center mb-4">
          <RemoteButton
            onClick={() => onButtonPress('mic')}
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:brightness-110"
            title="Voice Assistant"
          >
            <Mic className="w-5 h-5 text-gray-400" />
          </RemoteButton>
        </div>

        {/* Navigation row - Back, Switch bar, Home */}
        <div className="flex justify-between items-center mb-3">
          <RemoteButton
            onClick={() => onButtonPress('back')}
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:brightness-110"
            title="Back (Esc)"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </RemoteButton>

          {/* Screen switch indicator */}
          <div className="flex items-center space-x-1 px-2 py-1 bg-[#2a2a2a] rounded-full">
            <div className={`w-2 h-2 rounded-full transition-colors ${activeScreen === 'theater' ? 'bg-red-500' : 'bg-gray-600'}`} />
            <div className="w-4 h-0.5 bg-gray-600" />
            <div className={`w-2 h-2 rounded-full transition-colors ${activeScreen === 'smart' ? 'bg-red-500' : 'bg-gray-600'}`} />
          </div>

          <RemoteButton
            onClick={() => onButtonPress('home')}
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:brightness-110"
            title="Home (H)"
          >
            <Home className="w-5 h-5 text-gray-400" />
          </RemoteButton>
        </div>

        {/* D-Pad */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          {/* Outer ring */}
          <div className="absolute inset-0 bg-[#2a2a2a] rounded-full" />

          {/* Up */}
          <RemoteButton
            onClick={() => onButtonPress('up')}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 hover:bg-white/10 rounded-t-full"
            title="Up (↑)"
          >
            <ChevronUp className="w-6 h-6 text-gray-400" />
          </RemoteButton>

          {/* Down */}
          <RemoteButton
            onClick={() => onButtonPress('down')}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 hover:bg-white/10 rounded-b-full"
            title="Down (↓)"
          >
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </RemoteButton>

          {/* Left */}
          <RemoteButton
            onClick={() => onButtonPress('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 hover:bg-white/10 rounded-l-full"
            title="Left (←)"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </RemoteButton>

          {/* Right */}
          <RemoteButton
            onClick={() => onButtonPress('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 hover:bg-white/10 rounded-r-full"
            title="Right (→)"
          >
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </RemoteButton>

          {/* Select (center) */}
          <RemoteButton
            onClick={() => onButtonPress('select')}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#3a3a3a] rounded-full hover:bg-[#4a4a4a] border-2 border-[#505050]"
            title="Select (Enter)"
          >
            <span className="text-xs text-gray-400 font-medium">Select</span>
          </RemoteButton>
        </div>

        {/* A and B buttons */}
        <div className="flex justify-center space-x-6 mb-4">
          <RemoteButton
            onClick={() => onButtonPress('a')}
            className={`w-12 h-8 rounded-md text-sm font-bold transition-colors ${
              activeScreen === 'theater'
                ? 'bg-red-600 text-white'
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
            }`}
            title="Theater Display (A)"
            active={activeScreen === 'theater'}
          >
            A
          </RemoteButton>
          <div className="w-6 h-0.5 bg-gray-600 self-center" />
          <RemoteButton
            onClick={() => onButtonPress('b')}
            className={`w-12 h-8 rounded-md text-sm font-bold transition-colors ${
              activeScreen === 'smart'
                ? 'bg-red-600 text-white'
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
            }`}
            title="Smart Screen (B)"
            active={activeScreen === 'smart'}
          >
            B
          </RemoteButton>
        </div>

        {/* Bottom controls - Mute, Volume, Menu */}
        <div className="flex justify-between items-center mb-4">
          <RemoteButton
            onClick={() => onButtonPress('mute')}
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:brightness-110"
            title="Mute (M)"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-400" />
            )}
          </RemoteButton>

          {/* Volume rocker */}
          <div className="flex flex-col bg-[#2a2a2a] rounded-full overflow-hidden">
            <RemoteButton
              onClick={() => onButtonPress('volume_up')}
              className="w-10 h-8 hover:bg-white/10"
              title="Volume Up (+)"
            >
              <span className="text-gray-400 text-lg font-bold">+</span>
            </RemoteButton>
            <div className="w-full h-px bg-gray-600" />
            <RemoteButton
              onClick={() => onButtonPress('volume_down')}
              className="w-10 h-8 hover:bg-white/10"
              title="Volume Down (-)"
            >
              <span className="text-gray-400 text-lg font-bold">−</span>
            </RemoteButton>
          </div>

          <RemoteButton
            onClick={() => onButtonPress('menu')}
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:brightness-110"
            title="Menu"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </RemoteButton>
        </div>

        {/* Volume indicator */}
        <div className="flex items-center justify-center space-x-1 mb-4">
          <span className="text-xs text-gray-500">Vol:</span>
          <div className="w-20 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 transition-all"
              style={{ width: `${volume}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{volume}</span>
        </div>

        {/* Bottom red section (IR blaster area) */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-red-600 to-red-700 rounded-b-[40px]" />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-xs text-gray-500 text-center max-w-[200px]">
        <p className="font-medium mb-1">Keyboard Shortcuts</p>
        <p>Arrows: Navigate | Enter: Select</p>
        <p>A/B: Switch screens | M: Mute</p>
        <p>+/-: Volume | Esc: Back | H: Home</p>
      </div>
    </div>
  );
};

export default TellyRemote;
