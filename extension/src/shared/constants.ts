/**
 * Shared Constants for FormAssist
 * Cites SRS v1.2: FR-UI.1-4, NFR-PRIV.1-4, DESIGN.md
 */

import { Language } from './types';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const RISK_DISCLAIMER = 'This check is a second opinion, not a guarantee.';

export const SOURCE_LABELS = {
  official: 'From official source',
  page: 'From this page',
  ai: "AI's general knowledge",
} as const;

export const TAG_LABELS = {
  required: 'Required',
  optional: 'Optional',
  unusual: 'Review needed',
} as const;

export const DEFAULT_PREFERENCES = {
  defaultLanguage: 'en' as Language,
  voiceSpeed: 'normal' as const,
};

export const SENSITIVE_PATTERNS = [
  /otp/i,
  /cvv/i,
  /pin/i,
  /mpin/i,
  /card.?number/i,
  /security.?code/i,
];

// Domains recognized as banking / financial where financial fields are standard
export const BANKING_DOMAINS_ALLOWLIST = [
  'onlinesbi.sbi',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'bankofbaroda.in',
  'punjabnationalbank.in',
  'canarabank.com',
  'bank.example',
];
