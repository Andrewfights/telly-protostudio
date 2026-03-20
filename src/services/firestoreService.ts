import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  increment,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db, auth, isFirebaseConfigured } from '../config/firebase';
import type { Prototype, ZoneContent, LEDSettings, ZoneTemplate, ZoneId } from '../types';

// Firestore collection names
const COLLECTIONS = {
  PROTOTYPES: 'prototypes',
  USERS: 'users',
  ZONE_TEMPLATES: 'zoneTemplates',
};

// Convert Firestore timestamp to ISO string
const toISOString = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

// Check if user is authenticated
const requireAuth = () => {
  if (!auth) {
    throw new Error('Firebase is not configured');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to perform this action');
  }
  return user;
};

// Check if Firestore is available
const requireDb = () => {
  if (!db) {
    throw new Error('Firebase is not configured');
  }
  return db;
};

// ============================================
// PROTOTYPES
// ============================================

interface ListPrototypesOptions {
  page?: number;
  pageSize?: number;
  sort?: 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  search?: string;
  favoritesOnly?: boolean;
  publicOnly?: boolean;
}

interface ListPrototypesResponse {
  data: Prototype[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export async function listPrototypes(
  options: ListPrototypesOptions = {}
): Promise<ListPrototypesResponse> {
  if (!isFirebaseConfigured() || !db) {
    return { data: [], pagination: { total: 0, page: 1, pageSize: 20, hasMore: false } };
  }

  const user = auth?.currentUser;
  const {
    page = 1,
    pageSize = 20,
    sort = 'updatedAt',
    order = 'desc',
    favoritesOnly = false,
    publicOnly = false,
  } = options;

  try {
    const prototypesRef = collection(db, COLLECTIONS.PROTOTYPES);

    // Build query constraints
    const constraints: Parameters<typeof query>[1][] = [];

    if (publicOnly) {
      // Show all public prototypes
      constraints.push(where('isPublic', '==', true));
    } else if (user) {
      // Show user's own prototypes
      constraints.push(where('ownerId', '==', user.uid));
    } else {
      // Not logged in, show nothing (or could show public)
      return { data: [], pagination: { total: 0, page: 1, pageSize, hasMore: false } };
    }

    if (favoritesOnly) {
      constraints.push(where('isFavorite', '==', true));
    }

    // Sort
    constraints.push(orderBy(sort, order));
    constraints.push(limit(pageSize + 1)); // +1 to check if there's more

    const q = query(prototypesRef, ...constraints);
    const snapshot = await getDocs(q);

    const prototypes: Prototype[] = [];
    snapshot.docs.slice(0, pageSize).forEach((docSnap) => {
      const data = docSnap.data();
      prototypes.push({
        id: docSnap.id,
        name: data.name,
        description: data.description,
        zoneContent: data.zoneContent,
        ledSettings: data.ledSettings,
        thumbnail: data.thumbnail,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
        currentVersion: data.currentVersion || 1,
        totalVersions: data.totalVersions || 1,
        isFavorite: data.isFavorite || false,
      });
    });

    return {
      data: prototypes,
      pagination: {
        total: prototypes.length, // Firestore doesn't give total count easily
        page,
        pageSize,
        hasMore: snapshot.docs.length > pageSize,
      },
    };
  } catch (error) {
    console.error('Error listing prototypes:', error);
    throw error;
  }
}

export async function getPrototype(id: string): Promise<Prototype | null> {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    const docRef = doc(db, COLLECTIONS.PROTOTYPES, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();

    // Check access: must be owner or prototype must be public
    const user = auth?.currentUser;
    if (!data.isPublic && (!user || data.ownerId !== user.uid)) {
      throw new Error('Access denied');
    }

    return {
      id: docSnap.id,
      name: data.name,
      description: data.description,
      zoneContent: data.zoneContent,
      ledSettings: data.ledSettings,
      thumbnail: data.thumbnail,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
      currentVersion: data.currentVersion || 1,
      totalVersions: data.totalVersions || 1,
      isFavorite: data.isFavorite || false,
    };
  } catch (error) {
    console.error('Error getting prototype:', error);
    throw error;
  }
}

export async function createPrototype(
  name: string,
  zoneContent: ZoneContent,
  description?: string,
  ledSettings?: LEDSettings,
  thumbnail?: string
): Promise<Prototype> {
  const user = requireAuth();

  const id = nanoid();
  const now = serverTimestamp();

  const prototypeData = {
    name,
    description: description || '',
    zoneContent,
    ledSettings: ledSettings || null,
    thumbnail: thumbnail || null,
    ownerId: user.uid,
    ownerName: user.displayName || user.email || 'Anonymous',
    isPublic: false,
    shareCode: null,
    viewCount: 0,
    isFavorite: false,
    currentVersion: 1,
    totalVersions: 1,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, COLLECTIONS.PROTOTYPES, id);
  await setDoc(docRef, prototypeData);

  return {
    id,
    name,
    description,
    zoneContent,
    ledSettings,
    thumbnail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentVersion: 1,
    totalVersions: 1,
    isFavorite: false,
  };
}

export async function updatePrototype(
  id: string,
  updates: {
    name?: string;
    description?: string;
    zoneContent?: ZoneContent;
    ledSettings?: LEDSettings;
    thumbnail?: string;
  }
): Promise<Prototype> {
  const user = requireAuth();

  // First check ownership
  const docRef = doc(db, COLLECTIONS.PROTOTYPES, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Prototype not found');
  }

  const data = docSnap.data();
  if (data.ownerId !== user.uid) {
    throw new Error('You do not own this prototype');
  }

  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, updateData);

  return {
    id,
    name: updates.name || data.name,
    description: updates.description || data.description,
    zoneContent: updates.zoneContent || data.zoneContent,
    ledSettings: updates.ledSettings || data.ledSettings,
    thumbnail: updates.thumbnail || data.thumbnail,
    createdAt: toISOString(data.createdAt),
    updatedAt: new Date().toISOString(),
    currentVersion: data.currentVersion || 1,
    totalVersions: data.totalVersions || 1,
    isFavorite: data.isFavorite || false,
  };
}

export async function deletePrototype(id: string): Promise<void> {
  const user = requireAuth();

  const docRef = doc(db, COLLECTIONS.PROTOTYPES, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Prototype not found');
  }

  if (docSnap.data().ownerId !== user.uid) {
    throw new Error('You do not own this prototype');
  }

  await deleteDoc(docRef);
}

// ============================================
// FAVORITES
// ============================================

export async function toggleFavorite(prototypeId: string): Promise<boolean> {
  const user = requireAuth();

  const docRef = doc(db, COLLECTIONS.PROTOTYPES, prototypeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Prototype not found');
  }

  if (docSnap.data().ownerId !== user.uid) {
    throw new Error('You do not own this prototype');
  }

  const newFavoriteStatus = !docSnap.data().isFavorite;
  await updateDoc(docRef, { isFavorite: newFavoriteStatus });

  return newFavoriteStatus;
}

// ============================================
// SHARING
// ============================================

export async function createShareLink(prototypeId: string): Promise<string> {
  const user = requireAuth();

  const docRef = doc(db, COLLECTIONS.PROTOTYPES, prototypeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Prototype not found');
  }

  if (docSnap.data().ownerId !== user.uid) {
    throw new Error('You do not own this prototype');
  }

  // Generate share code if not exists
  let shareCode = docSnap.data().shareCode;
  if (!shareCode) {
    shareCode = nanoid(8);
    await updateDoc(docRef, {
      shareCode,
      isPublic: true,
    });
  } else {
    // Make sure it's public
    await updateDoc(docRef, { isPublic: true });
  }

  return shareCode;
}

export async function getSharedPrototype(shareCode: string): Promise<Prototype | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const prototypesRef = collection(db, COLLECTIONS.PROTOTYPES);
    const q = query(
      prototypesRef,
      where('shareCode', '==', shareCode),
      where('isPublic', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    // Increment view count
    await updateDoc(doc(db, COLLECTIONS.PROTOTYPES, docSnap.id), {
      viewCount: increment(1),
    });

    return {
      id: docSnap.id,
      name: data.name,
      description: data.description,
      zoneContent: data.zoneContent,
      ledSettings: data.ledSettings,
      thumbnail: data.thumbnail,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
      currentVersion: data.currentVersion || 1,
      totalVersions: data.totalVersions || 1,
      isFavorite: false,
    };
  } catch (error) {
    console.error('Error getting shared prototype:', error);
    throw error;
  }
}

export async function revokeShareLink(prototypeId: string): Promise<void> {
  const user = requireAuth();

  const docRef = doc(db, COLLECTIONS.PROTOTYPES, prototypeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Prototype not found');
  }

  if (docSnap.data().ownerId !== user.uid) {
    throw new Error('You do not own this prototype');
  }

  await updateDoc(docRef, {
    shareCode: null,
    isPublic: false,
  });
}

// ============================================
// ZONE TEMPLATES
// ============================================

export async function listZoneTemplates(zoneId?: ZoneId): Promise<ZoneTemplate[]> {
  if (!isFirebaseConfigured() || !db || !auth) return [];

  const user = auth.currentUser;
  if (!user) return [];

  try {
    const templatesRef = collection(db, COLLECTIONS.ZONE_TEMPLATES);
    const constraints: Parameters<typeof query>[1][] = [
      where('ownerId', '==', user.uid),
    ];

    if (zoneId) {
      constraints.push(where('zoneId', '==', zoneId));
    }

    constraints.push(orderBy('updatedAt', 'desc'));

    const q = query(templatesRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        zoneId: data.zoneId,
        content: data.content,
        description: data.description,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
      };
    });
  } catch (error) {
    console.error('Error listing zone templates:', error);
    return [];
  }
}

