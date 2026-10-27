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

interface LocalAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
}

async function computeHash(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

async function getLocalAccounts(): Promise<Record<string, LocalAccountRecord>> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return {};
  const res = await chrome.storage.local.get(['local_accounts']);
  return (res.local_accounts as Record<string, LocalAccountRecord>) || {};
}

async function saveLocalAccount(email: string, password: string): Promise<AuthStateResult> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    throw new Error('Local storage is not available in your browser.');
  }
  const accounts = await getLocalAccounts();
  const normalized = email.trim().toLowerCase();
  if (accounts[normalized]) {
    throw new Error('This email address is already registered. Please sign in instead.');
  }

  const salt = Math.random().toString(36).slice(2, 10);
  const passwordHash = await computeHash(password, salt);
  const uid = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const displayName = normalized.split('@')[0];

  accounts[normalized] = {
    uid,
    email: normalized,
    displayName,
    salt,
    passwordHash,
    createdAt: Date.now(),
  };

  await chrome.storage.local.set({ local_accounts: accounts });

  const profile: AuthStateResult = {
    uid,
    email: normalized,
    displayName,
    authProvider: 'local',
  };
  await chrome.storage.local.set({ user_profile: profile });
  return profile;
}

async function verifyLocalAccount(email: string, password: string): Promise<AuthStateResult | null> {
  const accounts = await getLocalAccounts();
  const normalized = email.trim().toLowerCase();
  const record = accounts[normalized];
  if (!record) {
    return null;
  }

  const calculatedHash = await computeHash(password, record.salt);
  if (calculatedHash !== record.passwordHash) {
    throw new Error('Incorrect password. Please verify your password and try again.');
  }

  const profile: AuthStateResult = {
    uid: record.uid,
    email: record.email,
    displayName: record.displayName,
    authProvider: 'local',
  };
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ user_profile: profile });
  }
  return profile;
}

export async function signUpUser(email: string, password: string): Promise<AuthStateResult> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) throw new Error('Email address is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const mode = await getApiMode();

  // In mock mode, register in secure local storage
  if (mode === 'mock') {
    return saveLocalAccount(trimmedEmail, password);
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return saveLocalAccount(trimmedEmail, password);
  }

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
      // Cache local credentials for offline fallback
      try {
        const accounts = await getLocalAccounts();
        const norm = trimmedEmail.toLowerCase();
        const salt = Math.random().toString(36).slice(2, 10);
        accounts[norm] = {
          uid: result.uid,
          email: norm,
          displayName: result.displayName || norm.split('@')[0],
          salt,
          passwordHash: await computeHash(password, salt),
          createdAt: Date.now(),
        };
        await chrome.storage.local.set({ local_accounts: accounts });
      } catch {
        // non-blocking
      }
    }
    return result;
  } catch (err: any) {
    console.warn('Firebase signUp failed:', err?.code || err?.message || err);

    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already registered. Please sign in instead.');
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }

    if (isBackendUnavailable(err)) {
      console.info('Backend unavailable during signUp, saving account to local storage...');
      return saveLocalAccount(trimmedEmail, password);
    }

    throw new Error(formatAuthError(err));
  }
}

export async function signInUser(email: string, password: string): Promise<AuthStateResult> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) throw new Error('Email address is required.');
  if (!password) throw new Error('Password is required.');

  const mode = await getApiMode();

  if (mode === 'mock') {
    const verified = await verifyLocalAccount(trimmedEmail, password);
    if (!verified) {
      throw new Error('No account found with this email. Please create an account first.');
    }
    return verified;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    const verified = await verifyLocalAccount(trimmedEmail, password);
    if (!verified) {
      throw new Error('No account found with this email. Please create an account first.');
    }
    return verified;
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
      try {
        const accounts = await getLocalAccounts();
        const norm = trimmedEmail.toLowerCase();
        const salt = Math.random().toString(36).slice(2, 10);
        accounts[norm] = {
          uid: result.uid,
          email: norm,
          displayName: result.displayName || norm.split('@')[0],
          salt,
          passwordHash: await computeHash(password, salt),
          createdAt: Date.now(),
        };
        await chrome.storage.local.set({ local_accounts: accounts });
      } catch {
        // non-blocking
      }
    }
    return result;
  } catch (err: any) {
    console.warn('Firebase signIn failed:', err?.code || err?.message || err);

    if (
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/user-not-found'
    ) {
      // Check if user was registered in local storage
      const accounts = await getLocalAccounts();
      const norm = trimmedEmail.toLowerCase();
      if (accounts[norm]) {
        return (await verifyLocalAccount(trimmedEmail, password))!;
      }
      if (err.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please check your credentials or create an account.');
      }
      throw new Error('Incorrect email or password. Please verify your credentials and try again.');
    }

    if (isBackendUnavailable(err)) {
      console.info('Backend unavailable during signIn, verifying credentials from local storage...');
      const verified = await verifyLocalAccount(trimmedEmail, password);
      if (!verified) {
        throw new Error('No local account found with this email. Please check your credentials or create an account.');
      }
      return verified;
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
  if (auth && auth.currentUser) {
    try {
      return await getIdToken(auth.currentUser, false);
    } catch (err) {
      console.warn('Failed to get Firebase ID token:', err);
    }
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const { user_profile } = await chrome.storage.local.get('user_profile');
      if (user_profile?.uid) {
        return `local_token_${user_profile.uid}`;
      }
    } catch {
      // ignore
    }
  }

  return null;
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
