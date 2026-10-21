import React from 'react';
import { Language } from '../../shared/types';
import { LanguageToggle } from './LanguageToggle';
import { ScanIcon, SettingsIcon, SparklesIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface IdleViewProps {
  language: Language;
  userName?: string;
  currentDomain: string;
  onExplainClick: () => void;
  onLanguageChange: (lang: Language) => void;
  onOpenSettings: () => void;
}

export const IdleView: React.FC<IdleViewProps> = ({
  language,
  userName = 'Friend',
  currentDomain,
  onExplainClick,
  onLanguageChange,
  onOpenSettings,
}) => {
  const t = getTranslation(language);

  return (
    <div className="flex flex-col min-h-[380px] p-4 justify-between bg-surface-page text-text-primary">
      <div>
        {/* Header with Settings Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-control bg-primary-container flex items-center justify-center text-white shadow-xs">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none text-primary-container">
                FormAssist
              </h1>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {t.idle.greeting} <span className="font-semibold text-text-primary">{userName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-control transition-all"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Current Domain Card */}
        <div className="bg-surface-card p-3.5 rounded-card border border-border-subtle shadow-xs mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-source-official" />
            <span>{currentDomain || 'Current Page'}</span>
          </div>

          <h2 className="font-display font-bold text-base text-text-primary mb-2.5">
            {t.idle.helperActive}
          </h2>

          <button
            type="button"
            onClick={onExplainClick}
            className="w-full flex items-center justify-center gap-2 h-10 bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-sm transition-all shadow-xs focus-ring"
          >
            <ScanIcon className="w-4 h-4" />
            <span>{t.idle.explainCta}</span>
          </button>
        </div>

        {/* Unlocked Language Switcher */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Language
            </label>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs text-primary-container hover:underline font-semibold"
            >
              {t.idle.changeLanguage}
            </button>
          </div>
          <LanguageToggle
            currentLanguage={language}
            onSelectLanguage={onLanguageChange}
            isLocked={false}
          />
          <p className="text-xs text-text-secondary mt-1.5 text-center">
            {t.idle.visitNote}
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-3 border-t border-border-subtle text-center text-xs text-text-secondary">
        FormAssist • Plain language assistant
      </div>
    </div>
  );
};
