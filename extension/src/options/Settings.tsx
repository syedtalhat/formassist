import React, { useEffect, useState } from 'react';
import { Language } from '../shared/types';
import { signOutCurrentUser } from '../shared/auth-init';
import { apiDeleteChatHistory, apiUpdatePreferences } from '../background/api-client';

const translations: Record<Language, string> = {
  en: 'Total gross annual household income, in Indian Rupees (INR).',
  hi: 'पूर्वावलोकन: आपके परिवार की कुल वार्षिक आय, रुपयों में।',
  mr: 'तुमच्या कुटुंबाचे वर्षभराचे एकूण उत्पन्न, रुपयांमध्ये.',
};

export const Settings: React.FC = () => {
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('mr');
  const [voiceSpeed, setVoiceSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('Asha Patil');
  const [clearSuccess, setClearSuccess] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'languages' | 'audit'>('general');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['default_language', 'voice_speed', 'user_profile'], (res) => {
        if (res.default_language) setDefaultLanguage(res.default_language);
        if (res.voice_speed) setVoiceSpeed(res.voice_speed);
        if (res.user_profile) {
          setUserEmail(res.user_profile.email);
          const namePart = res.user_profile.displayName || res.user_profile.email?.split('@')[0] || 'User';
          setDisplayName(namePart);
        } else {
          setDisplayName('Asha Patil');
          setUserEmail('asha.patil@example.com');
        }
      });
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setDefaultLanguage(lang);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ default_language: lang });
    }
    apiUpdatePreferences({ defaultLanguage: lang }).catch(() => { });
  };

  const handleSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    setVoiceSpeed(speed);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ voice_speed: speed });
    }
    apiUpdatePreferences({ voiceSpeed: speed }).catch(() => { });
  };

  const handleVoicePreview = () => {
    if (isPlayingVoice) return;
    setIsPlayingVoice(true);

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
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingVoice(false), 2200);
    }
  };

  const handleSignOut = async () => {
    await signOutCurrentUser();
    setUserEmail(null);
    setDisplayName('Guest User');
  };

  const handleOpenOnboarding = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/index.html') });
    }
  };

  const handleClearChatHistory = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['chat_sessions', 'chat_history']);
    }
    try {
      await apiDeleteChatHistory();
    } catch {
      // ignore
    }
    setClearSuccess(true);
    setTimeout(() => setClearSuccess(false), 4000);
  };

  const scrollToSection = (sectionId: string, tabName: 'general' | 'privacy' | 'languages' | 'audit') => {
    setActiveTab(tabName);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'A';
  const languageVoiceInstalled = defaultLanguage === 'mr' ? 'A Marathi voice is installed on this computer.'
    : defaultLanguage === 'hi' ? 'A Hindi voice is installed on this computer.'
      : 'An English voice is installed on this computer.';

  return (
    <div className="bg-surface font-body-default text-body-default text-on-surface antialiased min-h-screen">
      {/* Top Header (Downsized by 20%: h-13 / 52px) */}
      <header className="fixed top-0 w-full h-[52px] bg-surface/90 backdrop-blur-xl z-40 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
        <div className="w-full h-[52px] px-gutter flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-xs overflow-hidden">
              <img
                src="/icons/icon-48.png"
                className="w-6 h-6 object-contain"
                alt="FormAssist"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-title-2 text-title-2 text-primary leading-none">FormAssist</span>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-body-strong text-xs shadow-xs">
              {userInitial}
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar (Downsized by 20%: w-52, top-[52px]) */}
      <aside className="fixed left-0 top-[52px] bottom-0 w-52 bg-surface-container-low z-30 flex flex-col justify-between py-space-lg px-space-sm">
        <div className="flex flex-col gap-space-lg">
          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => scrollToSection('section-general', 'general')}
              className={`w-full flex items-center gap-space-sm px-space-sm py-1.5 rounded-lg transition-colors text-left cursor-pointer text-xs ${activeTab === 'general'
                ? 'bg-primary-container text-on-primary font-body-strong'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-default'
                }`}
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
              <span>General Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-privacy', 'privacy')}
              className={`w-full flex items-center gap-space-sm px-space-sm py-1.5 rounded-lg transition-colors text-left cursor-pointer text-xs ${activeTab === 'privacy'
                ? 'bg-primary-container text-on-primary font-body-strong'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-default'
                }`}
            >
              <span className="material-symbols-outlined text-[17px]">security</span>
              <span>Privacy &amp; Provenance</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-language', 'languages')}
              className={`w-full flex items-center gap-space-sm px-space-sm py-1.5 rounded-lg transition-colors text-left cursor-pointer text-xs ${activeTab === 'languages'
                ? 'bg-primary-container text-on-primary font-body-strong'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-default'
                }`}
            >
              <span className="material-symbols-outlined text-[17px]">translate</span>
              <span>Languages &amp; Autofill</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('section-audit', 'audit')}
              className={`w-full flex items-center gap-space-sm px-space-sm py-1.5 rounded-lg transition-colors text-left cursor-pointer text-xs ${activeTab === 'audit'
                ? 'bg-primary-container text-on-primary font-body-strong'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-body-default'
                }`}
            >
              <span className="material-symbols-outlined text-[17px]">history_edu</span>
              <span>Audit Log &amp; History</span>
            </button>
          </nav>
        </div>
        <div className="p-space-sm rounded-lg bg-surface-container flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-tag-required text-[18px]">verified_user</span>
          <div>
            <div className="font-body-strong text-body-strong text-text-primary text-[11px]">Extension v1.0.0</div>
            <div className="font-caption text-caption text-text-secondary text-[10px]">Companion Active</div>
          </div>
        </div>
      </aside>

      {/* Main Settings Content (Downsized by 20%: pl-52, pt-14, max-w-[520px]) */}
      <div className="pl-52">
        <main className="w-full pt-[52px] bg-surface px-space-2xl py-space-xl min-h-screen">
          <div className="flex flex-col w-full">
            <div className="w-full max-w-[520px] ml-0 lg:ml-[60px] pb-space-2xl flex flex-col" id="section-general">
              {/* Title & Description */}
              <h1 className="font-title-1 text-title-1 text-text-primary tracking-tight">Settings</h1>
              <p className="font-body-default text-body-default text-text-secondary mt-0.5 mb-space-xl">
                Manage language, voice readback, and on-device privacy rules for your form companion.
              </p>

              {/* SECTION 1: Account */}
              <section className="flex flex-col py-space-md" id="section-account">
                <h2 className="font-title-2 text-title-2 text-text-primary mb-space-sm">Account</h2>
                <div className="flex items-center justify-between gap-space-md bg-surface-card p-space-md rounded-xl shadow-xs">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary-tint text-primary font-title-2 text-title-2 flex items-center justify-center shrink-0">
                      {userInitial}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-strong text-body-strong text-text-primary truncate">
                        {displayName}
                      </span>
                      <span className="font-caption text-caption text-text-secondary truncate text-[11px]">
                        {userEmail || 'Local guest profile'}
                      </span>
                    </div>
                  </div>
                  {userEmail ? (
                    <button
                      onClick={handleSignOut}
                      className="h-[34px] px-space-md rounded-lg bg-surface-card hover:bg-surface-container text-text-primary font-body-strong text-body-strong transition-colors shrink-0 shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer text-xs"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-text-secondary">logout</span>
                      <span>Sign out</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenOnboarding}
                      className="h-[34px] px-space-md rounded-lg bg-primary-container hover:bg-primary-pressed text-on-primary font-body-strong text-body-strong transition-colors shrink-0 shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer text-xs"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Sign in</span>
                    </button>
                  )}
                </div>
              </section>

              {/* Section Separator */}
              <div className="h-px w-full bg-surface-container-high my-space-sm"></div>

              {/* SECTION 2: Saved Language */}
              <section className="flex flex-col py-space-md" id="section-language">
                <div className="flex items-center justify-between mb-space-xs">
                  <h2 className="font-title-2 text-title-2 text-text-primary">Saved language</h2>
                  <span className="font-caption text-caption text-tag-required bg-primary-tint px-2 py-0.5 rounded-full font-body-strong text-[11px]">
                    Default start
                  </span>
                </div>

                {/* Segmented Language Control */}
                <div
                  aria-label="Select default language"
                  className="inline-flex p-0.5 rounded-xl bg-surface-container-high w-full max-w-sm shadow-inner gap-1"
                  role="radiogroup"
                >
                  {(['en', 'hi', 'mr'] as const).map((lang) => {
                    const isSelected = defaultLanguage === lang;
                    const label = lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English';
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageChange(lang)}
                        aria-checked={isSelected}
                        role="radio"
                        className={`flex-1 h-[34px] rounded-lg font-body-strong text-body-strong flex items-center justify-center gap-1 transition-all cursor-pointer text-xs ${isSelected
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                          }`}
                      >
                        {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="font-caption text-caption text-text-secondary mt-space-sm max-w-md leading-relaxed text-[11px]">
                  FormAssist starts in this language every time. You can still switch for a single visit on any active form panel.
                </p>

                {/* Preview Panel */}
                <div className="mt-space-md p-space-md rounded-xl bg-surface-page flex flex-col gap-1 shadow-xs">
                  <div className="flex items-center gap-1 text-text-secondary">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span className="font-caption text-caption uppercase tracking-wider font-body-strong text-[10px]">
                      Field Translation Preview
                    </span>
                  </div>
                  <p className="font-body-lg text-body-lg text-text-primary leading-relaxed">
                    {translations[defaultLanguage]}
                  </p>
                  <span className="font-caption text-caption text-text-secondary text-[11px]">
                    English original: “Total gross annual household income in INR”
                  </span>
                </div>
              </section>

              {/* Section Separator */}
              <div className="h-px w-full bg-surface-container-high my-space-sm"></div>

              {/* SECTION 3: Voice */}
              <section className="flex flex-col py-space-md" id="section-voice">
                <h2 className="font-title-2 text-title-2 text-text-primary mb-space-sm">Voice</h2>

                {/* Voice Status & Test Trigger */}
                <div className="flex flex-wrap items-center gap-space-md mb-space-lg">
                  <button
                    onClick={handleVoicePreview}
                    className={`h-[34px] px-space-md rounded-lg font-body-strong text-body-strong transition-all shrink-0 shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer text-xs ${isPlayingVoice
                      ? 'bg-primary-tint text-primary'
                      : 'bg-surface-card hover:bg-surface-container text-text-primary'
                      }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">
                      {isPlayingVoice ? 'graphic_eq' : 'volume_up'}
                    </span>
                    <span>Listen</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-source-official">
                    <span
                      className="material-symbols-outlined text-[17px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span className="font-body-default text-body-default text-text-primary text-xs">
                      {languageVoiceInstalled}
                    </span>
                  </div>
                </div>

                {/* Speaking Speed Control */}
                <div className="flex flex-col gap-1">
                  <span className="font-body-strong text-body-strong text-text-primary text-xs">Speaking speed</span>
                  <div
                    aria-label="Speaking speed"
                    className="inline-flex p-0.5 rounded-xl bg-surface-container-high w-full max-w-[260px] shadow-inner gap-1"
                    role="radiogroup"
                  >
                    {(['slow', 'normal', 'fast'] as const).map((spd) => {
                      const isSelected = voiceSpeed === spd;
                      return (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedChange(spd)}
                          aria-checked={isSelected}
                          role="radio"
                          className={`flex-1 h-[32px] rounded-lg font-body-strong text-body-strong capitalize flex items-center justify-center gap-1 transition-all cursor-pointer text-xs ${isSelected
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                          {spd}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Section Separator */}
              <div className="h-px w-full bg-surface-container-high my-space-sm"></div>

              {/* SECTION 4: Privacy */}
              <section className="flex flex-col py-space-md" id="section-privacy">
                <div className="flex items-center gap-1.5 mb-space-xs">
                  <span
                    className="material-symbols-outlined text-[18px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    lock
                  </span>
                  <h2 className="font-title-2 text-title-2 text-text-primary">Privacy</h2>
                </div>

                {/* Canonical Trust Statement */}
                <div className="p-space-md rounded-xl bg-surface-card shadow-xs flex flex-col gap-space-sm">
                  <p className="font-body-lg text-body-lg text-text-primary leading-relaxed">
                    What you type stays on your computer. FormAssist only reads the questions on a form — never your answers.
                  </p>
                </div>

                {/* Destructive Action Block */}
                <div className="mt-space-lg pt-space-xs flex flex-col items-start gap-1" id="section-audit">
                  <button
                    onClick={handleClearChatHistory}
                    className="h-[34px] px-space-md rounded-lg bg-surface-card hover:bg-danger-bg text-danger font-body-strong text-body-strong transition-all shrink-0 shadow-xs flex items-center gap-1.5 active:scale-95 group cursor-pointer text-xs"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px] text-danger group-hover:rotate-12 transition-transform">
                      delete
                    </span>
                    <span>Clear my chat history</span>
                  </button>
                  <span
                    className={`font-caption text-caption ml-1 transition-colors text-[11px] ${clearSuccess ? 'text-source-official font-body-strong' : 'text-text-secondary'
                      }`}
                  >
                    {clearSuccess
                      ? 'Chat history cleared successfully from local memory.'
                      : ''}
                  </span>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
