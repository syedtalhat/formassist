/**
 * Firebase Auth Initialization with web-extension persistence
 * Uses firebase/auth/web-extension per Google Chrome extension guidance.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken,
  User,
  Auth,
  getAuth,
} from 'firebase/auth/web-extension';
import {
  firebaseConfig,
  isMockMode,
  isEmulatorMode,
  authEmulatorHost,
  getApiMode,
} from './firebase-config';

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (authInstance) {
    return authInstance;
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    try {
      authInstance = initializeAuth(app, {
        persistence: indexedDBLocalPersistence,
      });
    } catch {
      // In case initializeAuth was already called on this app
      authInstance = getAuth(app);
    }

    if (isEmulatorMode && authInstance) {
      connectAuthEmulator(authInstance, `http://${authEmulatorHost}`, {
        disableWarnings: true,
      });
    }
  } catch (err) {
    console.warn('Firebase Auth initialization warning:', err);
  }

  return authInstance;
}

export interface AuthStateResult {
  uid: string;
  email: string | null;
  displayName: string | null;
  authProvider?: 'firebase' | 'local';
}

export function formatAuthError(err: { code?: string; message?: string }): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please check Firebase settings.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed login attempts. Try again in a minute.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    default:
      return err?.message?.replace(/^Firebase:\s*(Error\s*)?\(auth\/[^)]+\)\.?\s*/i, '') || 'Authentication failed. Please check your details.';
  }
}

function isBackendUnavailable(err: { code?: string; message?: string }): boolean {
  return (
    err.code === 'auth/network-request-failed' ||
    err.code === 'auth/api-key-not-valid' ||
    err.code === 'auth/invalid-api-key' ||
    err.code === 'auth/operation-not-allowed' ||
    err.code === 'unavailable' ||
    err.code === 'auth/internal-error' ||
    /failed to fetch|network error/i.test(err.message || '')
  );
}

function createLocalProfile(email: string): AuthStateResult {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    uid: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    displayName: normalizedEmail.split('@')[0],
    authProvider: 'local',
  };
}

async function saveLocalProfile(profile: AuthStateResult): Promise<AuthStateResult> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    throw new Error('Local storage is not available. Please continue without an account.');
  }
  await chrome.storage.local.set({ user_profile: profile });
  return profile;
}

async function getLocalProfile(email: string): Promise<AuthStateResult | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
  const { user_profile: profile } = await chrome.storage.local.get('user_profile');
  if (profile?.authProvider === 'local' && profile.email?.toLowerCase() === email.trim().toLowerCase()) {
    return profile as AuthStateResult;
  }
  return null;
}

export async function signUpUser(email: string, password: string): Promise<AuthStateResult> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) throw new Error('Email address is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long.');

  if (await getApiMode() === 'mock') {
    return saveLocalProfile(createLocalProfile(trimmedEmail));
  }

  const auth = getFirebaseAuth();
  if (!auth) return saveLocalProfile(createLocalProfile(trimmedEmail));

  try {
    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const result: AuthStateResult = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName || trimmedEmail.split('@')[0],
      authProvider: 'firebase',
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ user_profile: result });
    }
    return result;
  } catch (err: any) {
    console.error('Firebase signUp error:', err);
    if (isBackendUnavailable(err)) {
      console.warn('Firebase is unavailable; saving this profile on this device only.');
      return saveLocalProfile(createLocalProfile(trimmedEmail));
    }
    throw new Error(formatAuthError(err));
  }
}

export async function signInUser(email: string, password: string): Promise<AuthStateResult> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) throw new Error('Email address is required.');
  if (!password) throw new Error('Password is required.');

  if (await getApiMode() === 'mock') {
    const localProfile = await getLocalProfile(trimmedEmail);
    if (localProfile) return localProfile;
    throw new Error('No local profile was found for this email. Create an account on this device first.');
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    const localProfile = await getLocalProfile(trimmedEmail);
    if (localProfile) return localProfile;
    throw new Error('Authentication service is not available.');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const result: AuthStateResult = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName || trimmedEmail.split('@')[0],
      authProvider: 'firebase',
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ user_profile: result });
    }
    return result;
  } catch (err: any) {
    console.error('Firebase signIn error:', err);
    if (isBackendUnavailable(err)) {
      const localProfile = await getLocalProfile(trimmedEmail);
      if (localProfile) {
        console.warn('Firebase is unavailable; using the profile saved on this device.');
        return localProfile;
      }
    }
    throw new Error(formatAuthError(err));
  }
}

export async function signOutCurrentUser(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.remove(['user_profile']);
  }

  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut warning:', err);
    }
  }
}

export async function getUserIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth || !auth.currentUser) {
    return null;
  }

  try {
    return await getIdToken(auth.currentUser, false);
  } catch (err) {
    console.error('Failed to get Firebase ID token:', err);
    return null;
  }
}

export function subscribeToAuthChanges(callback: (user: AuthStateResult | null) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes.user_profile) {
      callback(changes.user_profile.newValue || null);
    }
  };
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(listener);
  }

  const unsubscribeStorage = () => {
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.removeListener(listener);
    }
  };

  if (isMockMode) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      void chrome.storage.local.get('user_profile').then(({ user_profile }) => callback(user_profile || null));
    } else {
      callback(null);
    }
    return unsubscribeStorage;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      void chrome.storage.local.get('user_profile').then(({ user_profile }) => callback(user_profile || null));
    } else {
      callback(null);
    }
    return unsubscribeStorage;
  }

  const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        authProvider: 'firebase',
      });
    } else if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      void chrome.storage.local.get('user_profile').then(({ user_profile }) => callback(user_profile || null));
    } else {
      callback(null);
    }
  });
  return () => {
    unsubscribeAuth();
    unsubscribeStorage();
  };
}
