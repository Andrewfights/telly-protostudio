import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../config/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isFirebaseConfigured();

  // Listen for auth state changes
  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && db) {
        // Get or create user profile in Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // Update last login
            await setDoc(
              userDocRef,
              { lastLoginAt: serverTimestamp() },
              { merge: true }
            );
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: userDoc.data().createdAt?.toDate() || new Date(),
              lastLoginAt: new Date(),
            });
          } else {
            // Create new user profile
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              settings: {
                apiKeyStorageMode: 'session',
              },
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: new Date(),
              lastLoginAt: new Date(),
            });
          }
        } catch (err) {
          console.error('Error managing user profile:', err);
          // Still set basic profile from Firebase Auth
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          });
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const signInWithGoogle = async () => {
    if (!isConfigured || !auth || !googleProvider) {
      setError('Firebase is not configured. Please add your Firebase config to .env');
      return;
    }

    setError(null);
    try {
      // Set persistence to local (persists across browser sessions)
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) return;

    setError(null);
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
      console.error('Sign out error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        isConfigured,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