export async function createZoneTemplate(
  name: string,
  zoneId: ZoneId,
  content: string,
  description?: string
): Promise<ZoneTemplate> {
  const user = requireAuth();

  const id = nanoid();
  const now = serverTimestamp();

  const templateData = {
    name,
    zoneId,
    content,
    description: description || '',
    ownerId: user.uid,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, COLLECTIONS.ZONE_TEMPLATES, id);
  await setDoc(docRef, templateData);

  return {
    id,
    name,
    zoneId,
    content,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteZoneTemplate(id: string): Promise<void> {
  const user = requireAuth();

  const docRef = doc(db, COLLECTIONS.ZONE_TEMPLATES, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Template not found');
  }

  if (docSnap.data().ownerId !== user.uid) {
    throw new Error('You do not own this template');
  }

  await deleteDoc(docRef);
}

// ============================================
// VERSION CONTROL (simplified for Firestore)
// ============================================

export async function createVersion(
  prototypeId: string,
  commitMessage?: string
): Promise<void> {
  const user = requireAuth();

  const protoRef = doc(db, COLLECTIONS.PROTOTYPES, prototypeId);
  const protoSnap = await getDoc(protoRef);

  if (!protoSnap.exists()) {
    throw new Error('Prototype not found');
  }

  const data = protoSnap.data();
  if (data.ownerId !== user.uid) {
    throw new Error('You do not own this prototype');
  }

  const newVersionNumber = (data.currentVersion || 0) + 1;

  // Create version document in subcollection
  const versionRef = doc(
    db,
    COLLECTIONS.PROTOTYPES,
    prototypeId,
    'versions',
    String(newVersionNumber)
  );

  await setDoc(versionRef, {
    versionNumber: newVersionNumber,
    name: data.name,
    zoneContent: data.zoneContent,
    ledSettings: data.ledSettings,
    commitMessage: commitMessage || `Version ${newVersionNumber}`,
    createdAt: serverTimestamp(),
  });

  // Update prototype with new version count
  await updateDoc(protoRef, {
    currentVersion: newVersionNumber,
    totalVersions: newVersionNumber,
  });
}
