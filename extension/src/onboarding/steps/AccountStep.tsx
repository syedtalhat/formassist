import React, { useState } from 'react';
import { Language } from '../../shared/types';
import { ArrowLeftIcon, SparklesIcon, CheckCircleIcon } from '../../shared/icons';

import { signUpUser, signInUser } from '../../shared/auth-init';

interface AccountStepProps {
  selectedLanguage: Language;
  onFinish: (email: string | null) => void;
  onBack: () => void;
}

export const AccountStep: React.FC<AccountStepProps> = ({
  selectedLanguage,
  onFinish,
  onBack,
}) => {
  const [isSignIn, setIsSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignIn) {
        await signInUser(email, password);
      } else {
        await signUpUser(email, password);
      }
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ default_language: selectedLanguage });
      }
      onFinish(email.trim());
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        default_language: selectedLanguage,
      });
    }
    onFinish(null);
  };

  return (
    <div className="max-w-md mx-auto py-5 flex flex-col gap-4">
      <div className="text-center flex flex-col gap-1.5">
        <div className="w-9 h-9 rounded-control bg-primary-container text-white flex items-center justify-center mx-auto mb-1 shadow-sm">
          <SparklesIcon className="w-5 h-5" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-primary-container">
          {isSignIn ? 'Welcome back' : 'Save your preferences'}
        </h1>
        <p className="font-body text-xs text-text-secondary">
          {isSignIn
            ? 'Sign in to access your saved settings.'
            : 'Keep your language preference across visits and sync your voice speed.'}
        </p>
      </div>

      <div className="bg-surface-card p-6 rounded-card border border-border-subtle shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {authError && (
            <div className="p-2.5 rounded-control bg-danger-bg border border-danger/30 text-danger text-xs font-semibold animate-fadeIn leading-relaxed">
              {authError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-text-primary uppercase tracking-wide">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (authError) setAuthError(null);
              }}
              placeholder="you@example.com"
              className="h-10 px-3 rounded-control border border-border-strong bg-white text-text-primary text-xs focus-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-text-primary uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authError) setAuthError(null);
              }}
              placeholder="••••••••"
              className="h-10 px-3 rounded-control border border-border-strong bg-white text-text-primary text-xs focus-ring"
            />
            {!isSignIn && (
              <span className="text-[10px] text-text-secondary">At least 6 characters</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-1 bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-xs transition-all shadow-sm focus-ring flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>{isSignIn ? 'Sign in' : 'Create account'}</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-border-subtle text-xs text-text-secondary">
          <span>{isSignIn ? "Don't have an account?" : 'Already have an account?'}</span>
          <button
            type="button"
            onClick={() => {
              setIsSignIn(!isSignIn);
              setAuthError(null);
            }}
            className="font-semibold text-primary-container hover:underline"
          >
            {isSignIn ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>

      {/* Guest bypass (FR-ACC.3) */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleContinueAsGuest}
          className="text-sm font-semibold text-text-secondary hover:text-text-primary underline"
        >
          Continue without an account
        </button>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-text-disabled hover:text-text-primary transition-colors mt-2"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to privacy policy</span>
        </button>
      </div>
    </div>
  );
};
