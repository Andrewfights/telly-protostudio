import type { Prototype, ZoneContent, ZoneTemplate, ZoneId, ListResponse, ItemResponse } from '../types';

const STORAGE_KEYS = {
  PROTOTYPES: 'telly_prototypes',
  FAVORITES: 'telly_favorites',
  ZONE_TEMPLATES: 'telly_zone_templates',
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Prototype operations
export function listPrototypesLocal(options?: {
  search?: string;
  favoritesOnly?: boolean;
}): ListResponse<Prototype> {
  const prototypes = getStoredData<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
  const favorites = getStoredData<string[]>(STORAGE_KEYS.FAVORITES, []);

  let filtered = prototypes.map(p => ({
    ...p,
    isFavorite: favorites.includes(p.id)
  }));

  if (options?.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    );
  }

  if (options?.favoritesOnly) {
    filtered = filtered.filter(p => p.isFavorite);
  }

  // Sort by updated date descending
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    data: filtered,
    pagination: {
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
      hasMore: false
    }
  };
}

export function getPrototypeLocal(id: string): ItemResponse<Prototype> | null {
  const prototypes = getStoredData<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
  const favorites = getStoredData<string[]>(STORAGE_KEYS.FAVORITES, []);
  const prototype = prototypes.find(p => p.id === id);

  if (!prototype) return null;

  return {
    data: {
      ...prototype,
      isFavorite: favorites.includes(prototype.id)
    }
  };
}

export function createPrototypeLocal(data: {
  name: string;
  description?: string;
  zoneContent: ZoneContent;
}): ItemResponse<Prototype> {
  const prototypes = getStoredData<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
  const now = new Date().toISOString();

  const newPrototype: Prototype = {
    id: generateId(),
    name: data.name,
    description: data.description,
    zoneContent: data.zoneContent,
    createdAt: now,
    updatedAt: now,
    isFavorite: false
  };

  prototypes.push(newPrototype);
  setStoredData(STORAGE_KEYS.PROTOTYPES, prototypes);

  return { data: newPrototype };
}

export function updatePrototypeLocal(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    zoneContent: ZoneContent;
  }>
): ItemResponse<Prototype> | null {
  const prototypes = getStoredData<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
  const favorites = getStoredData<string[]>(STORAGE_KEYS.FAVORITES, []);
  const index = prototypes.findIndex(p => p.id === id);

  if (index === -1) return null;

  const updated: Prototype = {
    ...prototypes[index],
    ...data,
    updatedAt: new Date().toISOString(),
    isFavorite: favorites.includes(id)
  };

  prototypes[index] = updated;
  setStoredData(STORAGE_KEYS.PROTOTYPES, prototypes);

  return { data: updated };
}

export function deletePrototypeLocal(id: string): boolean {
  const prototypes = getStoredData<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
  const filtered = prototypes.filter(p => p.id !== id);

  if (filtered.length === prototypes.length) return false;

  setStoredData(STORAGE_KEYS.PROTOTYPES, filtered);

  // Also remove from favorites
  const favorites = getStoredData<string[]>(STORAGE_KEYS.FAVORITES, []);
  setStoredData(STORAGE_KEYS.FAVORITES, favorites.filter(f => f !== id));

  return true;
}

// Favorites
export function addFavoriteLocal(prototypeId: string): boolean {
  const favorites = getStoredData<string[]>(STORAGE_KEYS.FAVORITES, []);
  if (!favorites.includes(prototypeId)) {
    favorites.push(prototypeId);
    setStoredData(STORAGE_KEYS.FAVORITES, favorites);
  }
  return true;
}

export function removeFavoriteLocal(prototypeId: string): boolean {
  const favorites = getStoredData<string[]>(STORAGE_KEYS.FAVORITES, []);
  setStoredData(STORAGE_KEYS.FAVORITES, favorites.filter(f => f !== prototypeId));
  return true;
}

// Zone Templates
export function listZoneTemplatesLocal(options?: {
  zoneId?: ZoneId;
}): { data: ZoneTemplate[] } {
  let templates = getStoredData<ZoneTemplate[]>(STORAGE_KEYS.ZONE_TEMPLATES, []);

  if (options?.zoneId) {
    templates = templates.filter(t => t.zoneId === options.zoneId);
  }

  templates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return { data: templates };
}

export function createZoneTemplateLocal(data: {
  name: string;
  zoneId: ZoneId;
  content: string;
  description?: string;
}): ItemResponse<ZoneTemplate> {
  const templates = getStoredData<ZoneTemplate[]>(STORAGE_KEYS.ZONE_TEMPLATES, []);
  const now = new Date().toISOString();

  const newTemplate: ZoneTemplate = {
    id: generateId(),
    name: data.name,
    zoneId: data.zoneId,
    content: data.content,
    description: data.description,
    createdAt: now,
    updatedAt: now
  };

  templates.push(newTemplate);
  setStoredData(STORAGE_KEYS.ZONE_TEMPLATES, templates);

  return { data: newTemplate };
}

export function deleteZoneTemplateLocal(id: string): boolean {
  const templates = getStoredData<ZoneTemplate[]>(STORAGE_KEYS.ZONE_TEMPLATES, []);
  const filtered = templates.filter(t => t.id !== id);

  if (filtered.length === templates.length) return false;

  setStoredData(STORAGE_KEYS.ZONE_TEMPLATES, filtered);
  return true;
}
