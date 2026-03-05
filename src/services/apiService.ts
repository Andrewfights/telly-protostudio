import type { Prototype, ZoneContent, ZoneTemplate, ZoneId, ListResponse, ItemResponse, ShareLink } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || 'Request failed');
  }
  return response.json();
}

// Prototype operations
export async function listPrototypes(options?: {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: string;
  search?: string;
  favoritesOnly?: boolean;
}): Promise<ListResponse<Prototype>> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('pageSize', String(options.pageSize));
  if (options?.sort) params.set('sort', options.sort);
  if (options?.order) params.set('order', options.order);
  if (options?.search) params.set('search', options.search);
  if (options?.favoritesOnly) params.set('favoritesOnly', 'true');

  const response = await fetch(`${API_BASE}/prototypes?${params}`);
  return handleResponse<ListResponse<Prototype>>(response);
}

export async function getPrototype(id: string): Promise<ItemResponse<Prototype>> {
  const response = await fetch(`${API_BASE}/prototypes/${id}`);
  return handleResponse<ItemResponse<Prototype>>(response);
}

export async function createPrototype(data: {
  name: string;
  description?: string;
  zoneContent: ZoneContent;
  thumbnail?: string;
}): Promise<ItemResponse<Prototype>> {
  const response = await fetch(`${API_BASE}/prototypes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ItemResponse<Prototype>>(response);
}

export async function updatePrototype(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    zoneContent: ZoneContent;
    thumbnail: string;
  }>
): Promise<ItemResponse<Prototype>> {
  const response = await fetch(`${API_BASE}/prototypes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ItemResponse<Prototype>>(response);
}

export async function deletePrototype(id: string): Promise<{ data: { success: boolean } }> {
  const response = await fetch(`${API_BASE}/prototypes/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ data: { success: boolean } }>(response);
}

// Favorites operations
export async function listFavorites(options?: {
  page?: number;
  pageSize?: number;
}): Promise<ListResponse<Prototype>> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', String(options.page));
  if (options?.pageSize) params.set('pageSize', String(options.pageSize));

  const response = await fetch(`${API_BASE}/favorites?${params}`);
  return handleResponse<ListResponse<Prototype>>(response);
}

export async function addFavorite(prototypeId: string): Promise<{ data: { success: boolean; favoritedAt: string } }> {
  const response = await fetch(`${API_BASE}/favorites/${prototypeId}`, {
    method: 'POST',
  });
  return handleResponse<{ data: { success: boolean; favoritedAt: string } }>(response);
}

export async function removeFavorite(prototypeId: string): Promise<{ data: { success: boolean } }> {
  const response = await fetch(`${API_BASE}/favorites/${prototypeId}`, {
    method: 'DELETE',
  });
  return handleResponse<{ data: { success: boolean } }>(response);
}

// Share operations
export async function createShareLink(prototypeId: string, expiresIn?: number): Promise<{
  data: ShareLink & { shareUrl: string; prototypeName: string };
}> {
  const response = await fetch(`${API_BASE}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prototypeId, expiresIn }),
  });
  return handleResponse<{ data: ShareLink & { shareUrl: string; prototypeName: string } }>(response);
}

export async function getSharedPrototype(code: string): Promise<{
  data: {
    shareCode: string;
    prototype: Omit<Prototype, 'isFavorite' | 'updatedAt'>;
    viewCount: number;
    expiresAt?: string;
    createdAt: string;
  };
}> {
  const response = await fetch(`${API_BASE}/share/${code}`);
  return handleResponse<{
    data: {
      shareCode: string;
      prototype: Omit<Prototype, 'isFavorite' | 'updatedAt'>;
      viewCount: number;
      expiresAt?: string;
      createdAt: string;
    };
  }>(response);
}

export async function revokeShareLink(id: string): Promise<{ data: { success: boolean } }> {
  const response = await fetch(`${API_BASE}/share/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ data: { success: boolean } }>(response);
}

// Zone template operations
export async function listZoneTemplates(options?: {
  zoneId?: ZoneId;
  search?: string;
}): Promise<{ data: ZoneTemplate[] }> {
  const params = new URLSearchParams();
  if (options?.zoneId) params.set('zoneId', options.zoneId);
  if (options?.search) params.set('search', options.search);

  const response = await fetch(`${API_BASE}/zone-templates?${params}`);
  return handleResponse<{ data: ZoneTemplate[] }>(response);
}

export async function getZoneTemplatesForZone(zoneId: ZoneId): Promise<{ data: ZoneTemplate[] }> {
  const response = await fetch(`${API_BASE}/zone-templates/zone/${zoneId}`);
  return handleResponse<{ data: ZoneTemplate[] }>(response);
}

export async function getZoneTemplate(id: string): Promise<ItemResponse<ZoneTemplate>> {
  const response = await fetch(`${API_BASE}/zone-templates/${id}`);
  return handleResponse<ItemResponse<ZoneTemplate>>(response);
}

export async function createZoneTemplate(data: {
  name: string;
  zoneId: ZoneId;
  content: string;
  description?: string;
}): Promise<ItemResponse<ZoneTemplate>> {
  const response = await fetch(`${API_BASE}/zone-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ItemResponse<ZoneTemplate>>(response);
}

export async function updateZoneTemplate(
  id: string,
  data: Partial<{
    name: string;
    content: string;
    description: string;
  }>
): Promise<ItemResponse<ZoneTemplate>> {
  const response = await fetch(`${API_BASE}/zone-templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ItemResponse<ZoneTemplate>>(response);
}

export async function deleteZoneTemplate(id: string): Promise<{ data: { success: boolean } }> {
  const response = await fetch(`${API_BASE}/zone-templates/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ data: { success: boolean } }>(response);
}
