import type { MediaItem, MediaType } from '../types';

const DB_NAME = 'telly-media-db';
const DB_VERSION = 1;
const STORE_NAME = 'media';

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('generatedWith', 'generatedWith', { unique: false });
      }
    };
  });
}

// Get all media items from IndexedDB
export async function getAllMedia(): Promise<MediaItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Sort by createdAt descending (newest first)
        const items = request.result as MediaItem[];
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(items);
      };
    });
  } catch (error) {
    console.error('Error loading media library:', error);
    return [];
  }
}

// Add a new media item
export async function addMedia(item: Omit<MediaItem, 'id' | 'createdAt'>): Promise<MediaItem> {
  const db = await openDB();
  const newItem: MediaItem = {
    ...item,
    id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(newItem);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(newItem);
  });
}

// Get media by ID
export async function getMediaById(id: string): Promise<MediaItem | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as MediaItem | undefined);
  });
}

// Update a media item
export async function updateMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem | undefined> {
  const db = await openDB();
  const existing = await getMediaById(id);
  if (!existing) return undefined;

  const updated = { ...existing, ...updates };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(updated);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(updated);
  });
}

// Delete a media item
export async function deleteMedia(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(true);
  });
}

// Get media by type
export async function getMediaByType(type: MediaType): Promise<MediaItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('type');
    const request = index.getAll(type);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const items = request.result as MediaItem[];
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(items);
    };
  });
}

// Get media by generation source
export async function getMediaBySource(source: string): Promise<MediaItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('generatedWith');
    const request = index.getAll(source);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const items = request.result as MediaItem[];
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(items);
    };
  });
}

// Convert file to data URL for storage
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Get file metadata
export async function getFileMetadata(file: File): Promise<{
  duration?: number;
  width?: number;
  height?: number;
}> {
  const metadata: { duration?: number; width?: number; height?: number } = {};

  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    });
  }

  if (file.type.startsWith('video/')) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve({});
      video.src = URL.createObjectURL(file);
    });
  }

  if (file.type.startsWith('audio/')) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve({ duration: audio.duration });
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => resolve({});
      audio.src = URL.createObjectURL(file);
    });
  }

  return metadata;
}

// Upload a file and add to media library
export async function uploadFile(file: File): Promise<MediaItem> {
  const dataUrl = await fileToDataURL(file);
  const metadata = await getFileMetadata(file);

  let type: MediaType = 'image';
  if (file.type.startsWith('video/')) type = 'video';
  else if (file.type.startsWith('audio/')) type = 'audio';

  return addMedia({
    type,
    name: file.name,
    url: dataUrl,
    generatedWith: 'upload',
    size: file.size,
    ...metadata,
  });
}

// Generate thumbnail for video
export async function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    video.onloadeddata = () => {
      video.currentTime = 1; // Seek to 1 second
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        reject(new Error('Could not get canvas context'));
      }
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Could not load video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = videoUrl;
  });
}

// Calculate storage usage (estimate for IndexedDB)
export async function getStorageUsage(): Promise<{ used: number; available: number; percentage: number }> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 100 * 1024 * 1024; // Default 100MB estimate
      return {
        used,
        available,
        percentage: Math.round((used / available) * 100),
      };
    }
  } catch (error) {
    console.error('Error estimating storage:', error);
  }

  // Fallback estimate
  return {
    used: 0,
    available: 100 * 1024 * 1024,
    percentage: 0,
  };
}

// Clear all media (useful for debugging)
export async function clearAllMedia(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
