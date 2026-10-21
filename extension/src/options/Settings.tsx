import React, { useEffect, useState } from 'react';
import { Language } from '../shared/types';
import { LANGUAGES } from '../shared/constants';
import {
  GlobeIcon,
  SpeakerIcon,
  LockIcon,
  TrashIcon,
  CheckCircleIcon,
  SignOutIcon,
} from '../shared/icons';
import { signOutCurrentUser } from '../shared/auth-init';
import { apiDeleteChatHistory, apiUpdatePreferences } from '../background/api-client';

export const Settings: React.FC = () => {
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('en');
  const [voiceSpeed, setVoiceSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['default_language', 'voice_speed', 'user_profile'], (res) => {
        if (res.default_language) setDefaultLanguage(res.default_language);
        if (res.voice_speed) setVoiceSpeed(res.voice_speed);
        if (res.user_profile) setUserEmail(res.user_profile.email);
      });
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setDefaultLanguage(lang);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ default_language: lang });
    }
    apiUpdatePreferences({ defaultLanguage: lang }).catch(() => {});
    showSavedNotification();
  };

  const handleSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    setVoiceSpeed(speed);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ voice_speed: speed });
    }
    apiUpdatePreferences({ voiceSpeed: speed }).catch(() => {});
    showSavedNotification();
  };

  const showSavedNotification = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleVoicePreview = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let text = 'This is a sample voice preview from FormAssist.';
      let voiceLang = 'en-US';

      if (defaultLanguage === 'hi') {
        text = 'यह फॉर्मअसिस्ट से एक आवाज़ पूर्वावलोकन है।';
        voiceLang = 'hi-IN';
      } else if (defaultLanguage === 'mr') {
        text = 'हे फॉर्मअसिस्ट कडून एक आवाज पूर्वावलोकन आहे.';
        voiceLang = 'mr-IN';
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLang;
      utterance.rate = voiceSpeed === 'slow' ? 0.8 : voiceSpeed === 'fast' ? 1.25 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSignOut = async () => {
    await signOutCurrentUser();
    setUserEmail(null);
  };

  const handleClearChatHistory = async () => {
    if (window.confirm('Are you sure you want to permanently delete all your chat messages?')) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['chat_sessions', 'chat_history']);
      }
      await apiDeleteChatHistory();
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 px-4">
      {/* Page Title */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-border-subtle">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-primary-container leading-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Customize how FormAssist reads and explains forms to you.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-source-official-bg text-source-official text-[11px] font-bold animate-fadeIn">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            <span>Saved</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Account Section */}
        <div className="bg-surface-card p-4 rounded-xl border border-border-subtle shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-text-primary">
              Account
            </h2>
            {userEmail && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 text-[11px] font-semibold text-danger hover:underline"
              >
                <SignOutIcon className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-2.5 bg-surface-page rounded-lg border border-border-subtle">
            <div>
              <span className="text-[11px] font-medium text-text-secondary block">
                {userEmail ? 'Signed in as' : 'Status'}
              </span>
              <span className="text-xs font-bold text-text-primary">
                {userEmail || 'Guest (Not signed in)'}
              </span>
            </div>

            {!userEmail && (
              <button
                type="button"
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/index.html') })}
                className="px-3 py-1.5 bg-primary-container text-white text-xs font-semibold rounded-lg hover:bg-primary-pressed transition-all"
              >
                Create Account
              </button>
            )}
          </div>
        </div>

        {/* Saved Language Section */}
        <div className="bg-surface-card p-4 rounded-xl border border-border-subtle shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <GlobeIcon className="w-4 h-4 text-primary-container" />
            <h2 className="font-display font-bold text-sm text-text-primary">
              Saved Language
            </h2>
          </div>
          <p className="text-[11px] text-text-secondary leading-normal">
            Default language for all form explanations and audio voiceovers across all visits.
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {LANGUAGES.map((lang) => {
              const isSelected = defaultLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`py-2 px-2.5 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-primary-container bg-primary-tint/30 text-primary-container font-bold shadow-xs'
                      : 'border-border-subtle hover:border-border-strong text-text-primary font-medium'
                  }`}
                >
                  <span className={`block text-sm ${lang.code !== 'en' ? 'script-devanagari font-bold' : ''}`}>
                    {lang.nativeLabel}
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">
                    {lang.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Section */}
        <div className="bg-surface-card p-4 rounded-xl border border-border-subtle shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <SpeakerIcon className="w-4 h-4 text-primary-container" />
            <h2 className="font-display font-bold text-sm text-text-primary">
              Voice Audio
            </h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Reading speed
            </label>
            <div className="flex gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSpeedChange(spd)}
                  className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-full border transition-all capitalize ${
                    voiceSpeed === spd
                      ? 'bg-primary-container text-white border-primary-container shadow-xs'
                      : 'border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleVoicePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-dim text-text-primary text-xs font-semibold border border-border-subtle transition-all"
            >
              <SpeakerIcon className="w-3.5 h-3.5" />
              <span>Listen to preview</span>
            </button>
          </div>
        </div>

        {/* Privacy & Data Management */}
        <div className="bg-surface-card p-4 rounded-xl border border-border-subtle shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <LockIcon className="w-4 h-4 text-primary-container" />
            <h2 className="font-display font-bold text-sm text-text-primary">
              Privacy & Data
            </h2>
          </div>

          <p className="text-[11px] text-text-secondary leading-relaxed">
            FormAssist operates with strict zero-knowledge principles on host web pages: your typed values, passwords, and form submissions are never logged or stored.
          </p>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Clear chat history
              </span>
              <span className="text-[11px] text-text-secondary">
                Permanently delete past questions and replies from your device.
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearChatHistory}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger-bg hover:bg-danger text-danger hover:text-white text-xs font-semibold border border-danger/30 transition-all"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Delete history</span>
            </button>
          </div>

          {clearSuccess && (
            <div className="p-2 bg-source-official-bg text-source-official text-xs font-semibold rounded-lg animate-fadeIn">
              Chat history deleted successfully.
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 text-center text-[11px] text-text-secondary">
        FormAssist v1.0.0 • Manifest V3
      </footer>
    </div>
  );
};
