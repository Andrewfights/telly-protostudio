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
