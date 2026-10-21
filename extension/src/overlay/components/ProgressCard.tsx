import React from 'react';
import { Language } from '../../shared/types';
import { SparklesIcon, CheckCircleIcon } from '../../shared/icons';
import { getTranslation } from '../../shared/i18n';

interface ProgressCardProps {
  language: Language;
  step: 1 | 2 | 3;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ language, step }) => {
  const t = getTranslation(language);

  const stepLabels = [t.working.step1, t.working.step2, t.working.step3];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2147483640,
      }}
      className={`bg-surface-card p-4 rounded-card border border-border-subtle shadow-float max-w-xs animate-fadeIn ${
        language !== 'en' ? 'script-devanagari' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <SparklesIcon className="w-5 h-5 text-primary-container animate-pulse" />
        <span className="font-display font-bold text-sm text-primary-container">
          FormAssist is analyzing...
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
        <div className="w-4 h-4 rounded-full bg-primary-container text-white flex items-center justify-center text-[10px]">
          {step}
        </div>
        <span>{stepLabels[step - 1]}</span>
      </div>
    </div>
  );
};
