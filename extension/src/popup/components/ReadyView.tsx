import React from 'react';
import { Language, FormAnalysisResult } from '../../shared/types';
import { LanguageToggle } from './LanguageToggle';
import { AlertTriangleIcon, ChatIcon, CheckCircleIcon, SparklesIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface ReadyViewProps {
  language: Language;
  analysisResult: FormAnalysisResult;
  onOpenChat: () => void;
  onLanguageChange: (lang: Language) => void;
  onDeactivate: () => void;
}

export const ReadyView: React.FC<ReadyViewProps> = ({
  language,
  analysisResult,
  onOpenChat,
  onLanguageChange,
  onDeactivate,
}) => {
  const t = getTranslation(language);

  const fieldCount = Object.keys(analysisResult.fields).length;
  const unusualCount = Object.values(analysisResult.tags).filter((tag) => tag === 'unusual').length;

  return (
    <div className="flex flex-col min-h-[380px] p-4 justify-between bg-surface-page text-text-primary">
      <div>
        {/* Status Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-control bg-primary-container flex items-center justify-center text-white shadow-xs">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none text-primary-container">
                FormAssist
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-source-official animate-pulse" />
                <span className="text-[11px] font-semibold text-source-official">
                  {t.ready.badge}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDeactivate}
            className="text-[11px] font-semibold text-text-secondary hover:text-danger px-2 py-0.5 rounded hover:bg-surface-muted transition-all"
          >
            Turn off
          </button>
        </div>

        {/* Status Summary Card */}
        <div className="bg-surface-card p-3.5 rounded-card border border-border-subtle shadow-xs mb-3">
          <div className="flex items-center gap-2 mb-2 text-source-official">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <h2 className="font-display font-bold text-base text-text-primary">
              {t.ready.summary.replace('{count}', String(fieldCount))}
            </h2>
          </div>

          {unusualCount > 0 && (
            <div className="mt-2.5 p-2.5 rounded-control bg-tag-unusual-bg border border-accent-marigold/40 flex items-start gap-2 text-tag-unusual">
              <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-snug">
                {unusualCount === 1
                  ? t.ready.unusualWarning.replace('{count}', '1')
                  : t.ready.unusualWarningPlural.replace('{count}', String(unusualCount))}
              </p>
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full flex items-center justify-center gap-2 h-11 bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-sm transition-all shadow-sm focus-ring"
            >
              <ChatIcon className="w-4 h-4" />
              <span>{t.ready.askQuestion}</span>
            </button>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="mb-2">
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Language
          </label>
          <LanguageToggle
            currentLanguage={language}
            onSelectLanguage={onLanguageChange}
            isLocked={false}
          />
          <p className="text-xs text-text-secondary mt-1.5 text-center">
            {t.ready.switchNotice}
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-text-secondary pt-3 border-t border-border-subtle">
        Field descriptions are shown next to each input
      </div>
    </div>
  );
};
