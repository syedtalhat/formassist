import React from 'react';
import { Language } from '../../shared/types';

interface LanguageStepProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onNext: () => void;
  onBack: () => void;
}

const langData: Record<Language, { status: string; source: string; body: string; listen: string; more: string }> = {
  en: {
    status: 'Required',
    source: 'From this page',
    body: 'Total yearly income of everyone in your family, in rupees.',
    listen: 'Listen',
    more: 'Details',
  },
  hi: {
    status: 'ज़रूरी',
    source: 'इसी पेज से',
    body: 'आपके परिवार की पूरे साल की कुल कमाई, रुपयों में।',
    listen: 'सुनें',
    more: 'और देखें',
  },
  mr: {
    status: 'आवश्यक',
    source: 'या पृष्ठावरून',
    body: 'तुमच्या कुटुंबाचे वर्षभराचे एकूण उत्पन्न, रुपयांमध्ये.',
    listen: 'ऐका',
    more: 'अधिक पहा',
  },
};

export const LanguageStep: React.FC<LanguageStepProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onNext,
  onBack,
}) => {
  const currentPreview = langData[selectedLanguage] || langData.hi;

  const handleListenPreview = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPreview.body);
      utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : selectedLanguage === 'mr' ? 'mr-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
      {/* Left Interaction Column (Downsized by 20%) */}
      <section className="lg:col-span-5 bg-surface-container-lowest p-6 lg:p-8 xl:pl-12 xl:pr-8 flex flex-col justify-between">
        <div className="max-w-[420px] w-full mx-auto flex flex-col gap-space-lg">
          {/* Progress Indicator */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption text-text-secondary text-[11px]">Step 2 of 4</span>
              <span className="font-caption text-caption text-primary font-body-strong text-[11px]">Language Selection</span>
            </div>
            <div className="flex items-center gap-1.5 w-full pt-1">
              <div className="h-1.5 flex-1 rounded-full bg-primary-container"></div>
              <div className="h-1.5 flex-1 rounded-full bg-primary-container"></div>
              <div className="h-1.5 flex-1 rounded-full bg-surface-muted"></div>
              <div className="h-1.5 flex-1 rounded-full bg-surface-muted"></div>
            </div>
          </div>

          {/* Trilingual Heading Block */}
          <div className="flex flex-col gap-1.5">
            <h1 className="font-title-1 text-title-1 text-text-primary tracking-tight">
              Which language do you read best?
            </h1>
            <div className="flex flex-col gap-0.5 pt-1">
              <p className="font-body-default text-body-default text-text-secondary leading-snug">
                आप किस भाषा में सबसे आसानी से पढ़ते हैं?
              </p>
              <p className="font-body-default text-body-default text-text-secondary leading-snug">
                तुम्ही कोणत्या भाषेत सर्वात सहज वाचता?
              </p>
            </div>
          </div>

          {/* Language Radio Options */}
          <div
            aria-label="Select preferred paperwork assistance language"
            className="flex flex-col gap-2.5"
            role="radiogroup"
          >
            {/* Card 1: English */}
            <div
              aria-checked={selectedLanguage === 'en'}
              className={`cursor-pointer h-[70px] rounded-xl px-4 flex items-center justify-between transition-all duration-150 ${
                selectedLanguage === 'en'
                  ? 'bg-primary-tint'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
              onClick={() => onSelectLanguage('en')}
              role="radio"
              tabIndex={0}
            >
              <div className="flex flex-col justify-center min-w-0 pr-3">
                <span className="font-label-default text-label-default text-text-primary">English</span>
                <span className="font-caption text-caption text-text-secondary truncate mt-0.5 text-xs">
                  Total yearly income of everyone in your family, in rupees.
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  selectedLanguage === 'en' ? 'text-primary-container' : 'text-text-disabled'
                }`}
              >
                {selectedLanguage === 'en' ? (
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                )}
              </div>
            </div>

            {/* Card 2: Hindi */}
            <div
              aria-checked={selectedLanguage === 'hi'}
              className={`cursor-pointer h-[70px] rounded-xl px-4 flex items-center justify-between transition-all duration-150 ${
                selectedLanguage === 'hi'
                  ? 'bg-primary-tint'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
              onClick={() => onSelectLanguage('hi')}
              role="radio"
              tabIndex={0}
            >
              <div className="flex flex-col justify-center min-w-0 pr-3">
                <span className="font-label-default text-label-default text-text-primary">हिन्दी</span>
                <span className="font-caption text-caption text-text-secondary truncate mt-0.5 text-xs">
                  आपके परिवार की पूरे साल की कुल कमाई, रुपयों में।
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  selectedLanguage === 'hi' ? 'text-primary-container' : 'text-text-disabled'
                }`}
              >
                {selectedLanguage === 'hi' ? (
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                )}
              </div>
            </div>

            {/* Card 3: Marathi */}
            <div
              aria-checked={selectedLanguage === 'mr'}
              className={`cursor-pointer h-[70px] rounded-xl px-4 flex items-center justify-between transition-all duration-150 ${
                selectedLanguage === 'mr'
                  ? 'bg-primary-tint'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
              onClick={() => onSelectLanguage('mr')}
              role="radio"
              tabIndex={0}
            >
              <div className="flex flex-col justify-center min-w-0 pr-3">
                <span className="font-label-default text-label-default text-text-primary">मराठी</span>
                <span className="font-caption text-caption text-text-secondary truncate mt-0.5 text-xs">
                  तुमच्या कुटुंबाचे वर्षभराचे एकूण उत्पन्न, रुपयांमध्ये.
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  selectedLanguage === 'mr' ? 'text-primary-container' : 'text-text-disabled'
                }`}
              >
                {selectedLanguage === 'mr' ? (
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
                )}
              </div>
            </div>

            <p className="font-caption text-caption text-text-secondary pt-0.5 flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-[15px]">info</span>
              <span>You can change this any time.</span>
            </p>
          </div>
        </div>

        {/* Footer Buttons (Downsized to h-[42px]) */}
        <div className="max-w-[420px] w-full mx-auto pt-6 flex items-center justify-between gap-space-md">
          <button
            onClick={onBack}
            className="h-[42px] px-space-lg rounded-lg font-label-default text-label-default text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back</span>
          </button>
          <button
            onClick={onNext}
            className="h-[42px] px-space-2xl rounded-lg bg-primary-container hover:bg-primary-pressed text-text-on-primary font-label-default text-label-default shadow-xs transition-all flex items-center justify-center gap-space-xs cursor-pointer text-xs"
            type="button"
          >
            <span>Continue</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Right Live Preview Canvas (Downsized by 20%) */}
      <section className="lg:col-span-7 bg-primary-tint/70 p-5 lg:p-8 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Contextual Document Canvas Backdrop Wireframe */}
        <div className="w-full max-w-[380px] bg-surface-container-lowest/60 rounded-xl p-space-lg flex flex-col gap-3 mb-space-md select-none pointer-events-none opacity-80">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-surface-container-highest rounded"></div>
            <div className="h-3 w-10 bg-surface-container-high rounded"></div>
          </div>
          <div className="h-8 w-full bg-surface-container-low rounded-lg"></div>
          <div className="flex flex-col gap-1 pt-0.5">
            <div className="h-2.5 w-40 bg-surface-container rounded"></div>
            <div className="h-2.5 w-52 bg-surface-container-low rounded"></div>
          </div>
        </div>

        {/* Live Floating Tooltip Companion Card */}
        <div
          className="w-full max-w-[280px] bg-surface-card rounded-xl p-4 shadow-float -mt-8 z-10 transition-all duration-300"
          id="preview-tooltip"
        >
          {/* Card Top Bar: Chips and Metadata */}
          <div className="flex items-center justify-between mb-3">
            {/* Required Status Tag */}
            <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-primary-tint text-tag-required font-caption text-caption font-body-strong text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-tag-required"></span>
              <span>{currentPreview.status}</span>
            </div>
            {/* Provenance Pill: From Page */}
            <div className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-source-page-bg text-source-page font-caption text-caption font-body-strong text-[11px]">
              <span className="material-symbols-outlined text-[14px]">article</span>
              <span>{currentPreview.source}</span>
            </div>
          </div>

          {/* Field Title Metadata */}
          <div className="mb-1">
            <span className="font-caption text-caption text-text-secondary tracking-wide uppercase font-body-strong text-[10px]">
              ANNUAL HOUSEHOLD INCOME
            </span>
          </div>

          {/* Clear Marginalia Plain Language Text */}
          <div className="mb-3.5">
            <p className="font-body-default text-body-default text-text-primary leading-relaxed font-body-strong text-xs">
              {currentPreview.body}
            </p>
          </div>

          {/* Bottom Tactile Companion Controls */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleListenPreview}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-caption text-caption font-body-strong flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">volume_up</span>
              <span>{currentPreview.listen}</span>
            </button>
            <button
              className="h-8 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-text-secondary font-caption text-caption font-body-strong flex items-center gap-1 transition-colors cursor-pointer text-xs"
              type="button"
            >
              <span>{currentPreview.more}</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
        </div>

        {/* Subtle Guide Caption Below Card */}
        <div className="mt-4 flex items-center gap-1.5 text-text-secondary font-caption text-caption text-xs">
          <span className="material-symbols-outlined text-primary text-[16px]">visibility</span>
          <span>Live marginal assistant preview</span>
        </div>
      </section>
    </div>
  );
};
