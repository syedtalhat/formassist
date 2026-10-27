import React, { useState } from 'react';
import { Language } from '../shared/types';
import { WelcomeStep } from './steps/WelcomeStep';
import { LanguageStep } from './steps/LanguageStep';
import { PrivacyStep } from './steps/PrivacyStep';
import { AccountStep } from './steps/AccountStep';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [language, setLanguage] = useState<Language>('hi');
  const [completed, setCompleted] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accountInitialMode, setAccountInitialMode] = useState<'create' | 'signin'>('create');

  const handleFinish = (email: string | null) => {
    setUserEmail(email);
    setCompleted(true);
  };

  return (
    <div className="bg-surface font-body-default text-body-default text-on-surface antialiased min-h-screen flex flex-col justify-between">
      {/* Top Header (Downsized by 20%) */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_1px_6px_rgba(14,90,100,0.04)]">
        <div className="h-[52px] max-w-[1150px] mx-auto px-margin flex items-center justify-between">
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
              <span className="font-title-2 text-title-2 text-primary leading-tight">FormAssist</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full flex-1 max-w-[1150px] mx-auto px-margin py-space-md">
        {completed ? (
          <div className="w-full max-w-md mx-auto py-8 flex flex-col items-center">
            <div className="bg-surface-card p-6 rounded-xl border border-border-subtle shadow-float w-full text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-source-official-bg text-source-official flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div className="space-y-1.5">
                <h1 className="font-title-1 text-title-1 text-primary-container tracking-tight">
                  You're all set!
                </h1>
                <p className="font-body-default text-body-default text-text-secondary leading-relaxed text-xs">
                  {userEmail
                    ? `FormAssist is active for ${userEmail}. When you open any official form, FormAssist will sit beside the page and explain every question in simple words.`
                    : 'FormAssist is active in guest mode. When you open any official form, FormAssist will sit beside the page and explain every question in simple words.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.close()}
                className="w-full h-[42px] bg-primary-container hover:bg-primary-pressed text-text-on-primary font-body-strong text-body-strong rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <span>Close and start browsing</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {step === 1 && (
              <WelcomeStep
                onNext={() => setStep(2)}
                onAlreadyHaveAccount={() => {
                  setAccountInitialMode('signin');
                  setStep(4);
                }}
              />
            )}
            {step === 2 && (
              <LanguageStep
                selectedLanguage={language}
                onSelectLanguage={setLanguage}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <PrivacyStep
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <AccountStep
                selectedLanguage={language}
                initialMode={accountInitialMode}
                onFinish={handleFinish}
                onBack={() => setStep(3)}
                onBackToLanguage={() => setStep(2)}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-space-lg text-center font-caption text-caption text-text-secondary">
        © 2026 FormAssist
      </footer>
    </div>
  );
};
