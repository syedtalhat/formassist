import React from 'react';
import { Language } from '../../shared/types';
import { LanguageToggle } from './LanguageToggle';
import { ScanIcon, SparklesIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface SignedOutViewProps {
  language: Language;
  onExplainClick: () => void;
  onLanguageChange: (lang: Language) => void;
  onOpenOnboarding: () => void;
}

export const SignedOutView: React.FC<SignedOutViewProps> = ({
  language,
  onExplainClick,
  onLanguageChange,
  onOpenOnboarding,
}) => {
  const t = getTranslation(language);

  return (
    <div className="flex flex-col min-h-[380px] p-4 justify-between bg-surface-page text-text-primary">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-control bg-primary-container flex items-center justify-center text-white shadow-xs">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-primary-container">
              FormAssist
            </h1>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-surface-card p-3.5 rounded-card border border-border-subtle shadow-xs mb-3">
          <h2 className="font-display font-bold text-base text-text-primary mb-1">
            {t.signedOut.title}
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            {t.signedOut.description}
          </p>

          <button
            type="button"
            onClick={onExplainClick}
            className="w-full flex items-center justify-center gap-2 h-10 bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-sm transition-all shadow-xs focus-ring"
          >
            <ScanIcon className="w-4 h-4" />
            <span>{t.signedOut.explainCta}</span>
          </button>
        </div>

        {/* Quick Language Toggle */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            {t.signedOut.quickLanguage}
          </label>
          <LanguageToggle
            currentLanguage={language}
            onSelectLanguage={onLanguageChange}
            isLocked={true}
          />
        </div>
      </div>

      {/* Footer Authentication */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenOnboarding}
          className="text-sm font-semibold text-primary-container hover:underline"
        >
          {t.signedOut.signIn}
        </button>

        <button
          type="button"
          onClick={onOpenOnboarding}
          className="px-3.5 py-1.5 bg-surface-muted hover:bg-surface-dim text-text-primary rounded-control text-sm font-semibold border border-border-subtle transition-all"
        >
          {t.signedOut.createAccount}
        </button>
      </div>
    </div>
  );
};
