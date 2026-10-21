import React from 'react';
import { Language } from '../../shared/types';
import { LANGUAGES } from '../../shared/constants';
import { LockIcon } from '../../shared/icons';

interface LanguageToggleProps {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  isLocked?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  currentLanguage,
  onSelectLanguage,
  isLocked = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex bg-surface-muted p-1 rounded-pill border border-border-subtle">
        {LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.code;
          const lockedForThis = isLocked && lang.code !== 'en';

          return (
            <button
              key={lang.code}
              type="button"
              disabled={lockedForThis}
              onClick={() => !lockedForThis && onSelectLanguage(lang.code)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-pill text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-primary-container text-white shadow-sm'
                  : lockedForThis
                  ? 'text-text-disabled cursor-not-allowed opacity-60'
                  : 'text-text-primary hover:text-primary-container'
              } ${lang.code !== 'en' ? 'script-devanagari' : ''}`}
            >
              <span>{lang.nativeLabel}</span>
              {lockedForThis && <LockIcon className="w-3.5 h-3.5 text-text-disabled" />}
            </button>
          );
        })}
      </div>
      {isLocked && (
        <p className="text-xs text-text-secondary text-center px-2">
          Sign in to save Hindi and Marathi preferences.
        </p>
      )}
    </div>
  );
};
