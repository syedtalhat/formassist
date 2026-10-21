import React from 'react';
import { Language } from '../../shared/types';
import { ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon } from '../../shared/icons';

interface LanguageStepProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onNext: () => void;
  onBack: () => void;
}

const LANGUAGE_OPTIONS: {
  code: Language;
  title: string;
  nativeTitle: string;
  sample: string;
}[] = [
  {
    code: 'en',
    title: 'English',
    nativeTitle: 'English',
    sample: 'Total combined annual income of all parents/guardians from all sources.',
  },
  {
    code: 'hi',
    title: 'Hindi',
    nativeTitle: 'हिन्दी',
    sample: 'सभी स्रोतों से परिवार के सभी सदस्यों की कुल वार्षिक आय।',
  },
  {
    code: 'mr',
    title: 'Marathi',
    nativeTitle: 'मराठी',
    sample: 'सर्व मार्गांनी मिळणारे कुटुंबातील सदस्यांचे एकूण वार्षिक उत्पन्न.',
  },
];

export const LanguageStep: React.FC<LanguageStepProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onNext,
  onBack,
}) => {
  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-8">
      <div className="text-center flex flex-col gap-2">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary-container">
          Which language do you read best?
        </h1>
        <p className="font-body text-base text-text-secondary">
          We will explain questions in this language first. You can switch anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LANGUAGE_OPTIONS.map((option) => {
          const isSelected = selectedLanguage === option.code;

          return (
            <div
              key={option.code}
              onClick={() => onSelectLanguage(option.code)}
              className={`cursor-pointer p-5 rounded-card border-2 transition-all flex flex-col justify-between min-h-[180px] bg-surface-card ${
                isSelected
                  ? 'border-primary-container shadow-float ring-2 ring-primary-tint'
                  : 'border-border-subtle hover:border-border-strong'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-display font-bold text-2xl text-text-primary ${
                      option.code !== 'en' ? 'script-devanagari' : ''
                    }`}
                  >
                    {option.nativeTitle}
                  </span>
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border-strong" />
                  )}
                </div>

                <p
                  className={`text-sm text-text-secondary leading-relaxed ${
                    option.code !== 'en' ? 'script-devanagari' : ''
                  }`}
                >
                  "{option.sample}"
                </p>
              </div>

              <span className="text-xs font-semibold text-text-disabled mt-4">
                {option.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 h-[48px] text-text-primary hover:text-primary-container font-semibold transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-8 h-[52px] bg-primary-container hover:bg-primary-pressed text-white rounded-control font-semibold text-base transition-all shadow-sm focus-ring"
        >
          <span>Continue</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
