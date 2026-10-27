import React, { useState } from 'react';
import { Language } from '../../shared/types';
import { signUpUser, signInUser } from '../../shared/auth-init';

interface AccountStepProps {
  selectedLanguage: Language;
  initialMode?: 'create' | 'signin';
  onFinish: (email: string | null) => void;
  onBack: () => void;
  onBackToLanguage: () => void;
}

export const AccountStep: React.FC<AccountStepProps> = ({
  selectedLanguage,
  initialMode = 'create',
  onFinish,
  onBackToLanguage,
}) => {
  const [isSignIn, setIsSignIn] = useState(initialMode === 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setAuthError(err?.message || 'Authentication failed. Please check your details.');
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

  const nativeLanguageName =
    selectedLanguage === 'mr' ? 'मराठी' : selectedLanguage === 'hi' ? 'हिन्दी' : 'English';

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[580px] rounded-xl overflow-hidden shadow-sm">
      {/* Left Column (Downsized by 20%) */}
      <div className="lg:col-span-5 bg-surface-container-lowest p-6 lg:p-8 xl:pl-12 xl:pr-8 flex flex-col justify-between">
        <div className="space-y-space-md">
          {/* Step Indicator */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 w-full">
              <div className="h-1.5 flex-1 rounded-full bg-primary-container"></div>
              <div className="h-1.5 flex-1 rounded-full bg-primary-container"></div>
              <div className="h-1.5 flex-1 rounded-full bg-primary-container"></div>
              <div className="h-1.5 flex-1 rounded-full bg-primary-container"></div>
            </div>
            <span className="font-caption text-caption text-text-secondary tracking-wide text-[11px]">
              Step 4 of 4 · Onboarding complete
            </span>
          </div>

          {/* Typography Heading */}
          <div className="space-y-1">
            <h1 className="font-title-1 text-title-1 text-text-primary tracking-tight">
              {isSignIn ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="font-body-default text-body-default text-text-secondary">
              {isSignIn
                ? 'Welcome back! Access your saved settings and history.'
                : 'So your language and chat history are saved.'}
            </p>
          </div>

          {/* 2-Segment Control */}
          <div aria-label="Account Action" className="p-1 rounded-lg bg-surface-muted flex gap-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignIn}
              onClick={() => {
                setIsSignIn(false);
                setAuthError(null);
              }}
              className={`flex-1 h-8 rounded-md font-label-default text-label-default flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${!isSignIn
                ? 'bg-primary-container text-text-on-primary shadow-xs'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              {!isSignIn && <span className="material-symbols-outlined text-[16px]">check</span>}
              <span>Create account</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignIn}
              onClick={() => {
                setIsSignIn(true);
                setAuthError(null);
              }}
              className={`flex-1 h-8 rounded-md font-label-default text-label-default flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${isSignIn
                ? 'bg-primary-container text-text-on-primary shadow-xs'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              {isSignIn && <span className="material-symbols-outlined text-[16px]">check</span>}
              <span>Sign in</span>
            </button>
          </div>

          {/* Language Row */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low text-xs">
            <div className="flex items-center gap-2 text-text-primary font-body-default text-body-default">
              <span className="material-symbols-outlined text-primary-container text-[18px]">translate</span>
              <span>
                Your language: <strong className="font-body-strong">{nativeLanguageName}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onBackToLanguage}
              className="font-caption text-caption text-tertiary-container hover:text-tertiary font-body-strong underline transition-colors cursor-pointer text-xs"
            >
              Change
            </button>
          </div>

          {/* Form Target Fields */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {authError && (
              <div className="p-2.5 rounded-lg bg-danger-bg border border-danger/30 text-danger text-xs font-semibold leading-relaxed">
                {authError}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="font-label-default text-label-default text-text-primary block text-xs" htmlFor="email-field">
                Email
              </label>
              <div className="relative">
                <input
                  className="w-full h-[42px] px-3.5 rounded-lg bg-surface-container-lowest text-text-primary font-body-default text-body-default shadow-xs outline-none focus:ring-2 focus:ring-primary-container placeholder:text-text-disabled transition-all border border-border-subtle text-xs"
                  id="email-field"
                  placeholder="name@example.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label
                className="font-label-default text-label-default text-text-primary block text-xs"
                htmlFor="password-field"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  className="w-full h-[42px] pl-3.5 pr-14 rounded-lg bg-surface-container-lowest text-text-primary font-body-default text-body-default shadow-xs outline-none focus:ring-2 focus:ring-primary-container placeholder:text-text-disabled transition-all border border-border-subtle text-xs"
                  id="password-field"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                />
                <button
                  className="absolute right-2 px-2 py-1 font-caption text-caption text-text-secondary hover:text-text-primary font-body-strong transition-colors cursor-pointer text-xs"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="font-caption text-caption text-text-secondary flex items-center gap-1 text-[11px]">
                <span className="material-symbols-outlined text-[15px]">info</span>
                <span>Use at least 6 characters.</span>
              </p>
            </div>

            {/* Actions */}
            <div className="pt-1 space-y-2.5">
              <button
                className="w-full h-[42px] rounded-lg bg-primary-container hover:bg-primary-pressed text-text-on-primary font-body-strong text-body-strong flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-xs"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? 'Processing...' : isSignIn ? 'Sign in' : 'Create account'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-1.5">
                <div className="w-full h-px bg-surface-variant"></div>
                <span className="absolute bg-surface-container-lowest px-2 font-caption text-caption text-text-secondary uppercase tracking-wider text-[10px]">
                  or
                </span>
              </div>

              {/* Guest Action */}
              <button
                className="w-full h-[42px] rounded-lg bg-surface-container-low hover:bg-surface-variant text-text-primary font-body-strong text-body-strong transition-all flex items-center justify-center cursor-pointer text-xs"
                type="button"
                onClick={handleContinueAsGuest}
              >
                Continue without an account
              </button>
              <p className="text-center font-caption text-caption text-text-secondary text-[11px]">
                English only. Chat history is not saved.
              </p>
            </div>
          </form>
        </div>

        <div className="pt-4 flex items-center justify-between text-text-secondary font-caption text-caption text-xs">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-source-official">lock</span>
            <span>256-bit encrypted telemetry</span>
          </span>
        </div>
      </div>

      {/* Right Canvas (Downsized by 20%) */}
      <div className="lg:col-span-7 bg-primary-tint relative p-5 lg:p-8 flex flex-col justify-between overflow-hidden">
        {/* Centerpiece: Quiet Floating Explanation Card */}
        <div className="my-auto py-space-md flex flex-col items-center justify-center relative z-10">
          {/* Underlying Mock Form Context */}
          <div className="w-full max-w-[350px] bg-surface-container-lowest/70 rounded-xl p-3 mb-[-36px] opacity-60 filter blur-[0.5px] select-none pointer-events-none">
            <div className="h-2.5 w-1/3 bg-surface-variant rounded mb-2"></div>
            <div className="h-8 w-full bg-surface-muted rounded-lg"></div>
          </div>

          {/* Floating Card (280px) */}
          <div className="w-full max-w-[280px] bg-surface-container-lowest rounded-xl p-4 shadow-float transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-primary-tint text-tag-required font-caption text-caption font-body-strong text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                <span>
                  {selectedLanguage === 'mr' ? 'आवश्यक' : selectedLanguage === 'hi' ? 'ज़रूरी' : 'Required'}
                </span>
              </span>
              <span className="font-caption text-caption text-text-secondary tracking-tight text-[11px]">
                {selectedLanguage === 'mr' ? 'कलम ४.२' : selectedLanguage === 'hi' ? 'धारा 4.2' : 'Sec 4.2'}
              </span>
            </div>
            <div className="space-y-1.5 mb-3.5">
              <p className="font-body-default text-body-default text-text-primary leading-relaxed font-body-strong text-xs">
                {selectedLanguage === 'mr'
                  ? 'तुमच्या कुटुंबाचे वर्षभराचे एकूण उत्पन्न, रुपयांमध्ये.'
                  : selectedLanguage === 'hi'
                    ? 'आपके परिवार की पूरे साल की कुल कमाई, रुपयों में।'
                    : 'Total yearly income of everyone in your family, in rupees.'}
              </p>
              <p className="font-caption text-caption text-text-secondary leading-normal text-[11px]">
                {selectedLanguage === 'mr'
                  ? 'यात कर (tax) वजा करण्यापूर्वीचे सर्व उत्पन्न समाविष्ट करा.'
                  : selectedLanguage === 'hi'
                    ? 'इसमें कर (tax) काटने से पहले की सभी आय शामिल करें।'
                    : 'Include all income before tax deductions.'}
              </p>
            </div>
            {/* Source Provenance Frame */}
            <div className="p-2.5 rounded-lg bg-source-page-bg flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-source-page font-body-strong text-caption text-xs">
                <span className="material-symbols-outlined text-[16px]">article</span>
                <span>
                  {selectedLanguage === 'mr'
                    ? 'या पृष्ठावरून'
                    : selectedLanguage === 'hi'
                      ? 'इसी पेज से'
                      : 'From this page'}
                </span>
              </div>
              <span className="font-caption text-caption text-source-page font-body-default opacity-80 text-[11px]">
                Field #14B
              </span>
            </div>
          </div>

          {/* Secondary Marginal Marker */}
          <div className="mt-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/80 text-text-secondary font-caption text-caption shadow-xs text-xs">
            <span className="material-symbols-outlined text-source-ai text-[14px]">arrow_back_ios_new</span>
            <span>
              {`Adaptive ${selectedLanguage === 'mr' ? 'Marathi' : selectedLanguage === 'hi' ? 'Hindi' : 'English'
                } translation powered by verified context`}
            </span>
          </div>
        </div>

        {/* Visual Graphic / Data Indicator at Base */}
        <div className="pt-3 z-10 flex flex-col md:flex-row items-center justify-between gap-3 bg-surface-container-lowest/60 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">shield</span>
            </div>
            <div className="flex flex-col">
              <span className="font-body-strong text-body-default text-text-primary text-xs">Zero Knowledge Overlays</span>
              <span className="font-caption text-caption text-text-secondary text-[11px]">
                Your sensitive patient paperwork never trains external models.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <svg className="w-8 h-8 transform -rotate-90 text-primary-container" viewBox="0 0 36 36">
              <path
                className="text-surface-variant stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
              ></path>
              <path
                className="stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray="100, 100"
                strokeLinecap="round"
                strokeWidth="3"
              ></path>
            </svg>
            <span className="font-caption text-caption font-body-strong text-text-primary text-xs">100% Secure</span>
          </div>
        </div>

        {/* Subtle Canvas Deco Gradient */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-fixed-dim/20 blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};
