// Zone definitions
export type ZoneId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// LED definitions
export type LEDPattern = 'solid' | 'pulse' | 'breathe' | 'rainbow' | 'wave' | 'custom';

export interface LEDSettings {
  enabled: boolean;
  color: string;
  brightness: number; // 0-100
  pattern: LEDPattern;
  speed: number; // 1-10
  customCSS?: string; // For AI-generated animations
}

export interface ZoneContent {
  A: string;  // 1920x1080 - Main screen
  B: string;  // 1920x360 - Full bottom (overrides C+D+E)
  C: string;  // 1280x300 - Bottom left
  D: string;  // 640x300 - Bottom right
  E: string;  // 1920x60 - Ticker
  F: string;  // 1920x300 - Full C+D area (overrides C+D, keeps E)
}

export interface Prototype {
  id: string;
  name: string;
  description?: string;
  zoneContent: ZoneContent;
  ledSettings?: LEDSettings;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: number;
  totalVersions?: number;
  isFavorite?: boolean;
}

export interface ShareLink {
  id: string;
  prototypeId: string;
  shareCode: string;
  expiresAt?: string;
  viewCount: number;
  createdAt: string;
}

export interface ExportOptions {
  format: 'single-zone' | 'multi-zone' | 'zip-bundle';
  zone?: ZoneId;
  includeAssets: boolean;
  includeReadme: boolean;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

// API response types
export interface ListResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export interface ItemResponse<T> {
  data: T;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Media types
export type MediaType = 'image' | 'video' | 'audio';

export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  url: string; // Data URL or blob URL
  thumbnail?: string;
  generatedWith?: string; // 'imagen', 'veo3', 'musicfx', 'upload'
  prompt?: string;
  createdAt: string;
  size?: number;
  duration?: number; // For video/audio
  width?: number;
  height?: number;
}

// Zone template for saving individual zones
export interface ZoneTemplate {
  id: string;
  name: string;
  zoneId: ZoneId;
  content: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Video source configuration for streaming embeds
export type VideoSourceType = 'youtube' | 'plutotv' | 'custom-url';

export interface VideoSourceConfig {
  type: VideoSourceType;
  videoId?: string;        // YouTube video ID
  playlistId?: string;     // YouTube playlist ID
  channelSlug?: string;    // Pluto TV channel slug
  customUrl?: string;      // Custom embed URL
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
}

// Curated content item
export interface CuratedContent {
  id: string;
  name: string;
  description?: string;
  type: VideoSourceType;
  videoId?: string;
  channelSlug?: string;
  category: string;
  thumbnail?: string;
}

// Grid layout types
export type LayoutPreset = 'full' | 'grid-2x2' | 'grid-3x3' | 'thirds-h' | 'thirds-v' | 'custom';

export interface GridCell {
  id: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  content: string;
}

export interface ZoneLayout {
  preset: LayoutPreset;
  rows: number;
  cols: number;
  cells: GridCell[];
}

// Version control types
export interface PrototypeVersion {
  id: string;
  prototypeId: string;
  versionNumber: number;
  name: string;
  description?: string;
  zoneContent: ZoneContent;
  ledSettings?: LEDSettings;
  thumbnail?: string;
  commitMessage?: string;
  createdAt: string;
}

// Android APK export types
export interface AndroidExportConfig {
  prototype: Prototype;
  packageName: string;
  appName: string;
  versionCode: number;
  versionName: string;
  minSdk: number;
  targetSdk: number;
  includeMedia: boolean;
}

// Stream layout types for multi-video grids
export type StreamLayoutPreset = 'full' | '1x2' | '1x3' | '2x2' | '3x3' | '2x3';

export interface StreamCell {
  id: number;
  videoConfig?: VideoSourceConfig;
  label?: string;
}

export interface StreamLayout {
  preset: StreamLayoutPreset;
  rows: number;
  cols: number;
  cells: StreamCell[];
  globalOptions: {
    autoplay: boolean;
    muted: boolean;
    controls: boolean;
    gap: number;
    theaterMode: boolean; // Auto-maximize first cell on load
  };
}
