import React, { useState } from 'react';
import { Language } from '../shared/types';
import { WelcomeStep } from './steps/WelcomeStep';
import { LanguageStep } from './steps/LanguageStep';
import { PrivacyStep } from './steps/PrivacyStep';
import { AccountStep } from './steps/AccountStep';
import { CheckCircleIcon } from '../shared/icons';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [language, setLanguage] = useState<Language>('en');
  const [completed, setCompleted] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const handleFinish = (email: string | null) => {
    setUserEmail(email);
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-page">
        <div className="bg-surface-card p-8 rounded-card border border-border-subtle shadow-float max-w-md w-full text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-source-official-bg text-source-official flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-primary-container">
            You're all set!
          </h1>
          <p className="font-body text-sm text-text-secondary leading-relaxed">
            {userEmail
              ? `FormAssist is active for ${userEmail}. Whenever you visit a form, click the FormAssist icon in your browser toolbar to get plain-language guidance.`
              : 'FormAssist is active. Whenever you visit a form, click the FormAssist icon in your browser toolbar to get plain-language guidance.'}
          </p>

          <button
            type="button"
            onClick={() => window.close()}
            className="w-full h-12 mt-2 bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-base transition-all shadow-sm focus-ring"
          >
            Close and start browsing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 max-w-6xl mx-auto">
      {/* Top Header & Progress Stepper */}
      <header className="flex items-center justify-between py-4 border-b border-border-subtle">
        <div className="font-display font-black text-2xl text-primary-container">
          FormAssist
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-pill transition-all ${
                s === step
                  ? 'w-8 bg-primary-container'
                  : s < step
                  ? 'w-4 bg-source-official'
                  : 'w-4 bg-surface-muted'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Step Contents */}
      <main className="flex-1 flex items-center justify-center my-6">
        {step === 1 && (
          <WelcomeStep
            onNext={() => setStep(2)}
            onAlreadyHaveAccount={() => setStep(4)}
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
            onFinish={handleFinish}
            onBack={() => setStep(3)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-text-secondary border-t border-border-subtle">
        FormAssist • Chrome Extension • Built with respect for your privacy
      </footer>
    </div>
  );
};
