import type { PrototypeVersion, ZoneContent, LEDSettings } from '../types';

const API_BASE = '/api/prototypes';

// List all versions of a prototype
export async function listVersions(prototypeId: string): Promise<PrototypeVersion[]> {
  const response = await fetch(`${API_BASE}/${prototypeId}/versions`);
  if (!response.ok) {
    throw new Error('Failed to fetch versions');
  }
  const result = await response.json();
  return result.data;
}

// Get a specific version
export async function getVersion(prototypeId: string, versionNumber: number): Promise<PrototypeVersion> {
  const response = await fetch(`${API_BASE}/${prototypeId}/versions/${versionNumber}`);
  if (!response.ok) {
    throw new Error('Failed to fetch version');
  }
  const result = await response.json();
  return result.data;
}

// Create a new version snapshot
export async function createVersion(prototypeId: string, commitMessage?: string): Promise<PrototypeVersion> {
  const response = await fetch(`${API_BASE}/${prototypeId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commitMessage }),
  });
  if (!response.ok) {
    throw new Error('Failed to create version');
  }
  const result = await response.json();
  return result.data;
}

// Rollback to a specific version
export async function rollbackToVersion(prototypeId: string, versionNumber: number): Promise<{
  prototype: any;
  message: string;
}> {
  const response = await fetch(`${API_BASE}/${prototypeId}/rollback/${versionNumber}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to rollback');
  }
  const result = await response.json();
  return {
    prototype: result.data,
    message: result.message,
  };
}

// Compare two versions
export interface VersionDiff {
  version1: {
    versionNumber: number;
    name: string;
    createdAt: string;
    zoneContent: ZoneContent;
  };
  version2: {
    versionNumber: number;
    name: string;
    createdAt: string;
    zoneContent: ZoneContent;
  };
  changes: Record<string, { changed: boolean; added: boolean; removed: boolean }>;
  summary: {
    zonesChanged: number;
    zonesAdded: number;
    zonesRemoved: number;
  };
}

export async function compareVersions(
  prototypeId: string,
  version1: number,
  version2: number
): Promise<VersionDiff> {
  const response = await fetch(`${API_BASE}/${prototypeId}/diff/${version1}/${version2}`);
  if (!response.ok) {
    throw new Error('Failed to compare versions');
  }
  const result = await response.json();
  return result.data;
}

// Helper to format version date
export function formatVersionDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper to get relative time
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatVersionDate(dateString);
}
